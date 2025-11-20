import type { DiffToken } from "$lib/types";
import { diffWords } from "diff";

export function computeWordDiff(original: string, revised: string): DiffToken[] {
  const safeOriginal = original ?? "";
  const safeRevised = revised ?? "";

  return diffWords(safeOriginal, safeRevised).map((part) => ({
    type: part.added ? "added" : part.removed ? "removed" : "equal",
    text: part.value,
  }));
}
