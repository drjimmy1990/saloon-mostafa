import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

const parseAsUTC = (dateStr: string) => {
  if (!dateStr) return 0;
  let formatted = dateStr;
  if (!dateStr.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(dateStr)) {
    formatted = dateStr.replace(' ', 'T') + 'Z';
  }
  return new Date(formatted).getTime();
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const supabase = getServiceRoleClient();
    const { data: booking, error } = await supabase.from('Booking').select('*, client:Client(*)').eq('id', id).single();
    
    if (error || !booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(booking);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceRoleClient();

    // 1. Fetch existing booking by ID. If not found, return 404.
    const { data: existingBooking, error: fetchErr } = await supabase
      .from('Booking')
      .select('*, client:Client(*)')
      .eq('id', id)
      .single();

    if (fetchErr || !existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 2. Resolve values (either updated ones or existing ones)
    const targetStaffId = body.staff_id !== undefined ? (body.staff_id === 'none' ? null : body.staff_id) : existingBooking.staff_id;
    const targetServiceId = body.serviceId !== undefined ? body.serviceId : existingBooking.serviceId;
    
    const existingDateString = existingBooking.bookingDate ? existingBooking.bookingDate.split('T')[0] : '';
    const targetDateString = body.bookingDate !== undefined ? body.bookingDate : existingDateString;
    const targetBookingTime = body.bookingTime !== undefined ? body.bookingTime : existingBooking.bookingTime;

    // 3. Determine if validations are needed:
    // If any of: bookingDate, bookingTime, staff_id, serviceId, or status (reactivated from cancelled) are being changed.
    const isStaffChanged = body.staff_id !== undefined && body.staff_id !== existingBooking.staff_id;
    const isServiceChanged = body.serviceId !== undefined && body.serviceId !== existingBooking.serviceId;
    const isDateChanged = body.bookingDate !== undefined && body.bookingDate !== existingDateString;
    const isTimeChanged = body.bookingTime !== undefined && body.bookingTime !== existingBooking.bookingTime;
    const isStatusReactivated = body.status !== undefined && body.status !== existingBooking.status && existingBooking.status === 'cancelled' && body.status !== 'cancelled';

    const needsValidation = isStaffChanged || isServiceChanged || isDateChanged || isTimeChanged || isStatusReactivated;

    // 4. Resolve service parameters for recalculations
    let durationMinutes = 30;
    let durationMode = "time";
    let resolvedServiceSummary: string | undefined = undefined;
    if (targetServiceId) {
      const { data: product } = await supabase
        .from('Product')
        .select('name, durationMinutes, durationMode')
        .eq('id', targetServiceId)
        .maybeSingle();
      if (product) {
        durationMinutes = Number(product.durationMinutes) || 30;
        durationMode = product.durationMode || "time";
        if (body.serviceSummary === undefined && body.serviceId !== undefined && product.name) {
          resolvedServiceSummary = product.name;
        }
      }
    }

    // 5. Recalculate Booking Datetime and End Time
    let calculatedBookingDate: string | null = null;
    let calculatedEndTime: string | null = null;
    if (durationMode === "queue") {
      if (targetDateString) {
        calculatedBookingDate = `${targetDateString}T00:00:00Z`;
      }
      calculatedEndTime = null;
    } else {
      if (targetDateString) {
        if (targetBookingTime) {
          calculatedBookingDate = `${targetDateString}T${targetBookingTime}:00Z`;
          const startStr = `${targetDateString}T${targetBookingTime}:00Z`;
          const startDate = new Date(startStr);
          const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
          calculatedEndTime = endDate.toISOString();
        } else {
          calculatedBookingDate = `${targetDateString}T00:00:00Z`;
          calculatedEndTime = null;
        }
      }
    }

    // 6. Execute leave and overlap validations if needed
    if (needsValidation && targetStaffId && targetStaffId !== "none" && targetDateString) {
      // Leave date validation
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

      // Overlap validation
      if (durationMode !== "queue" && targetBookingTime) {
        const { data: overlaps } = await supabase
          .from('Booking')
          .select('id, bookingDate, endTime')
          .eq('staff_id', targetStaffId)
          .neq('status', 'cancelled')
          .neq('id', id) // EXCLUDE CURRENT BOOKING ID
          .gte('bookingDate', `${targetDateString}T00:00:00Z`)
          .lte('bookingDate', `${targetDateString}T23:59:59Z`);

        if (overlaps && overlaps.length > 0) {
          const newStart = new Date(calculatedBookingDate!).getTime();
          const newEnd = new Date(calculatedEndTime!).getTime();

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

    // 6.5. Update linked Client details if requested
    const currentClient = existingBooking.client;
    let targetClientId = existingBooking.client_id;
    const clientName = body.clientName;
    const clientPhone = body.clientPhone;

    if (clientPhone !== undefined && currentClient && clientPhone !== currentClient.phone) {
      // Query if there's an existing client with that new phone
      const { data: existingClient, error: clientFetchErr } = await supabase
        .from('Client')
        .select('*')
        .eq('phone', clientPhone)
        .maybeSingle();

      if (clientFetchErr) throw clientFetchErr;

      if (existingClient) {
        // If found, link the booking to their client_id
        targetClientId = existingClient.id;
        // and update their name if clientName is provided
        if (clientName !== undefined) {
          const { error: updateErr } = await supabase
            .from('Client')
            .update({ name: clientName })
            .eq('id', existingClient.id);
          if (updateErr) throw updateErr;
        }
      } else {
        // If not found, update the current client's name and phone in the Client table
        const clientUpdate: any = { phone: clientPhone };
        if (clientName !== undefined) {
          clientUpdate.name = clientName;
        }
        const { error: updateErr } = await supabase
          .from('Client')
          .update(clientUpdate)
          .eq('id', currentClient.id);
        if (updateErr) throw updateErr;
      }
    } else {
      // If clientPhone is unchanged/omitted but clientName has changed, update the current client's name
      const isPhoneUnchangedOrOmitted = clientPhone === undefined || (currentClient && clientPhone === currentClient.phone);
      if (isPhoneUnchangedOrOmitted && clientName !== undefined && currentClient && clientName !== currentClient.name) {
        const { error: updateErr } = await supabase
          .from('Client')
          .update({ name: clientName })
          .eq('id', currentClient.id);
        if (updateErr) throw updateErr;
      }
    }

    // 7. Update DB Record
    const updateData: any = {};
    updateData.client_id = targetClientId;
    if (body.serviceSummary !== undefined) {
      updateData.serviceSummary = body.serviceSummary;
    } else if (resolvedServiceSummary !== undefined) {
      updateData.serviceSummary = resolvedServiceSummary;
    }
    if (body.channelType !== undefined) updateData.channelType = body.channelType;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.serviceId !== undefined) updateData.serviceId = body.serviceId;
    if (body.staff_id !== undefined) updateData.staff_id = body.staff_id === 'none' ? null : body.staff_id;
    if (body.branchId !== undefined) updateData.branchId = body.branchId;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.slotNumber !== undefined) updateData.slotNumber = body.slotNumber;

    if (calculatedBookingDate) {
      updateData.bookingDate = calculatedBookingDate;
      updateData.bookingTime = durationMode === "queue" ? null : (targetBookingTime || null);
      updateData.endTime = calculatedEndTime;
    }

    const { data: booking, error } = await supabase
      .from('Booking')
      .update(updateData)
      .eq('id', id)
      .select('*, client:Client(*)')
      .single();

    if (error) throw error;
    return NextResponse.json(booking);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase.from('Booking').delete().eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}
