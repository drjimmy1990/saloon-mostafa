import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const supabase = getServiceRoleClient();
    const { data: channel, error } = await supabase.from('Channel').select('*').eq('id', id).single();
    if (error || !channel) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(channel);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch channel' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceRoleClient();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.credentials !== undefined) updateData.credentials = body.credentials;
    if (body.variables !== undefined) updateData.variables = body.variables;
    if (body.imageSets !== undefined) updateData.imageSets = body.imageSets;
    if (body.webhookUrl !== undefined) updateData.webhookUrl = body.webhookUrl;

    const { data: channel, error } = await supabase
      .from('Channel')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(channel);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from('Channel').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
  }
}
