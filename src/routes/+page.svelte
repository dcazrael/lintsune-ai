<script lang="ts">
  import { CsvUploader, DiffList, PayloadPanel } from "$lib";
  import BatchControlsCard from "$lib/components/BatchControlsCard.svelte";
  import StatCard from "$lib/components/StatCard.svelte";
  import ThemeToggleButton from "$lib/components/ThemeToggleButton.svelte";
  import {
    diffState,
    generatePayload,
    goToNextBatch,
    goToPreviousBatch,
    handleBatchIndexInput,
    handleBatchSizeInput,
    handleResponseChange,
    handleRowsLoaded,
    loadDiffState,
    parseResponse,
    persistDiffState,
  } from "$lib/state/diffState.svelte";
  import { useTheme } from "$lib/state/theme.svelte";
  import type { TranslationRow } from "$lib/types";
  import { Database, MoveUp } from "@lucide/svelte";

  const totalRows = $derived(diffState.rows.length);
  const maxBatchIndex = $derived(
    Math.max(1, Math.ceil(totalRows / Math.max(1, diffState.batchSize || 1)))
  );
  const currentBatchRows = $derived(
    (() => {
      if (!diffState.rows.length) return [] as TranslationRow[];
      const start = Math.max(0, (diffState.batchIndex - 1) * diffState.batchSize);
      return diffState.rows.slice(start, start + diffState.batchSize);
    })()
  );
  const batchRangeLabel = $derived(
    (() => {
      if (!diffState.rows.length) return "No rows loaded yet.";
      if (!currentBatchRows.length) return "This batch is empty.";
      const first = (diffState.batchIndex - 1) * diffState.batchSize + 1;
      const last = first + currentBatchRows.length - 1;
      return `Showing rows ${first}–${last} of ${totalRows}`;
    })()
  );
  const isGenerateDisabled = $derived(!currentBatchRows.length);
  const isParseDisabled = $derived(!diffState.responseJson.trim().length);
  const theme = useTheme();

  if (typeof window !== "undefined") {
    loadDiffState();
  }

  $effect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme.theme === "dark");
    if (typeof window !== "undefined") {
      window.localStorage.setItem("lintsune-theme", theme.theme);
    }
  });

  $effect(() => {
    if (typeof window === "undefined") return;
    persistDiffState();
  });

  function scrollToTop() {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
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
          theme={theme.theme}
          onclick={theme.toggle}
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
          batchSize={diffState.batchSize}
          batchIndex={diffState.batchIndex}
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
          payloadJson={diffState.payloadJson}
          responseJson={diffState.responseJson}
          {isGenerateDisabled}
          {isParseDisabled}
          responseError={diffState.responseError}
          onGenerate={generatePayload}
          onResponseChange={handleResponseChange}
          onParse={parseResponse}
        />
        <div class="flex flex-wrap gap-2">
          <span class="chip">Batch size: {diffState.batchSize}</span>
          <span class="chip">Current batch: #{diffState.batchIndex}</span>
          <span class="chip">{batchRangeLabel}</span>
        </div>
      </div>
    </div>
  </header>

  <main class="grid gap-6 max-w-10/12 mx-auto">
    <DiffList rows={diffState.diffRows} />
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
