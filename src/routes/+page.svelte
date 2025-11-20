<script lang="ts">
  import { browser } from "$app/environment";
  import { CsvUploader, DiffList, PayloadPanel } from "$lib";
  import BatchControlsCard from "$lib/components/BatchControlsCard.svelte";
  import StatCard from "$lib/components/StatCard.svelte";
  import ThemeToggleButton from "$lib/components/ThemeToggleButton.svelte";
  import type {
    ChatGptPayload,
    ChatGptResponse,
    ChatGptResponseRow,
    DiffRow,
    TranslationRow,
  } from "$lib/types";
  import { computeWordDiff } from "$lib/utils/diff";
  import { Database, MoveUp } from "@lucide/svelte";

  const STORAGE_KEY = "csv-batch-diff-state";
  const DEFAULT_BATCH_SIZE = 10;
  const DEFAULT_BATCH_INDEX = 1;
  const DEFAULT_THEME: "light" | "dark" = "light";

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
        responseError = `Some rows were skipped because required fields were missing: ${missingFields.join(", ")}`;
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

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleTheme() {
    theme = theme === "dark" ? "light" : "dark";
  }
</script>

<div class="space-y-6">
  <header class="panel panel-hero">
    <div class="grid grid-cols-3 items-start justify-between gap-6">
      <div class="max-w-2xl space-y-3 col-span-2">
        <p class="text-sm font-semibold uppercase tracking-[0.3em] text-muted">Lintsune AI</p>
        <h1 class="text-3xl font-black leading-tight text-foreground">
          Batch smarter, diff faster.
        </h1>
        <p class="text-sm text-muted">
          Upload translation rows, craft JSON payloads, and visualize word-level diffs for every
          revision without leaving the browser.
        </p>
      </div>

      <div class="grid">
        <ThemeToggleButton
          {theme}
          onclick={toggleTheme}
          class="place-self-end"
        />
      </div>
      <div class="grid gap-6">
        <CsvUploader onLoaded={handleRowsLoaded} />
        <StatCard
          title="Total rows"
          value={totalRows}
          icon={Database}
        />

        <BatchControlsCard
          {batchSize}
          {batchIndex}
          {maxBatchIndex}
          hasRows={!!totalRows}
          rangeLabel={batchRangeLabel}
          onBatchSizeInput={handleBatchSizeInput}
          onBatchIndexInput={handleBatchIndexInput}
          onPrevious={goToPreviousBatch}
          onNext={goToNextBatch}
        />
      </div>
      <div class="col-span-2 gap-6 grid">
        <PayloadPanel
          {payloadJson}
          {responseJson}
          {isGenerateDisabled}
          {isParseDisabled}
          {responseError}
          onGenerate={generatePayload}
          onResponseChange={handleResponseChange}
          onParse={parseResponse}
        />
        <div class="flex flex-wrap gap-2">
          <span class="chip">Batch size: {batchSize}</span>
          <span class="chip">Current batch: #{batchIndex}</span>
          <span class="chip">{batchRangeLabel}</span>
        </div>
      </div>
    </div>
  </header>

  <main class="grid gap-6 max-w-10/12 mx-auto">
    <DiffList rows={diffRows} />
  </main>
</div>
<button
  class="btn-icon fixed bottom-6 right-6 shadow-lg"
  type="button"
  aria-label="Back to top"
  onclick={scrollToTop}
>
  <MoveUp />
</button>
