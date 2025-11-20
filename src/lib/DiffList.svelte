<script lang="ts">
  import type { DiffRow } from "$lib/types";

  let { rows = [] } = $props<{ rows?: DiffRow[] }>();
  let expanded = $state<Record<number, boolean>>({});

  function toggleRow(index: number) {
    expanded = { ...expanded, [index]: !expanded[index] };
  }
</script>

{#if !rows.length}
  <div class="panel panel-muted border-dashed border-stroke text-center text-sm text-muted">
    No diffs to display yet. Generate a payload, send it to ChatGPT, and parse the response to view
    word-level changes.
  </div>
{:else}
  <div class="space-y-4">
    {#each rows as row (row.index)}
      <article class="panel panel-muted space-y-4">
        <header class="mb-3 flex items-center justify-between">
          <h3 class="text-base font-semibold text-foreground">Row {row.index}</h3>
          <span class="text-xs uppercase tracking-wide text-muted">Diff result</span>
        </header>

        <div class="space-y-2">
          <button
            class="btn btn-secondary text-xs"
            type="button"
            onclick={() => toggleRow(row.index)}
          >
            {expanded[row.index] ? "Hide originals" : "Show original & revised"}
          </button>
          {#if expanded[row.index]}
            <div class="grid gap-4 md:grid-cols-2">
              <div>
                <h4 class="text-sm font-semibold text-muted">Original Target</h4>
                <p
                  class="mt-1 rounded-2xl border border-stroke/60 bg-panel p-3 text-xs text-muted opacity-75"
                >
                  {row.originalTarget || "—"}
                </p>
              </div>
              <div>
                <h4 class="text-sm font-semibold text-muted">Revised Target</h4>
                <p
                  class="mt-1 rounded-2xl border border-stroke/60 bg-panel p-3 text-xs text-muted opacity-75"
                >
                  {row.revisedTarget || "—"}
                </p>
              </div>
            </div>
          {/if}
        </div>

        <div class="mt-4">
          <h4 class="text-sm font-semibold text-muted">Word diff</h4>
          <div
            class="mt-2 flex flex-wrap gap-1 rounded-2xl border border-stroke/60 bg-panel p-3 font-mono text-sm text-foreground"
          >
            {#if row.diffTokens.length}
              {#each row.diffTokens as token, index (index)}
                {#if token.type === "equal"}
                  <span>{token.text}</span>
                {:else if token.type === "removed"}
                  <span class="rounded bg-accent/20 px-1 text-accent line-through"
                    >{token.text}</span
                  >
                {:else}
                  <span class="rounded bg-accent-soft/30 px-1 text-accent">{token.text}</span>
                {/if}
              {/each}
            {:else}
              <span class="text-muted">No textual differences detected.</span>
            {/if}
          </div>
        </div>
      </article>
    {/each}
  </div>
{/if}
