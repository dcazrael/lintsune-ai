export type TranslationRow = {
  index: number;
  source: string;
  target: string;
};

export type BatchMeta = {
  batchSize: number;
  batchIndex: number; // 1-based index
  totalRows: number;
};

export type PayloadRow = {
  index: number;
  source: string;
  target: string;
};

export type ChatGptPayload = {
  meta: BatchMeta;
  rows: PayloadRow[];
};

export type ChatGptResponseRow = {
  index: number;
  target_revised: string;
};

export type ChatGptResponse = {
  rows: ChatGptResponseRow[];
};

export type DiffToken =
  | { type: "equal"; text: string }
  | { type: "removed"; text: string }
  | { type: "added"; text: string };

export type DiffRow = {
  index: number;
  originalTarget: string;
  revisedTarget: string;
  diffTokens: DiffToken[];
};
