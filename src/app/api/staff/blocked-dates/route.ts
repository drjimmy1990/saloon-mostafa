import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/staff/blocked-dates?staff_id=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const staffId = request.nextUrl.searchParams.get('staff_id');
    if (!staffId) return NextResponse.json({ error: 'staff_id required' }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('StaffBlockedDate')
      .select('*')
      .eq('staff_id', staffId)
      .order('blockedDate', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 });
  }
}

// POST /api/staff/blocked-dates
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { staff_id, blockedDate, reason } = body;
    if (!staff_id || !blockedDate) {
      return NextResponse.json({ error: 'staff_id and blockedDate required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('StaffBlockedDate')
      .insert({ staff_id, blockedDate, reason: reason || '' })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create blocked date' }, { status: 500 });
  }
}

// DELETE /api/staff/blocked-dates?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('StaffBlockedDate')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete blocked date' }, { status: 500 });
  }
}
