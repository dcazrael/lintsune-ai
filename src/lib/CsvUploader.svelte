<script lang="ts">
  import type { TranslationRow } from "$lib/types";
  import Papa, { type ParseResult } from "papaparse";

  type CsvFields = "Index" | "Source" | "Target";

  let previewRows: TranslationRow[] = $state([]);
  let totalRows = $state(0);
  let filename = $state("");
  let errorMessage = $state("");
  let previewCollapsed = $state(true);
  let { onLoaded }: { onLoaded?: (rows: TranslationRow[]) => void } = $props();

  const previewLimit = 5;

  function resetState() {
    previewRows = [];
    totalRows = 0;
    filename = "";
    errorMessage = "";
    previewCollapsed = true;
  }

  function parseCsv(file: File) {
    Papa.parse<Record<CsvFields, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<CsvFields, string>>) => {
        const { data, meta, errors } = results;

        if (errors.length) {
          errorMessage = `Unable to parse CSV: ${errors[0].message}`;
          return;
        }

        const requiredFields: CsvFields[] = ["Index", "Source", "Target"];
        const missing = requiredFields.filter((field) => !meta.fields?.includes(field));

        if (missing.length) {
          errorMessage = `Missing required column(s): ${missing.join(", ")}`;
          return;
        }

        const rows: TranslationRow[] = data
          .map((row: Record<CsvFields, string>) => ({
            index: Number(row.Index),
            source: row.Source ?? "",
            target: row.Target ?? "",
          }))
          .filter((row): row is TranslationRow => Number.isFinite(row.index));

        if (!rows.length) {
          errorMessage = "No valid rows were found in the CSV.";
          return;
        }

        previewRows = rows.slice(0, previewLimit);
        totalRows = rows.length;
        filename = file.name;
        errorMessage = "";
        previewCollapsed = true;
        onLoaded?.(rows);
      },
    });
  }

  function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      resetState();
      return;
    }

    parseCsv(file);
  }

  function togglePreview() {
    previewCollapsed = !previewCollapsed;
  }
</script>

<div class="panel panel-muted space-y-4">
  <div>
    <label
      class="block text-xs font-semibold uppercase tracking-wide text-muted"
      for="csv-upload"
    >
      Upload CSV
    </label>
    <input
      id="csv-upload"
      class="mt-2 w-full cursor-pointer rounded-2xl border border-stroke/60 bg-panel px-4 py-3 text-sm text-foreground shadow-inner shadow-black/10 transition file:mr-3 file:rounded-xl file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:border-accent focus-visible:ring-2 focus-visible:ring-accent"
      type="file"
      accept=".csv"
      onchange={handleFileChange}
    />
    <p class="mt-2 text-xs text-muted">
      The file must contain the columns <code>Index</code>, <code>Source</code>, and
      <code>Target</code>.
    </p>
  </div>

  {#if filename}
    <div class="text-sm text-muted">
      Loaded <span class="font-semibold text-foreground">{filename}</span> with {totalRows} rows.
    </div>
  {/if}

  {#if errorMessage}
    <div class="rounded-2xl border border-red-300/60 bg-red-500/10 p-3 text-sm text-red-600">
      {errorMessage}
    </div>
  {:else if previewRows.length}
    <div>
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-foreground">Preview (first {previewLimit} rows)</p>
        <button
          type="button"
          class="text-xs font-semibold text-muted underline decoration-dotted transition hover:text-foreground"
          onclick={togglePreview}
        >
          {previewCollapsed ? "Show preview" : "Hide preview"}
        </button>
      </div>
      {#if !previewCollapsed}
        <div class="mt-2 overflow-x-auto rounded-2xl border border-stroke/60 bg-panel">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-panel-muted text-xs uppercase text-muted">
              <tr>
                <th class="px-3 py-2">Index</th>
                <th class="px-3 py-2">Source</th>
                <th class="px-3 py-2">Target</th>
              </tr>
            </thead>
            <tbody>
              {#each previewRows as row (row.index)}
                <tr
                  class="border-b border-stroke/40 odd:bg-panel/70 even:bg-panel-muted/60"
                >
                  <td class="px-3 py-2 font-mono text-xs text-muted">{row.index}</td>
                  <td class="px-3 py-2 text-foreground">{row.source}</td>
                  <td class="px-3 py-2 text-accent">{row.target}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}
</div>
