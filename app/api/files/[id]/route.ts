import { getCurrentUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { loadEnv } from "@/lib/env";
import { readAuthorizedFile } from "@/lib/services/files";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const result = await readAuthorizedFile(await getDb(), user, id, loadEnv().uploadDir);
  if (!result) return new Response("Not found", { status: 404 });
  const filename = result.file.originalName.replace(/["\r\n]/g, "");
  const inline = result.file.mimeType.startsWith("image/");
  return new Response(new Uint8Array(result.bytes), {
    status: 200,
    headers: {
      "Content-Type": result.file.mimeType,
      "Content-Length": String(result.bytes.length),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
