import { browser } from "$app/environment";
import type {
  ChatGptPayload,
  ChatGptResponse,
  ChatGptResponseRow,
  DiffRow,
  TranslationRow,
} from "$lib/types";
import { computeWordDiff } from "$lib/utils/diff";

const STORAGE_KEY = "csv-batch-diff-state";
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_BATCH_INDEX = 1;
const DEFAULT_THEME: "light" | "dark" = "light";

export type WorkspaceState = ReturnType<typeof createWorkspaceState>;

type PersistedState = {
  rows: TranslationRow[];
  batchSize: number;
  batchIndex: number;
  payloadJson: string;
  responseJson: string;
  responseError: string;
  diffRows: DiffRow[];
  theme: "light" | "dark";
};

export function createWorkspaceState() {
  let theme = $state<"light" | "dark">(DEFAULT_THEME);
  let allRows = $state<TranslationRow[]>([]);
  let batchSize = $state(DEFAULT_BATCH_SIZE);
  let batchIndex = $state(DEFAULT_BATCH_INDEX);
  let payloadJson = $state("");
  let responseJson = $state("");
  let responseError = $state("");
  let diffRows = $state<DiffRow[]>([]);
  let currentBatchRows = $state<TranslationRow[]>([]);
  let batchRangeLabel = $state("No rows loaded yet.");
  let hasHydratedFromStorage = !browser;

  const totalRows = $derived(allRows.length);
  const maxBatchIndex = $derived(Math.max(1, Math.ceil(totalRows / Math.max(1, batchSize || 1))));
  const isGenerateDisabled = $derived(!currentBatchRows.length);
  const isParseDisabled = $derived(!responseJson.trim().length);

  if (browser) {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const systemTheme: "light" | "dark" = prefersDark ? "dark" : "light";
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Partial<PersistedState>;
        allRows = parsed.rows ?? [];
        batchSize = parsed.batchSize ?? DEFAULT_BATCH_SIZE;
        batchIndex = parsed.batchIndex ?? DEFAULT_BATCH_INDEX;
        payloadJson = parsed.payloadJson ?? "";
        responseJson = parsed.responseJson ?? "";
        responseError = parsed.responseError ?? "";
        diffRows = parsed.diffRows ?? [];
        theme = parsed.theme ?? systemTheme;
      } catch (error) {
        console.error("Failed to restore workspace state", error);
      }
    } else {
      theme = systemTheme;
    }
    hasHydratedFromStorage = true;
  }

  $effect(() => {
    if (!browser) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  });

  $effect(() => {
    if (!allRows.length) {
      currentBatchRows = [];
      batchRangeLabel = "No rows loaded yet.";
      return;
    }
    const start = Math.max(0, (batchIndex - 1) * batchSize);
    const slice = allRows.slice(start, start + batchSize);
    currentBatchRows = slice;
    if (!slice.length) {
      batchRangeLabel = "This batch is empty.";
      return;
    }
    const first = (batchIndex - 1) * batchSize + 1;
    const last = first + slice.length - 1;
    batchRangeLabel = `Showing rows ${first}–${last} of ${totalRows}`;
  });

  $effect(() => {
    if (!browser || !hasHydratedFromStorage) {
      return;
    }
    const state: PersistedState = {
      rows: allRows,
      batchSize,
      batchIndex,
      payloadJson,
      responseJson,
      responseError,
      diffRows,
      theme,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Failed to persist workspace state", error);
    }
  });

  $effect(() => {
    if (!totalRows) {
      batchIndex = DEFAULT_BATCH_INDEX;
      return;
    }
    if (batchIndex > maxBatchIndex) {
      batchIndex = maxBatchIndex;
    }
    if (batchIndex < 1) {
      batchIndex = DEFAULT_BATCH_INDEX;
    }
  });

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark";
  }

  function handleRowsLoaded(rows: TranslationRow[]) {
    allRows = rows;
    batchIndex = 1;
    payloadJson = "";
    responseJson = "";
    responseError = "";
    diffRows = [];
  }

  function handleBatchSizeInput(event: Event) {
    const value = Number((event.currentTarget as HTMLInputElement).value) || DEFAULT_BATCH_SIZE;
    batchSize = Math.max(1, value);
    batchIndex = 1;
  }

  function handleBatchIndexInput(event: Event) {
    const value = Number((event.currentTarget as HTMLInputElement).value) || DEFAULT_BATCH_INDEX;
    batchIndex = Math.min(Math.max(1, value), maxBatchIndex);
  }

  function goToPreviousBatch() {
    if (batchIndex > 1) {
      batchIndex -= 1;
    }
  }

  function goToNextBatch() {
    if (batchIndex < maxBatchIndex) {
      batchIndex += 1;
    }
  }

  function generatePayload() {
    if (!currentBatchRows.length) {
      return;
    }

    const payload: ChatGptPayload = {
      meta: {
        batchSize,
        batchIndex,
        totalRows,
      },
      rows: currentBatchRows.map((row) => ({
        index: row.index,
        source: row.source,
        target: row.target,
      })),
    };

    payloadJson = JSON.stringify(payload, null, 2);
  }

  function handleResponseChange(nextValue: string) {
    responseJson = nextValue;
    responseError = "";
  }

  function parseResponse() {
    try {
      const parsed = JSON.parse(responseJson) as ChatGptResponse;
      if (!parsed || !Array.isArray(parsed.rows)) {
        throw new Error('Response must contain a "rows" array.');
      }

      const rowMap = new Map(allRows.map((row) => [row.index, row]));
      const nextDiffRows: DiffRow[] = [];
      const missingFields: string[] = [];

      parsed.rows.forEach((entry: ChatGptResponseRow) => {
        if (typeof entry?.index !== "number" || !Number.isFinite(entry.index)) {
          missingFields.push("invalid index value");
          return;
        }

        if (typeof entry.target_revised !== "string") {
          missingFields.push(`missing target_revised for index ${entry.index}`);
          return;
        }

        const original = rowMap.get(entry.index);
        if (!original) {
          missingFields.push(`index ${entry.index} not found in CSV`);
          return;
        }

        nextDiffRows.push({
          index: entry.index,
          originalTarget: original.target,
          revisedTarget: entry.target_revised,
          diffTokens: computeWordDiff(original.target, entry.target_revised),
        });
      });

      if (!nextDiffRows.length) {
        throw new Error("No matching rows were found in the response.");
      }

      if (missingFields.length) {
        responseError = `Some rows were skipped because required fields were missing: ${missingFields.join(
          ", "
        )}`;
      } else {
        responseError = "";
      }

      diffRows = nextDiffRows;
    } catch (error) {
      responseError =
        error instanceof Error
          ? error.message
          : "Failed to parse the response JSON. Please double-check the structure.";
      diffRows = [];
    }
  }

  return {
    get theme() {
      return theme;
    },
    toggleTheme,
    handleRowsLoaded,
    handleBatchSizeInput,
    handleBatchIndexInput,
    goToPreviousBatch,
    goToNextBatch,
    generatePayload,
    handleResponseChange,
    parseResponse,
    get batchSize() {
      return batchSize;
    },
    get batchIndex() {
      return batchIndex;
    },
    get maxBatchIndex() {
      return maxBatchIndex;
    },
    get totalRows() {
      return totalRows;
    },
    get batchRangeLabel() {
      return batchRangeLabel;
    },
    get payloadJson() {
      return payloadJson;
    },
    get responseJson() {
      return responseJson;
    },
    get responseError() {
      return responseError;
    },
    get diffRows() {
      return diffRows;
    },
    get isGenerateDisabled() {
      return isGenerateDisabled;
    },
    get isParseDisabled() {
      return isParseDisabled;
    },
    get hasRows() {
      return !!totalRows;
    },
  };
}
