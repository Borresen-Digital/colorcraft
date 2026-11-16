import { requireUser, svar } from "@/lib/session";
import { isProfileId } from "@/lib/savedProfiles";

/** Trekk tilbake et token: det slutter å virke med en gang. */
export async function DELETE(
  req: Request,
  { params }: RouteContext<"/api/konto/tokens/[id]">,
): Promise<Response> {
  const u = await requireUser(req);
  if (u instanceof Response) return u;
  const { id } = await params;
  if (!isProfileId(id)) return svar({ error: "not-found" }, 404);
  const r = await u.db
    .prepare('delete from "mcpToken" where "id" = ? and "userId" = ?')
    .bind(id, u.userId)
    .run();
  return (r.meta?.changes ?? 0) > 0
    ? svar({ ok: true })
    : svar({ error: "not-found" }, 404);
}
