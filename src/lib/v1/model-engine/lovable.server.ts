/**
 * Cloud engine backed by the Lovable AI Gateway (OpenAI-compatible).
 *
 * The API key is read inside the request path and never leaves the server.
 */
import {
  ModelEngineError,
  type ModelEngine,
  type ModelEngineRequest,
  type ModelEngineResult,
} from "./engine";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export function createCloudEngine(model: string): ModelEngine {
  return {
    provider: "V1 Agent Cloud",
    model,
    isConfigured() {
      return Boolean(process.env["LOVABLE_API_KEY"]);
    },
    async generate(request: ModelEngineRequest): Promise<ModelEngineResult> {
      const apiKey = process.env["LOVABLE_API_KEY"];
      if (!apiKey) {
        throw new ModelEngineError(
          "unavailable",
          "The cloud model is not configured on this server.",
        );
      }

      let response: Response;
      try {
        response = await fetch(GATEWAY_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": apiKey,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: request.system },
              ...request.messages,
            ],
            ...(request.temperature === undefined
              ? {}
              : { temperature: request.temperature }),
          }),
        });
      } catch {
        throw new ModelEngineError(
          "unavailable",
          "The thinking engine could not be reached.",
        );
      }

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new ModelEngineError(
          mapStatus(response.status),
          messageForStatus(response.status, detail),
        );
      }

      const payload = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = payload.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new ModelEngineError(
          "unavailable",
          "The thinking engine returned an empty response.",
        );
      }
      return { text };
    },
  };
}

function mapStatus(status: number) {
  if (status === 429) return "rate_limited" as const;
  if (status === 402) return "payment_required" as const;
  if (status === 403) return "forbidden" as const;
  if (status === 400) return "invalid_request" as const;
  return "unavailable" as const;
}

function messageForStatus(status: number, detail: string) {
  switch (status) {
    case 429:
      return "V1 is being rate limited right now. Try again in a moment.";
    case 402:
      return "AI credits are exhausted. Add credits to keep V1 thinking.";
    case 403:
      return "AI access is blocked for this workspace.";
    case 400:
      return `The model rejected the request: ${detail.slice(0, 300)}`;
    default:
      return "The thinking engine is temporarily unavailable.";
  }
}
