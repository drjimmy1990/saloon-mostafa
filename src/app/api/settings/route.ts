import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// GET /api/settings
export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data: settings, error } = await supabase.from('SystemSetting').select('*');

    if (error) throw error;
    
    // Transform array of {key, value} into an object for easier frontend consumption
    const settingsObject = (settings || []).reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(settingsObject);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/settings (Bulk update)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    const body = await request.json(); // Expected format: { "salon_address": "123 Main St", ... }
    const supabase = getServiceRoleClient();
    
    const upsertData = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value)
    }));

    const { data, error } = await supabase
      .from('SystemSetting')
      .upsert(upsertData, { onConflict: 'key' })
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
