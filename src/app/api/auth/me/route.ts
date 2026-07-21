import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ user: null, role: null });
    }

    const { data: role } = await getServiceRoleClient()
      .from('AppUserRole')
      .select('role, name, permissions')
      .eq('user_id', user.id)
      .single();

    const userRole = (role?.role as "admin" | "team" | "demo") || 'team';

    return NextResponse.json({ 
      user: { id: user.id, email: user.email }, 
      role: userRole,
      name: role?.name || user.email?.split('@')[0],
      permissions: role?.permissions || []
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
