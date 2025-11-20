<script lang="ts">
  let {
    payloadJson = "",
    responseJson = "",
    isGenerateDisabled = true,
    isParseDisabled = true,
    responseError = "",
    onGenerate,
    onResponseChange,
    onParse,
  } = $props<{
    payloadJson?: string;
    responseJson?: string;
    isGenerateDisabled?: boolean;
    isParseDisabled?: boolean;
    responseError?: string;
    onGenerate?: () => void;
    onResponseChange?: (value: string) => void;
    onParse?: () => void;
  }>();
  let copyFeedback = $state("");

  const responsePlaceholder = '{"rows": [{"index": 1, "target_revised": "..."}]}';

  function handleGenerate() {
    if (!isGenerateDisabled) {
      onGenerate?.();
    }
  }

  function handleResponseInput(event: Event) {
    const value = (event.currentTarget as HTMLTextAreaElement).value ?? "";
    onResponseChange?.(value);
  }

  function handleParse() {
    if (!isParseDisabled) {
      onParse?.();
    }
  }

  async function copyPayload() {
    if (!payloadJson || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(payloadJson);
      copyFeedback = "Copied!";
      setTimeout(() => (copyFeedback = ""), 2000);
    } catch (error) {
      console.error("Failed to copy payload", error);
    }
  }
</script>

<div class="grid grid-cols-2 gap-6">
  <section class="panel panel-muted space-y-4">
    <div class="flex items-center justify-between gap-3">
      <div class="">
        <h2 class="text-lg font-semibold text-foreground">ChatGPT payload</h2>
        <p class="text-sm text-muted">Build the payload for the currently selected batch.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="btn btn-primary"
          type="button"
          disabled={isGenerateDisabled}
          onclick={handleGenerate}
        >
          Generate payload
        </button>
      </div>
    </div>

    <textarea
      class="input-field mt-2 h-60 font-mono"
      value={payloadJson}
      readonly
    ></textarea>
    <div class="flex justify-between items-center">
      <p class="mt-2 text-xs text-muted">
        Copy this JSON and paste it into your ChatGPT conversation as input.
      </p>
      <button
        class="btn btn-secondary text-sm"
        type="button"
        disabled={!payloadJson}
        onclick={copyPayload}
      >
        {copyFeedback || "Copy JSON"}
      </button>
    </div>
  </section>

  <section class="panel panel-muted space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-foreground">ChatGPT response</h2>
        <p class="text-sm text-muted">Paste the JSON response here and parse it.</p>
      </div>
      <button
        class="btn btn-primary"
        type="button"
        disabled={isParseDisabled}
        onclick={handleParse}
      >
        Parse response
      </button>
    </div>

    <textarea
      class="input-field mt-2 h-60 bg-panel font-mono"
      placeholder={responsePlaceholder}
      value={responseJson}
      oninput={handleResponseInput}
    ></textarea>
    {#if responseError}
      <p
        class="mt-2 rounded-2xl border border-red-300/60 bg-red-500/10 px-3 py-2 text-sm text-red-600"
      >
        {responseError}
      </p>
    {/if}
  </section>
</div>
