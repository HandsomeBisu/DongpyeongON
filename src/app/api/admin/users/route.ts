import { verifyAdminCategoryRequest } from "@/lib/admin-session";
import { apiError } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase/admin";
import { normalizeUserRole } from "@/types/domain";
import { parseAccountSuspension } from "@/lib/account-suspension";

export async function GET(request: Request) {
  try {
    await verifyAdminCategoryRequest(request, "users");
    const snapshot = await getAdminDb()
      .collection("users")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();
    return Response.json({
      users: snapshot.docs.map((doc) => {
        const data = doc.data();
        const suspension = parseAccountSuspension(data.suspension);
        return {
          uid: doc.id,
          displayName: data.displayName,
          email: data.email,
          role: normalizeUserRole(data.role),
          verified: data.verified === true,
          suspension:
            suspension && suspension.endsAt > Date.now() ? suspension : null,
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
