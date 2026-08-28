import { createFileRoute } from "@tanstack/react-router";
import { workspaceStore } from "@/lib/v1/files/index.server";
import {
  apiError,
  errorToResponse,
  json,
  readJsonBody,
} from "@/lib/v1/http.server";
import { assertPermissions } from "@/lib/v1/security/permissions";
import { toolRegistry } from "@/lib/v1/tools/builtin.server";
import {
  workspaceDeleteRequestSchema,
  type WorkspaceFileSummary,
} from "@/lib/v1/types";

export const Route = createFileRoute("/api/v1/workspace")({
  server: {
    handlers: {
      GET: async () => {
        try {
          assertPermissions(["fs:workspace"]);
          const files = await workspaceStore.list();
          const summaries: WorkspaceFileSummary[] = files.map((file) => ({
            path: file.path,
            bytes: file.bytes,
            updatedAt: file.updatedAt,
          }));
          return json(summaries);
        } catch (error) {
          return errorToResponse(error);
        }
      },
      POST: async ({ request }) => {
        const body = await readJsonBody(request);
        if (!body.ok) return body.response;

        const parsed = workspaceDeleteRequestSchema.safeParse(body.value);
        if (!parsed.success) {
          return apiError(
            "invalid_request",
            "A workspace file path is required.",
            400,
          );
        }

        try {
          // Deletion always goes through the registry: schema validation,
          // permission assertion and approval gating stay in one place.
          const result = await toolRegistry.run(
            "file_delete",
            { path: parsed.data.path },
            { conversationId: "workspace-panel" },
            { approved: true },
          );
          return json({ ok: true, result });
        } catch (error) {
          return errorToResponse(error);
        }
      },
    },
  },
});
