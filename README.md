# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
````markdown
# CSV Batch Diff Tool

A browser-only SvelteKit app for translators who batch review CSV rows, send them to ChatGPT, and compare the revised targets with word-level diffs—styled with Tailwind CSS v4 and fully TypeScripted.

## Features

- Upload a CSV (columns: `Index`, `Source`, `Target`) and preview the first rows locally via PapaParse.
- Configure batch size + page, auto-slice the selected rows, and display the current batch table with range labels.
- Generate a JSON payload for ChatGPT:

	```json
	{
		"meta": { "batchSize": 10, "batchIndex": 1, "totalRows": 42 },
		"rows": [
			{ "index": 1, "source": "…", "target": "…" }
		]
	}
	```

- Paste ChatGPT’s JSON response back in and parse/validate it. Expected response schema:

	```json
	{
		"rows": [
			{
				"index": 1,
				"source_original": "…",
				"target_original": "…",
				"target_revised": "…"
			}
		]
	}
	```

- Render per-row cards showing the original vs. revised target plus a color-coded word diff (equal / removed / added).
- Toggle a Dracula-inspired dark mode, collapse noisy panels by default, and automatically persist your latest CSV data, batch settings, payloads, and diffs to `localStorage` for instant reloads.

Everything happens in the browser—no API keys, servers, or network calls.

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
