import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase";

export type AuthUser = {
  id: string;
  email: string;
  role: "admin" | "team";
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
      role: (role?.role as "admin" | "team") || "team",
      name: role?.name || user.email?.split("@")[0] || "User",
      permissions: role?.permissions || [],
    };
  } catch {
    return null;
  }
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

    if (options?.adminOnly && user.role !== "admin") {
      return NextResponse.json(
        { error: "غير مصرح - صلاحيات المسؤول مطلوبة" },
        { status: 403 }
      );
    }

    return handler(req, user, ctx);
  };
}
