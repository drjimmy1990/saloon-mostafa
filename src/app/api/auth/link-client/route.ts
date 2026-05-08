import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase";

// POST — Link a Supabase Auth user to a Client CRM row
// Now uses email as primary identifier (sign-up is by email)
// Phone/name are profile fields set later via /api/account
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { authUserId, email, name, phone } = body;

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
      // Update name/phone if they were missing and now provided
      const updates: Record<string, string> = {};
      if ((!existingByAuth.name || existingByAuth.name.trim() === "") && name) updates.name = name;
      if ((!existingByAuth.phone || existingByAuth.phone.trim() === "") && phone) updates.phone = phone;
      if (Object.keys(updates).length > 0) {
        await supabase.from("Client").update(updates).eq("id", existingByAuth.id);
        return NextResponse.json({ client: { ...existingByAuth, ...updates } });
      }
      return NextResponse.json({ client: existingByAuth });
    }

    // 2. Try to find client by email (guest who placed orders and now signed up)
    if (email) {
      const { data: existingByEmail } = await supabase
        .from("Client")
        .select("id, name, phone, email, address")
        .eq("email", email)
        .limit(1)
        .single();

      if (existingByEmail) {
        // Stamp auth_user_id and update name/phone if missing
        const updates: Record<string, string | null> = { auth_user_id: authUserId };
        if ((!existingByEmail.name || existingByEmail.name.trim() === "") && name) updates.name = name;
        if ((!existingByEmail.phone || existingByEmail.phone.trim() === "") && phone) updates.phone = phone;
        await supabase.from("Client").update(updates).eq("id", existingByEmail.id);

        return NextResponse.json({ client: { ...existingByEmail, ...updates } });
      }
    }

    // 3. Try to find client by phone (legacy: guests who booked by phone via bot)
    const { data: authUser } = await supabase.auth.admin.getUserById(authUserId);
    const authPhone = authUser?.user?.phone;

    if (authPhone) {
      const phonePlain = authPhone.replace(/^\+/, "");
      const { data: existingByPhone } = await supabase
        .from("Client")
        .select("id, name, phone, email, address")
        .or(`phone.eq.${phonePlain},phone.eq.+${phonePlain}`)
        .limit(1)
        .single();

      if (existingByPhone) {
        await supabase
          .from("Client")
          .update({ auth_user_id: authUserId, email: email || existingByPhone.email })
          .eq("id", existingByPhone.id);

        return NextResponse.json({ client: existingByPhone });
      }
    }

    // 4. Create new client with name, phone, and email
    const { data: newClient, error } = await supabase
      .from("Client")
      .insert({
        name: name || null,
        phone: phone || "",
        email: email || "",
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
