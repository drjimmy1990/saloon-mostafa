import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

// GET /api/channels - List all channels
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = getServiceRoleClient();
    const { data: channels, error } = await supabase
      .from('Channel')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json(channels || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

// POST /api/channels - Create a channel
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const supabase = getServiceRoleClient();
    const { data: channel, error } = await supabase
      .from('Channel')
      .insert({
        name: body.name,
        type: body.type,
        isActive: body.isActive ?? false,
        credentials: body.credentials ?? [],
        variables: body.variables ?? {},
        imageSets: body.imageSets ?? [],
        webhookUrl: body.webhookUrl ?? '',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}
