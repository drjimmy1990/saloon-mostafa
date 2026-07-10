import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/notifications?unread=true
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const unreadOnly = request.nextUrl.searchParams.get('unread') === 'true';
    const supabase = getServiceRoleClient();

    let query = supabase
      .from('Notification')
      .select('*, client:Client(id, name, phone)')
      .order('createdAt', { ascending: false });

    if (unreadOnly) {
      query = query.eq('isRead', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications — Create (called by n8n with API key)
export async function POST(request: NextRequest) {
  try {
    // Validate API key for external callers (n8n)
    const apiKey = request.headers.get('x-api-key');
    const expectedKey = process.env.NOTIFICATIONS_API_KEY;
    
    if (!expectedKey || apiKey !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, body: notifBody, client_id } = body;

    if (!title) {
      return NextResponse.json({ error: 'title required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('Notification')
      .insert({
        type: type || 'customer_service',
        title,
        body: notifBody || '',
        client_id: client_id || null,
        isRead: false,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PUT /api/notifications — Mark as read / mark all read
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const supabase = getServiceRoleClient();

    // Mark all as read
    if (body.markAllRead) {
      const { error } = await supabase
        .from('Notification')
        .update({ isRead: true })
        .eq('isRead', false);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Mark single as read
    if (body.id) {
      const { error } = await supabase
        .from('Notification')
        .update({ isRead: body.isRead ?? true })
        .eq('id', body.id);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'id or markAllRead required' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE /api/notifications?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const supabase = getServiceRoleClient();
    const { error } = await supabase
      .from('Notification')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
