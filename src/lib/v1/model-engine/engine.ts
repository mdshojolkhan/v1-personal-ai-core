/**
 * ModelEngine — the provider-independent inference boundary of V1.
 *
 * Nothing outside `src/lib/v1/model-engine` may know which vendor answers a
 * request. To add a cloud model, a local model, or a future custom V1 model,
 * implement this interface and register it in `index.server.ts`.
 */
import type { ChatMessage } from "../types";

export type ModelEngineRequest = {
  /** Instructions describing how V1 should behave for this turn. */
  system: string;
  /** Conversation window (short-term memory) plus the new user message. */
  messages: ChatMessage[];
  temperature?: number;
  maxOutputTokens?: number;
};

export type ModelEngineResult = {
  text: string;
};

export type ModelEngineErrorCode =
  | "unavailable"
  | "rate_limited"
  | "payment_required"
  | "forbidden"
  | "invalid_request";

export class ModelEngineError extends Error {
  readonly code: ModelEngineErrorCode;

  constructor(code: ModelEngineErrorCode, message: string) {
    super(message);
    this.name = "ModelEngineError";
    this.code = code;
  }
}

export type ModelEngine = {
  /** Human readable provider name, safe to show in the UI. */
  readonly provider: string;
  /** Model identifier, safe to show in the UI (never a credential). */
  readonly model: string;
  /** True when the engine has everything it needs to answer. */
  isConfigured(): boolean;
  generate(request: ModelEngineRequest): Promise<ModelEngineResult>;
};
