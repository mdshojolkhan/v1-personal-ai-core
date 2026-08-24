/**
 * Skill/tool registry.
 *
 * Every tool declares: id, name, description, permissions, an input schema and
 * an execute function. Input is always validated with the schema before the
 * tool runs, so a user message can never reach a tool unchecked.
 */
import type { z } from "zod";
import type { PublicTool } from "../types";
import { assertPermissions, type Permission } from "../security/permissions";

export type ToolContext = {
  /** Conversation the tool was invoked from. */
  conversationId: string;
};

export type V1Tool<Schema extends z.ZodTypeAny = z.ZodTypeAny> = {
  id: string;
  name: string;
  description: string;
  /** Human approval required before the tool may run. */
  requiresApproval: boolean;
  permissions: Permission[];
  inputSchema: Schema;
  execute(
    input: z.infer<Schema>,
    context: ToolContext,
  ): Promise<string> | string;
};

export class ToolError extends Error {
  readonly code: "not_found" | "invalid_input" | "not_approved" | "denied";

  constructor(
    code: "not_found" | "invalid_input" | "not_approved" | "denied",
    message: string,
  ) {
    super(message);
    this.name = "ToolError";
    this.code = code;
  }
}

export class ToolRegistry {
  private readonly tools = new Map<string, V1Tool>();

  register(tool: V1Tool): void {
    if (this.tools.has(tool.id)) {
      throw new Error(`Tool "${tool.id}" is already registered.`);
    }
    this.tools.set(tool.id, tool as V1Tool);
  }

  get(id: string): V1Tool | undefined {
    return this.tools.get(id);
  }

  list(): V1Tool[] {
    return [...this.tools.values()];
  }

  /** Metadata safe to send to the browser. */
  listPublic(): PublicTool[] {
    return this.list().map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      requiresApproval: tool.requiresApproval,
      permissions: tool.permissions,
    }));
  }

  async run(
    id: string,
    rawInput: unknown,
    context: ToolContext,
    options: { approved?: boolean } = {},
  ): Promise<string> {
    const tool = this.get(id);
    if (!tool) throw new ToolError("not_found", "Tool is not available.");

    if (tool.requiresApproval && options.approved !== true) {
      throw new ToolError(
        "not_approved",
        "Explicit approval is required for this skill.",
      );
    }

    assertPermissions(tool.permissions);

    const parsed = tool.inputSchema.safeParse(rawInput ?? {});
    if (!parsed.success) {
      throw new ToolError(
        "invalid_input",
        "The input for this skill is not valid.",
      );
    }

    return await tool.execute(parsed.data, context);
  }
}
