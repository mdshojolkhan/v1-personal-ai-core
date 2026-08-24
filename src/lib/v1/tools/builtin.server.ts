/**
 * Built-in V1 skills. Safe by construction: no network, no device access, no
 * code evaluation. Future phone-control skills plug in here once the matching
 * permissions are granted in `../security/permissions`.
 */
import { z } from "zod";
import { ToolRegistry, type V1Tool } from "./registry";

const currentTime: V1Tool<z.ZodObject<{ timeZone: z.ZodOptional<z.ZodString> }>> =
  {
    id: "current_time",
    name: "Current time",
    description: "Reads the server time. Changes nothing.",
    requiresApproval: false,
    permissions: ["read:time"],
    inputSchema: z.object({ timeZone: z.string().max(60).optional() }),
    execute(input) {
      const now = new Date();
      if (!input.timeZone) return `Current time (UTC): ${now.toISOString()}`;
      try {
        return `Current time (${input.timeZone}): ${now.toLocaleString("en-GB", {
          timeZone: input.timeZone,
        })}`;
      } catch {
        return `Current time (UTC): ${now.toISOString()}`;
      }
    },
  };

const analyzeText: V1Tool<z.ZodObject<{ text: z.ZodString }>> = {
  id: "analyze_text",
  name: "Text analyzer",
  description: "Summarises the shape of text you supply (counts, structure).",
  requiresApproval: true,
  permissions: ["read:conversation"],
  inputSchema: z.object({ text: z.string().min(1).max(8_000) }),
  execute(input) {
    const words = input.text.trim().split(/\s+/).filter(Boolean);
    const sentences = input.text
      .split(/[.!?]+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const longest = [...words].sort((a, b) => b.length - a.length)[0] ?? "";
    return [
      `Characters: ${input.text.length}`,
      `Words: ${words.length}`,
      `Sentences: ${sentences.length}`,
      `Longest word: ${longest}`,
    ].join("\n");
  },
};

const permissionPlanner: V1Tool<
  z.ZodObject<{ capability: z.ZodOptional<z.ZodString> }>
> = {
  id: "draft_android_permission_plan",
  name: "Android permission planner",
  description:
    "Drafts a permission-aware plan for a future device capability. Plans only — it cannot control a device.",
  requiresApproval: true,
  permissions: ["read:conversation"],
  inputSchema: z.object({ capability: z.string().max(200).optional() }),
  execute(input) {
    const capability = input.capability?.trim() || "the requested capability";
    return [
      `Plan for ${capability}:`,
      "1. Identify the exact platform API required.",
      "2. Declare the minimum permission that covers it.",
      "3. Request the permission at runtime, with a plain-language reason.",
      "4. Handle denial gracefully and keep a non-permission fallback.",
      "5. Log the action for review; never run it silently in the background.",
    ].join("\n");
  },
};

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(currentTime as V1Tool);
  registry.register(analyzeText as V1Tool);
  registry.register(permissionPlanner as V1Tool);
  return registry;
}

/** Shared registry instance for the server runtime. */
export const toolRegistry = createToolRegistry();
