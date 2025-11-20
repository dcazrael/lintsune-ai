# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
````markdown
# CSV Batch Diff Tool

A browser-only SvelteKit app for translators who batch review CSV rows, send them to ChatGPT, and compare the revised targets with word-level diffs—styled with Tailwind CSS v4 and fully TypeScripted.

## Workflow

### 1. Read CSV

Upload a CSV file containing at least two columns:

- `source` – Japanese source text  
- `target` – German translation (the version we want to refine)

The app parses the file entirely in the browser and shows a quick preview so you know you grabbed the right document.

### 2. Batch & generate JSON

Rows are sliced into batches and converted into a JSON request that you can drop straight into an LLM like ChatGPT. Every request carries the batch metadata plus the original strings so the model has full context.

```json
{
  "meta": {
    "batchSize": 10,
    "batchIndex": 1,
    "totalRows": 42
  },
  "rows": [
    {
      "index": 1,
      "source_original": "...",
      "target_original": "..."
    }
  ]
}
```

### 3. LLM check & rewrite

Feed that JSON to your LLM of choice. For each row it should:

- verify the German target translates the Japanese source accurately
- enforce the desired tone/style
- rewrite the German to sound natural and human
- fix spelling, grammar, and punctuation

The LLM responds with a minimal JSON payload:

```json
{
  "rows": [
    {
      "index": 1,
      "target_revised": "..."
    }
  ]
}
```

### 4. Diff view rendering

Paste the response back into the tool. For every row you’ll see:

- the original target text (from the CSV)
- the revised target text (from the LLM)
- a word-level diff highlighting insertions, deletions, and changes

Toggle sections open to read the full sentences, or scan the diff tokens to spot issues at a glance. Everything stays client-side—no APIs, logins, or external servers involved.

## Tech Stack

- [SvelteKit 2 / Svelte 5 runes mode]
- [Tailwind CSS v4](https://tailwindcss.com) via the official `@tailwindcss/vite` plugin
- TypeScript + PapaParse + `diff` for word-level comparisons

## Getting Started

```sh
pnpm install
pnpm run dev -- --open
```

Then upload your CSV, tweak the batch controls, copy the payload into ChatGPT, and paste the response JSON back to see diffs.

## Quality Checks

Run Svelte’s type + accessibility check anytime:

```sh
pnpm run check
```

## Build & Preview

```sh
pnpm run build
pnpm run preview
```

Deploy with any SvelteKit adapter if you decide to host the tool.
````
