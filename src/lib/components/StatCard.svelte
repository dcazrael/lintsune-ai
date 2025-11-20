<script lang="ts">
  import type { Icon as IconType } from "@lucide/svelte";

  interface Props {
    /**
     * A card component to display a statistic with an icon.
     *
     * @prop {string} title - The title of the statistic.
     * @prop {string | number} value - The value of the statistic.
     * @prop {IconType} icon - The icon to display alongside the statistic.
     */
    title: string;
    value: string | number;
    icon: typeof IconType;
  }

  let { title, value, icon }: Props = $props();
</script>

<div class="panel panel-muted flex items-center gap-4 flex-wrap">
  {#if icon}
    {@const Icon = icon}
    <Icon class="h-6 w-6 text-accent" />
  {/if}
  <div class="flex-1 min-w-fit">
    <p class="text-xs uppercase tracking-wide text-muted">{title}</p>
    <p class="mt-1 text-xl font-bold text-foreground">{value}</p>
  </div>
  <p class="text-xs text-muted">Includes every CSV entry you’ve uploaded in this session.</p>
</div>
