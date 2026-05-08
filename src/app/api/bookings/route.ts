import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/bookings?page=1&limit=10&search=&channel=all&status=all&staff=all&dateFrom=&dateTo=
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = request.nextUrl;

    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search')?.trim() || '';
    const channel = searchParams.get('channel') || 'all';
    const status = searchParams.get('status') || 'all';
    const staffFilter = searchParams.get('staff') || 'all';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build filtered query
    let query = supabase
      .from('Booking')
      .select('*, client:Client(*), staff:Staff(id, name)', { count: 'exact' });

    if (channel !== 'all') {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channel);
      if (isUUID) {
        query = query.eq('client.channel_id', channel);
      } else {
        query = query.eq('channelType', channel);
      }
    }
    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (staffFilter !== 'all') {
      query = query.eq('staff_id', staffFilter);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { referencedTable: 'Client' });
    }
    if (dateFrom) {
      query = query.gte('bookingDate', `${dateFrom}T00:00:00Z`);
    }
    if (dateTo) {
      query = query.lte('bookingDate', `${dateTo}T23:59:59Z`);
    }

    query = query.order('createdAt', { ascending: false }).range(from, to);

    const { data: bookings, error, count } = await query;

    if (error) throw error;

    const filtered = bookings || [];

    // Stats query (unfiltered totals)
    const { data: allBookings, error: statsError } = await supabase
      .from('Booking')
      .select('status');

    if (statsError) throw statsError;

    const stats = {
      total: allBookings?.length || 0,
      pending: allBookings?.filter((b) => b.status === 'pending').length || 0,
      confirmed: allBookings?.filter((b) => b.status === 'confirmed').length || 0,
      cancelled: allBookings?.filter((b) => b.status === 'cancelled').length || 0,
    };

    return NextResponse.json({
      data: filtered,
      total: count ?? 0,
      page,
      limit,
      stats,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// POST /api/bookings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceRoleClient();
    const { data: booking, error } = await supabase
      .from('Booking')
      .insert({
        client_id: body.client_id,
        serviceSummary: body.serviceSummary,
        channelType: body.channelType,
        status: body.status ?? 'pending',
        ...(body.bookingDate && { bookingDate: new Date(body.bookingDate).toISOString() }),
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
