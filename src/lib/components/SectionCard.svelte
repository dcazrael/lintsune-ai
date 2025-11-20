<script lang="ts">
  
  interface Props {
    /**
   * A section card component to group content with a title and description.
   *
   * @prop {string} title - The title of the section.
   * @prop {string} description - A brief description of the section.
   */
    title: string;
    description: string;
    children?: import('svelte').Snippet;
  }

  let { title, description, children }: Props = $props();
</script>

<section class="panel panel-muted">
  <h2 class="text-lg font-semibold text-foreground">{title}</h2>
  <p class="mt-2 text-sm text-muted">{description}</p>
  {@render children?.()}
</section>
