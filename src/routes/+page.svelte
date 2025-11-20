<script lang="ts">
  import { CsvUploader, DiffList, PayloadPanel } from "$lib";
  import BatchControlsCard from "$lib/components/BatchControlsCard.svelte";
  import StatCard from "$lib/components/StatCard.svelte";
  import ThemeToggleButton from "$lib/components/ThemeToggleButton.svelte";
  import type { TranslationRow } from "$lib/types";
  import {
    workspace,
    handleRowsLoaded,
    handleBatchSizeInput,
    handleBatchIndexInput,
    goToPreviousBatch,
    goToNextBatch,
    generatePayload,
    handleResponseChange,
    parseResponse,
  } from "$lib/state/workspace.svelte";
  import { useTheme } from "$lib/state/theme.svelte";
  import { Database, MoveUp } from "@lucide/svelte";

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
  const theme = useTheme();

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
          batchSize={workspace.batchSize}
          batchIndex={workspace.batchIndex}
          maxBatchIndex={maxBatchIndex}
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
          payloadJson={workspace.payloadJson}
          responseJson={workspace.responseJson}
          isGenerateDisabled={isGenerateDisabled}
          isParseDisabled={isParseDisabled}
          responseError={workspace.responseError}
          onGenerate={generatePayload}
          onResponseChange={handleResponseChange}
          onParse={parseResponse}
        />
        <div class="flex flex-wrap gap-2">
          <span class="chip">Batch size: {workspace.batchSize}</span>
          <span class="chip">Current batch: #{workspace.batchIndex}</span>
          <span class="chip">{batchRangeLabel}</span>
        </div>
      </div>
    </div>
  </header>

  <main class="grid gap-6 max-w-10/12 mx-auto">
    <DiffList rows={workspace.diffRows} />
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
  const theme = useTheme();
