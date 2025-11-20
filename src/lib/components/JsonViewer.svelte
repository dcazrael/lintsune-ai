<script lang="ts">
  export let data: unknown = {};
  export let spaces = 2;

  const highlight = (json: string) =>
    json
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(
        /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          let cls = "number";
          if (/^"/.test(match)) cls = match.endsWith(":") ? "key" : "string";
          else if (/true|false/.test(match)) cls = "boolean";
          else if (match === "null") cls = "null";
          return `<span class="${cls}">${match}</span>`;
        }
      );

  $: classes = $$props.class ?? "";

  $: pretty = (() => {
    if (typeof data === "string") {
      try {
        return JSON.stringify(JSON.parse(data), null, spaces);
      } catch (e) {
        return data;
      }
    }
    return JSON.stringify(data, null, spaces);
  })();

  $: highlighted = highlight(pretty);
</script>

<pre class="light {classes}"><code>{@html highlighted}</code></pre>

<style>
  .string {
    color: #28a745;
  }
  .number {
    color: #e83e8c;
  }
  .boolean {
    color: #17a2b8;
  }
  .null {
    color: #6c757d;
  }
  .key {
    color: #007bff;
  }
</style>
