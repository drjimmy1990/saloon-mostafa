import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const supabase = getServiceRoleClient();
    const { data: users, error } = await supabase
      .from('AppUserRole')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json(users || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { email, password, name, role, permissions } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabaseAdmin = getServiceRoleClient();
    
    // 1. Try to create the user in Supabase Auth
    let { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    // 2. Handle "email already registered" — clean orphaned Auth users
    if (authError && authError.message?.toLowerCase().includes('already been registered')) {
      // Check if this email actually exists in our AppUserRole table
      const { data: existingRole } = await supabaseAdmin
        .from('AppUserRole')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingRole) {
        // Email genuinely exists in our system — real duplicate
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      // Orphaned Auth user — find and delete it, then retry
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const orphan = authUsers?.users?.find((u: any) => u.email === email);

      if (orphan) {
        await supabaseAdmin.auth.admin.deleteUser(orphan.id);
        console.log(`Cleaned orphaned Auth user: ${email} (${orphan.id})`);
      }

      // Retry creation
      const retryResult = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      authData = retryResult.data;
      authError = retryResult.error;
    }

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData!.user!.id;

    // 3. Insert into AppUserRole
    const { data: userRole, error: dbError } = await supabaseAdmin
      .from('AppUserRole')
      .insert({
        user_id: userId,
        email,
        name,
        role,
        permissions: permissions || []
      })
      .select()
      .single();

    if (dbError) {
      // Rollback Auth creation if DB fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw dbError;
    }

    return NextResponse.json(userRole, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
