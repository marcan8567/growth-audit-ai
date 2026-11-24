// Messages the server streams to the browser, one JSON object per line (NDJSON).
// Shared by the API route and the page, so both sides agree on the format.

export type StepId = "read" | "brandVoice" | "audit" | "automation" | "contentPack";

export type ProgressEvent =
  | { type: "step"; step: StepId; status: "running" }
  | { type: "step"; step: StepId; status: "done"; data: unknown; ms: number }
  // One step failed; the other steps keep going.
  | { type: "step"; step: StepId; status: "error"; message: string }
  // Nothing else can run (for example, the website couldn't be read).
  | { type: "error"; step?: StepId; message: string }
  | { type: "done" };
