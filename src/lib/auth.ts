import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "team" | "demo";
  name: string;
  permissions: string[];
};

/**
 * Validates the current Supabase session and retrieves the user's role.
 * Returns the AuthUser if authenticated, or null if no session.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: role } = await getServiceRoleClient()
      .from("AppUserRole")
      .select("role, name, permissions")
      .eq("user_id", user.id)
      .single();

    return {
      id: user.id,
      email: user.email || "",
      role: (role?.role as "admin" | "team" | "demo") || "team",
      name: role?.name || user.email?.split("@")[0] || "User",
      permissions: role?.permissions || [],
    };
  } catch {
    return null;
  }
}

/**
 * Checks if the authenticated user is a demo user and restricts write actions or sensitive endpoints.
 * Returns a 403 NextResponse if restricted, or null if allowed.
 */
export function checkDemoRestriction(user: AuthUser, req: NextRequest): NextResponse | null {
  if (user.role !== "demo") return null;

  const path = req.nextUrl.pathname;
  const method = req.method.toUpperCase();

  // a. Restricted endpoints (/api/users* and /api/clients/export)
  if (path.startsWith("/api/users") || path.startsWith("/api/clients/export")) {
    return NextResponse.json(
      { error: "غير مصرح - حساب العرض التوضيحي لا يمكنه الوصول لهذه البيانات" },
      { status: 403 }
    );
  }

  // b. Write HTTP methods (POST, PUT, PATCH, DELETE)
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return NextResponse.json(
      { error: "وضع العرض التوضيحي للقراءة فقط - لا يمكن تعديل البيانات" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Wraps a route handler with authentication. Returns 401 if not authenticated.
 * Optionally restricts to admin-only access.
 */
export function withAuth(
  handler: (
    req: NextRequest,
    user: AuthUser,
    ctx?: { params: Record<string, string> }
  ) => Promise<NextResponse>,
  options?: { adminOnly?: boolean }
) {
  return async (
    req: NextRequest,
    ctx?: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { error: "غير مصرح - يرجى تسجيل الدخول" },
        { status: 401 }
      );
    }

    const demoRestriction = checkDemoRestriction(user, req);
    if (demoRestriction) return demoRestriction;

    if (options?.adminOnly && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح - صلاحيات المسؤول مطلوبة" },
        { status: 403 }
      );
    }

    return handler(req, user, ctx);
  };
}
