import { requireUser, svar } from "@/lib/session";
import { deleteProfile, getOwnProfile, isProfileId } from "@/lib/savedProfiles";

/** Én lagret profil med fragmentet, for å åpne den i profilsiden. */
export async function GET(
  req: Request,
  { params }: RouteContext<"/api/profiler/[id]">,
): Promise<Response> {
  const u = await requireUser(req);
  if (u instanceof Response) return u;
  const { id } = await params;
  if (!isProfileId(id)) return svar({ error: "not-found" }, 404);
  const p = await getOwnProfile(u.db, u.userId, id);
  return p ? svar(p) : svar({ error: "not-found" }, 404);
}

/** Slett en lagret profil. Den korte lenken slutter å virke. */
export async function DELETE(
  req: Request,
  { params }: RouteContext<"/api/profiler/[id]">,
): Promise<Response> {
  const u = await requireUser(req);
  if (u instanceof Response) return u;
  const { id } = await params;
  if (!isProfileId(id)) return svar({ error: "not-found" }, 404);
  return (await deleteProfile(u.db, u.userId, id))
    ? svar({ ok: true })
    : svar({ error: "not-found" }, 404);
}
