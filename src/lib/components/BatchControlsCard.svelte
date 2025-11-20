<script lang="ts">
  interface Props {
    batchSize: number;
    batchIndex: number;
    maxBatchIndex: number;
    hasRows: boolean;
    rangeLabel: string;
    onBatchSizeInput?: (event: Event) => void;
    onBatchIndexInput?: (event: Event) => void;
    onPrevious?: () => void;
    onNext?: () => void;
  }

  let {
    batchSize,
    batchIndex,
    maxBatchIndex,
    hasRows,
    rangeLabel,
    onBatchSizeInput,
    onBatchIndexInput,
    onPrevious,
    onNext,
  }: Props = $props();
</script>

<div class="panel panel-muted space-y-4">
  <div class="grid gap-4 md:grid-cols-2">
    <label class="text-xs font-semibold uppercase tracking-wide text-muted">
      Batch size
      <input
        class="input-field mt-2"
        type="number"
        min={1}
        value={batchSize}
        onchange={onBatchSizeInput}
      />
    </label>
    <label class="text-xs font-semibold uppercase tracking-wide text-muted">
      Current batch
      <input
        class="input-field mt-2"
        type="number"
        min={1}
        value={batchIndex}
        onchange={onBatchIndexInput}
      />
    </label>
  </div>
  <p class="text-xs text-muted">{rangeLabel}</p>
  <div class="flex flex-wrap gap-3 justify-between">
    <button
      class="btn btn-secondary"
      type="button"
      onclick={onPrevious}
      disabled={batchIndex === 1}
    >
      Previous batch
    </button>
    <button
      class="btn btn-primary"
      type="button"
      onclick={onNext}
      disabled={!hasRows || batchIndex >= maxBatchIndex}
    >
      Next batch
    </button>
  </div>
</div>
