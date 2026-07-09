import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getServiceRoleClient } from '@/lib/supabase';

export type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'team';
};

/**
 * Validates the caller's Supabase session and requires role === 'admin'.
 * Returns the AuthUser on success, or a NextResponse (401/403) on failure.
 * Callers should: `const guard = await requireAdmin(req); if (guard instanceof NextResponse) return guard;`
 */
export async function requireAdmin(req: NextRequest): Promise<AuthUser | NextResponse> {
  let user;
  try {
    const supabase = await createClient();
    ({ data: { user } } = await supabase.auth.getUser());
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: role } = await getServiceRoleClient()
    .from('AppUserRole')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (role?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return { id: user.id, email: user.email || '', role: 'admin' };
}