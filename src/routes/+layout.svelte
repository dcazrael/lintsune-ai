<script lang="ts">
  import favicon from "$lib/assets/Lintsune_logo_hairline.svg";
  import "../app.css";

  let { children } = $props();
</script>

<svelte:head>
  <link
    rel="icon"
    href={favicon}
  />
</svelte:head>

{@render children()}
