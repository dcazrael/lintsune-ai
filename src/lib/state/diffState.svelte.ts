import type {
  ChatGptPayload,
  ChatGptResponse,
  ChatGptResponseRow,
  DiffRow,
  TranslationRow,
} from "$lib/types";
import { computeWordDiff } from "$lib/utils/diff";

const STORAGE_KEY = "lintsune-diff-state";
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_BATCH_INDEX = 1;

export const diffState = $state({
  rows: [] as TranslationRow[],
  batchSize: DEFAULT_BATCH_SIZE,
  batchIndex: DEFAULT_BATCH_INDEX,
  payloadJson: "",
  responseJson: "",
  responseError: "",
  diffRows: [] as DiffRow[],
});

export function handleRowsLoaded(rows: TranslationRow[]) {
  diffState.rows = rows;
  diffState.batchIndex = DEFAULT_BATCH_INDEX;
  diffState.payloadJson = "";
  diffState.responseJson = "";
  diffState.responseError = "";
  diffState.diffRows = [];
}

export function handleBatchSizeInput(event: Event) {
  const value = Number((event.currentTarget as HTMLInputElement).value) || DEFAULT_BATCH_SIZE;
  diffState.batchSize = Math.max(1, value);
  diffState.batchIndex = DEFAULT_BATCH_INDEX;
}

export function handleBatchIndexInput(event: Event) {
  const value = Number((event.currentTarget as HTMLInputElement).value) || DEFAULT_BATCH_INDEX;
  const maxIndex = Math.max(
    1,
    Math.ceil(diffState.rows.length / Math.max(1, diffState.batchSize || 1))
  );
  diffState.batchIndex = Math.min(Math.max(1, value), maxIndex);
}

export function goToPreviousBatch() {
  diffState.batchIndex = Math.max(1, diffState.batchIndex - 1);
}

export function goToNextBatch() {
  const maxIndex = Math.max(
    1,
    Math.ceil(diffState.rows.length / Math.max(1, diffState.batchSize || 1))
  );
  diffState.batchIndex = Math.min(maxIndex, diffState.batchIndex + 1);
}

export function generatePayload() {
  const start = Math.max(0, (diffState.batchIndex - 1) * diffState.batchSize);
  const slice = diffState.rows.slice(start, start + diffState.batchSize);
  if (!slice.length) return;

  const payload: ChatGptPayload = {
    meta: {
      batchSize: diffState.batchSize,
      batchIndex: diffState.batchIndex,
      totalRows: diffState.rows.length,
    },
    rows: slice.map((row) => ({
      index: row.index,
      source: row.source,
      target: row.target,
    })),
  };

  diffState.payloadJson = JSON.stringify(payload, null, 2);
}

export function handleResponseChange(nextValue: string) {
  diffState.responseJson = nextValue;
  diffState.responseError = "";
}

export function loadDiffState() {
  if (typeof window === "undefined") return;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved) as Partial<typeof diffState>;
    diffState.rows = parsed.rows ?? diffState.rows;
    diffState.batchSize = parsed.batchSize ?? diffState.batchSize;
    diffState.batchIndex = parsed.batchIndex ?? diffState.batchIndex;
    diffState.payloadJson = parsed.payloadJson ?? diffState.payloadJson;
    diffState.responseJson = parsed.responseJson ?? diffState.responseJson;
    diffState.responseError = parsed.responseError ?? diffState.responseError;
    diffState.diffRows = parsed.diffRows ?? diffState.diffRows;
  } catch (error) {
    console.error("Failed to restore diff state", error);
  }
}

export function persistDiffState() {
  if (typeof window === "undefined") return;
  const snapshot = {
    rows: diffState.rows,
    batchSize: diffState.batchSize,
    batchIndex: diffState.batchIndex,
    payloadJson: diffState.payloadJson,
    responseJson: diffState.responseJson,
    responseError: diffState.responseError,
    diffRows: diffState.diffRows,
  } satisfies typeof diffState;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function parseResponse() {
  try {
    const parsed = JSON.parse(diffState.responseJson) as ChatGptResponse;
    if (!parsed || !Array.isArray(parsed.rows)) {
      throw new Error('Response must contain a "rows" array.');
    }

    const rowMap = new Map(diffState.rows.map((row) => [row.index, row]));
    const nextDiffRows: DiffRow[] = [];
    const missingFields: string[] = [];

    parsed.rows.forEach((entry: ChatGptResponseRow) => {
      if (typeof entry?.index !== "number" || !Number.isFinite(entry.index)) {
        missingFields.push("invalid index value");
        return;
      }

      if (typeof entry.target_revised !== "string") {
        missingFields.push(`missing target_revised for index ${entry.index}`);
        return;
      }

      const original = rowMap.get(entry.index);
      if (!original) {
        missingFields.push(`index ${entry.index} not found in CSV`);
        return;
      }

      nextDiffRows.push({
        index: entry.index,
        originalTarget: original.target,
        revisedTarget: entry.target_revised,
        diffTokens: computeWordDiff(original.target, entry.target_revised),
      });
    });

    if (!nextDiffRows.length) {
      throw new Error("No matching rows were found in the response.");
    }

    diffState.diffRows = nextDiffRows;
    diffState.responseError = missingFields.length
      ? `Some rows were skipped because required fields were missing: ${missingFields.join(", ")}`
      : "";
  } catch (error) {
    diffState.responseError =
      error instanceof Error
        ? error.message
        : "Failed to parse the response JSON. Please double-check the structure.";
    diffState.diffRows = [];
  }
}
