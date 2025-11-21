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
  <link
    rel="preconnect"
    href="https://fonts.googleapis.com"
  />
  <link
    href="https://fonts.googleapis.com/css2?family=Bruno+Ace+SC&display=swap"
    rel="stylesheet"
  />
</svelte:head>

{@render children()}
