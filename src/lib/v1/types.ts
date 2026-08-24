/**
 * V1 Core — shared contracts.
 *
 * This module is client-safe: it contains only types and validation schemas.
 * Never import provider adapters or secrets from here.
 */
import { z } from "zod";

export const chatRoleSchema = z.enum(["user", "assistant", "system"]);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string().min(1).max(20_000),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** Assistant personalities exposed by the existing UI. */
export const assistantModeSchema = z.enum([
  "companion",
  "programming",
  "developer",
]);
export type AssistantMode = z.infer<typeof assistantModeSchema>;

/** POST /api/chat request body. */
export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(8_000),
  /** Short-term conversation memory supplied by the client. */
  history: z.array(chatMessageSchema).max(50).optional(),
  /** Long-term memory notes the user has explicitly saved. */
  memory: z.array(z.string().min(1).max(1_000)).max(50).optional(),
  mode: assistantModeSchema.optional(),
  /** Stable id so the orchestrator can group a conversation. */
  conversationId: z.string().min(1).max(120).optional(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export type ToolTrace = {
  toolId: string;
  input: unknown;
  ok: boolean;
  summary: string;
};

/** POST /api/chat success response. */
export type ChatResponse = {
  message: string;
  provider: string;
  model: string;
  intent: Intent;
  conversationId: string;
  toolsUsed: ToolTrace[];
};

export type ApiError = {
  error: string;
  code:
    | "invalid_request"
    | "model_unavailable"
    | "rate_limited"
    | "payment_required"
    | "forbidden"
    | "internal_error";
  details?: unknown;
};

export const intentSchema = z.enum([
  "smalltalk",
  "question",
  "task",
  "tool",
  "unsafe",
]);
export type Intent = z.infer<typeof intentSchema>;

/** Tool metadata that is safe to send to the browser. */
export type PublicTool = {
  id: string;
  name: string;
  description: string;
  requiresApproval: boolean;
  permissions: string[];
};

export const toolExecutionRequestSchema = z.object({
  toolId: z.string().min(1).max(80),
  input: z.record(z.unknown()).optional(),
  approved: z.boolean().optional(),
});
export type ToolExecutionRequest = z.infer<typeof toolExecutionRequestSchema>;

export type ToolExecutionResponse = {
  toolId: string;
  executed: boolean;
  result: string;
};

export type AssistantStatus = {
  status: "ready" | "degraded";
  provider: string;
  model: string;
  message: string;
  tools: number;
};
