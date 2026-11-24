// Messages the server streams to the browser, one JSON object per line (NDJSON).
// Shared by the API route and the page, so both sides agree on the format.

export type StepId = "read" | "brandVoice";

export type ProgressEvent =
  | { type: "step"; step: StepId; status: "running" }
  | { type: "step"; step: StepId; status: "done"; data: unknown; ms: number }
  | { type: "error"; step?: StepId; message: string }
  | { type: "done" };
