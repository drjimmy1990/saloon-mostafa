import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// POST — Link a Supabase Auth user to a Client CRM row
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authUserId, phone } = body;

    if (!authUserId) {
      return NextResponse.json({ error: "Missing authUserId" }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // 1. Try to find client by auth_user_id first (returning user)
    const { data: existingByAuth } = await supabase
      .from("Client")
      .select("id, name, phone, email, address")
      .eq("auth_user_id", authUserId)
      .single();

    if (existingByAuth) {
      return NextResponse.json({ client: existingByAuth });
    }

    // 2. Try to find client by phone (guest who is now logging in)
    // Strip the + prefix for matching since some records may not have it
    const phonePlain = phone?.replace(/^\+/, "") || "";

    let clientId: string | null = null;

    if (phonePlain) {
      // Try with and without + prefix
      const { data: existingByPhone } = await supabase
        .from("Client")
        .select("id, name, phone, email, address")
        .or(`phone.eq.${phonePlain},phone.eq.+${phonePlain}`)
        .limit(1)
        .single();

      if (existingByPhone) {
        // Stamp auth_user_id on existing client
        await supabase
          .from("Client")
          .update({ auth_user_id: authUserId })
          .eq("id", existingByPhone.id);

        return NextResponse.json({ client: existingByPhone });
      }
    }

    // 3. Create new client
    const { data: newClient, error } = await supabase
      .from("Client")
      .insert({
        name: null,
        phone: phonePlain || "",
        platform: "website",
        auth_user_id: authUserId,
      })
      .select("id, name, phone, email, address")
      .single();

    if (error) {
      console.error("Failed to create client:", error);
      return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
    }

    return NextResponse.json({ client: newClient });
  } catch (err) {
    console.error("Link client error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
