<script lang="ts">
  import { Moon, Sun } from "@lucide/svelte";

  interface Props {
    theme?: "light" | "dark";
    onclick?: () => void;
    class?: string;
  }

  let { theme = "light", onclick, class: className = "" }: Props = $props();
</script>

<button
  class={`btn-icon ${className}`.trim()}
  type="button"
  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
  onclick={onclick}
>
  {#if theme === "dark"}
    <Sun class="h-5 w-5" />
  {:else}
    <Moon class="h-5 w-5" />
  {/if}
</button>
