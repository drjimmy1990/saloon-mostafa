import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const parseAsUTC = (dateStr: string) => {
  if (!dateStr) return 0;
  let formatted = dateStr;
  if (!dateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
    formatted = dateStr.replace(' ', 'T') + 'Z';
  }
  return new Date(formatted).getTime();
};

const locks = new Map<string, Promise<void>>();

async function acquireLock(key: string): Promise<() => void> {
  while (locks.has(key)) {
    await locks.get(key);
  }
  let resolveLock: () => void = () => {};
  const lockPromise = new Promise<void>((resolve) => {
    resolveLock = resolve;
  });
  locks.set(key, lockPromise);
  return () => {
    locks.delete(key);
    resolveLock();
  };
}

// GET /api/bookings?page=1&limit=10&search=&channel=all&status=all&staff=all&dateFrom=&dateTo=
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const isChannelUUID = channel !== 'all' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(channel);
    const useInnerJoin = !!search || isChannelUUID;
    const clientSelect = useInnerJoin ? 'client:Client!inner(*)' : 'client:Client(*)';

    let query = supabase
      .from('Booking')
      .select(`*, ${clientSelect}, staff:Staff!Booking_staff_id_fkey(id, name)`, { count: 'exact' });

    if (channel !== 'all') {
      if (isChannelUUID) {
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
      waiting_payment: allBookings?.filter((b) => b.status === 'waiting_payment').length || 0,
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
  let releaseLock: (() => void) | null = null;
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();

    // Validate required fields
    if (!body.serviceId) {
      return NextResponse.json({ error: 'Missing serviceId' }, { status: 400 });
    }
    if (!body.bookingDate) {
      return NextResponse.json({ error: 'Missing bookingDate' }, { status: 400 });
    }
    if (!body.client_id && (!body.clientName || !body.clientPhone)) {
      return NextResponse.json({ error: 'Missing client details' }, { status: 400 });
    }
    if (body.bookingTime) {
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(body.bookingTime)) {
        return NextResponse.json({ error: 'Invalid booking time format' }, { status: 400 });
      }
    }

    const supabase = getServiceRoleClient();

    const targetStaffId = body.staff_id;
    const targetDateString = body.bookingDate; // YYYY-MM-DD

    if (targetStaffId && targetStaffId !== "none" && targetDateString) {
      const lockKey = `${targetStaffId}_${targetDateString}`;
      releaseLock = await acquireLock(lockKey);
    }

    // Auto-create client if clientName + clientPhone provided but no client_id
    let clientId = body.client_id;
    if (!clientId && body.clientName && body.clientPhone) {
      // Try to find existing client by phone
      const { data: existing } = await supabase
        .from('Client')
        .select('id')
        .eq('phone', body.clientPhone)
        .maybeSingle();

      if (existing) {
        clientId = existing.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from('Client')
          .insert({ name: body.clientName, phone: body.clientPhone, address: '', notes: '' })
          .select('id')
          .single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }
    }

    const insertData: Record<string, unknown> = {
      client_id: clientId,
      serviceSummary: body.serviceSummary,
      channelType: body.channelType || 'manual',
      status: body.status ?? 'confirmed',
    };

    if (body.staff_id && body.staff_id !== "none") insertData.staff_id = body.staff_id;
    if (body.branchId) insertData.branchId = body.branchId;
    if (body.location) insertData.location = body.location;
    if (body.notes) insertData.notes = body.notes;
    if (body.slotNumber) insertData.slotNumber = body.slotNumber;
    insertData.paymentMethod = body.paymentMethod || 'cash';
    insertData.source = body.source || 'bot';

    let durationMinutes = 30;
    let durationMode = "time";
    const serviceId = body.serviceId;

    if (serviceId) {
      insertData.serviceId = serviceId;
      const { data: product } = await supabase
        .from('Product')
        .select('name, durationMinutes, durationMode')
        .eq('id', serviceId)
        .maybeSingle();
      if (product) {
        durationMinutes = Number(product.durationMinutes) || 30;
        durationMode = product.durationMode || "time";
        if (!insertData.serviceSummary && product.name) {
          insertData.serviceSummary = product.name;
        }
      }
    }

    if (durationMode === "queue") {
      if (body.bookingDate) {
        insertData.bookingDate = `${body.bookingDate}T00:00:00Z`;
      }
      insertData.endTime = null;

      let queueNumber = 1;
      if (body.bookingDate) {
        let q = supabase
          .from('Booking')
          .select('id', { count: 'exact', head: true })
          .eq('serviceId', serviceId)
          .gte('bookingDate', `${body.bookingDate}T00:00:00`)
          .lt('bookingDate', `${body.bookingDate}T23:59:59`)
          .neq('status', 'cancelled');

        if (body.staff_id && body.staff_id !== "none") {
          q = q.eq('staff_id', body.staff_id);
        }

        const { count } = await q;
        queueNumber = (count || 0) + 1;
      }
      insertData.queueNumber = queueNumber;
    } else {
      if (body.bookingDate) {
        if (body.bookingTime) {
          insertData.bookingDate = `${body.bookingDate}T${body.bookingTime}:00Z`;
          insertData.bookingTime = body.bookingTime;

          const startStr = `${body.bookingDate}T${body.bookingTime}:00Z`;
          const startDate = new Date(startStr);
          const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
          const endTime = endDate.toISOString();
          insertData.endTime = endTime;
        } else {
          insertData.bookingDate = `${body.bookingDate}T00:00:00Z`;
          insertData.endTime = null;
        }
      }
    }

    // --- START M3 VALIDATIONS ---

    if (targetStaffId && targetStaffId !== "none" && targetDateString) {
      // 1. Check for staff blocked date (leave)
      const { data: blocked } = await supabase
        .from('StaffBlockedDate')
        .select('id')
        .eq('staff_id', targetStaffId)
        .eq('blockedDate', targetDateString)
        .limit(1);

      if (blocked && blocked.length > 0) {
        return NextResponse.json(
          { error: 'العاملة في إجازة في هذا اليوم' },
          { status: 409 }
        );
      }

      // 2. Check for time-based overlap
      if (durationMode !== "queue" && body.bookingTime) {
        const { data: overlaps } = await supabase
          .from('Booking')
          .select('id, bookingDate, endTime')
          .eq('staff_id', targetStaffId)
          .neq('status', 'cancelled')
          .gte('bookingDate', `${targetDateString}T00:00:00Z`)
          .lte('bookingDate', `${targetDateString}T23:59:59Z`);

        if (overlaps && overlaps.length > 0) {
          const newStart = new Date(insertData.bookingDate as string).getTime();
          const newEnd = new Date(insertData.endTime as string).getTime();

          const hasConflict = overlaps.some((b) => {
            const bStart = parseAsUTC(b.bookingDate);
            const bEnd = b.endTime ? parseAsUTC(b.endTime) : bStart + 30 * 60 * 1000;
            return newStart < bEnd && newEnd > bStart;
          });

          if (hasConflict) {
            return NextResponse.json(
              { error: 'هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر.' },
              { status: 409 }
            );
          }
        }
      }
    }
    // --- END M3 VALIDATIONS ---

    const { data: booking, error } = await supabase
      .from('Booking')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      if (error.code === '23P01') {
        return NextResponse.json(
          { error: 'هذا الوقت محجوز بالفعل. يرجى اختيار وقت آخر.' },
          { status: 409 }
        );
      }
      throw error;
    }
    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  } finally {
    if (releaseLock) {
      releaseLock();
    }
  }
}
