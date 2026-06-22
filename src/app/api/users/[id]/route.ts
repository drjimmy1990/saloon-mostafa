import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceRoleClient();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.permissions !== undefined) updateData.permissions = body.permissions;

    // Fetch the AppUserRole to get the user_id if we need to update password
    if (body.password) {
      const { data: currentUserRole, error: fetchError } = await supabase
        .from('AppUserRole')
        .select('user_id')
        .eq('id', id)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error: authError } = await supabase.auth.admin.updateUserById(
        currentUserRole.user_id,
        { password: body.password }
      );
      if (authError) throw authError;
    }

    const { data: updatedUser, error } = await supabase
      .from('AppUserRole')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const { id } = await params;
    const supabase = getServiceRoleClient();

    // 1. Fetch the user_id from AppUserRole first
    const { data: userRole, error: fetchError } = await supabase
      .from('AppUserRole')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (userRole?.user_id) {
      // 2. Delete the user from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userRole.user_id);
      if (authError) {
        console.error("Failed to delete auth user:", authError);
      }
    }

    // 3. Delete from AppUserRole table
    const { error } = await supabase.from('AppUserRole').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
