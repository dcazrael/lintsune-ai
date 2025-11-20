<script lang="ts">
  
  interface Props {
    /**
   * A button component with primary and secondary variants.
   *
   * @prop {"primary" | "secondary"} variant - The style variant of the button.
   * @prop {() => void} onClick - The click event handler for the button.
   */
    variant?: "primary" | "secondary";
    onClick: () => void;
    children?: import('svelte').Snippet;
  }

  let { variant = "primary", onClick, children }: Props = $props();
</script>

<button
  class="btn {variant === 'primary' ? 'btn-primary' : 'btn-secondary'}"
  onclick={onClick}
>
  {@render children?.()}
</button>
