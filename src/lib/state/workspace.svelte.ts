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

export const workspace = $state({
  rows: [] as TranslationRow[],
  batchSize: DEFAULT_BATCH_SIZE,
  batchIndex: DEFAULT_BATCH_INDEX,
  payloadJson: "",
  responseJson: "",
  responseError: "",
  diffRows: [] as DiffRow[],
});

const totalRows = $derived(workspace.rows.length);
const maxBatchIndex = $derived(Math.max(1, Math.ceil(totalRows / Math.max(1, workspace.batchSize || 1))));
const currentBatchRows = $derived((() => {
  if (!workspace.rows.length) return [] as TranslationRow[];
  const start = Math.max(0, (workspace.batchIndex - 1) * workspace.batchSize);
  return workspace.rows.slice(start, start + workspace.batchSize);
})());
const batchRangeLabel = $derived((() => {
  if (!workspace.rows.length) return "No rows loaded yet.";
  if (!currentBatchRows.length) return "This batch is empty.";
  const first = (workspace.batchIndex - 1) * workspace.batchSize + 1;
  const last = first + currentBatchRows.length - 1;
  return `Showing rows ${first}–${last} of ${totalRows}`;
})());
const isGenerateDisabled = $derived(!currentBatchRows.length);
const isParseDisabled = $derived(!workspace.responseJson.trim().length);

// NOTE: runs in the browser when the module is evaluated
if (typeof window !== "undefined") {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Partial<typeof workspace>;
      workspace.rows = parsed.rows ?? workspace.rows;
      workspace.batchSize = parsed.batchSize ?? workspace.batchSize;
      workspace.batchIndex = parsed.batchIndex ?? workspace.batchIndex;
      workspace.payloadJson = parsed.payloadJson ?? workspace.payloadJson;
      workspace.responseJson = parsed.responseJson ?? workspace.responseJson;
      workspace.responseError = parsed.responseError ?? workspace.responseError;
      workspace.diffRows = parsed.diffRows ?? workspace.diffRows;
    } catch (error) {
      console.error("Failed to restore workspace state", error);
    }
  }
}

export function handleRowsLoaded(rows: TranslationRow[]) {
  workspace.rows = rows;
  workspace.batchIndex = DEFAULT_BATCH_INDEX;
  workspace.payloadJson = "";
  workspace.responseJson = "";
  workspace.responseError = "";
  workspace.diffRows = [];
}

export function handleBatchSizeInput(event: Event) {
  const value = Number((event.currentTarget as HTMLInputElement).value) || DEFAULT_BATCH_SIZE;
  workspace.batchSize = Math.max(1, value);
  workspace.batchIndex = DEFAULT_BATCH_INDEX;
}

export function handleBatchIndexInput(event: Event) {
  const value = Number((event.currentTarget as HTMLInputElement).value) || DEFAULT_BATCH_INDEX;
  workspace.batchIndex = Math.min(Math.max(1, value), maxBatchIndex);
}

export function goToPreviousBatch() {
  workspace.batchIndex = Math.max(1, workspace.batchIndex - 1);
}

export function goToNextBatch() {
  workspace.batchIndex = Math.min(maxBatchIndex, workspace.batchIndex + 1);
}

export function generatePayload() {
  if (!currentBatchRows.length) {
    return;
  }

  const payload: ChatGptPayload = {
    meta: {
      batchSize: workspace.batchSize,
      batchIndex: workspace.batchIndex,
      totalRows,
    },
    rows: currentBatchRows.map((row) => ({
      index: row.index,
      source: row.source,
      target: row.target,
    })),
  };

  workspace.payloadJson = JSON.stringify(payload, null, 2);
}

export function handleResponseChange(nextValue: string) {
  workspace.responseJson = nextValue;
  workspace.responseError = "";
}

$effect(() => {
  if (typeof window === "undefined") return;
  const snapshot = {
    rows: workspace.rows,
    batchSize: workspace.batchSize,
    batchIndex: workspace.batchIndex,
    payloadJson: workspace.payloadJson,
    responseJson: workspace.responseJson,
    responseError: workspace.responseError,
    diffRows: workspace.diffRows,
  } satisfies typeof workspace;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
});

export function parseResponse() {
  try {
    const parsed = JSON.parse(workspace.responseJson) as ChatGptResponse;
    if (!parsed || !Array.isArray(parsed.rows)) {
      throw new Error('Response must contain a "rows" array.');
    }

    const rowMap = new Map(workspace.rows.map((row) => [row.index, row]));
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

    workspace.diffRows = nextDiffRows;
    workspace.responseError = missingFields.length
      ? `Some rows were skipped because required fields were missing: ${missingFields.join(", ")}`
      : "";
  } catch (error) {
    workspace.responseError =
      error instanceof Error
        ? error.message
        : "Failed to parse the response JSON. Please double-check the structure.";
    workspace.diffRows = [];
  }
}
