import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { normalizePhone } from '@/lib/phone';

// GET /api/clients?page=1&limit=10&ai_enabled=true&search=john
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const ai_enabled = searchParams.get('ai_enabled');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const search = searchParams.get('search')?.trim() || '';

    const paginated = pageParam !== null && limitParam !== null;
    const page = Math.max(1, parseInt(pageParam || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(limitParam || '10', 10)));

    let query = supabase.from('Client').select('*, Channel(name, type), Message(*), Booking(id)', paginated ? { count: 'exact' } : undefined).order('last_interaction_at', { ascending: false });
    
    if (ai_enabled !== null) {
      query = query.eq('ai_enabled', ai_enabled === 'true');
    }

    if (search) {
      const cleanDigits = search.replace(/\D/g, '');
      const phoneFilter = cleanDigits.length >= 7
        ? `phone.ilike.%${cleanDigits.slice(-9)}%,platform_user_id.ilike.%${cleanDigits.slice(-9)}%`
        : `phone.ilike.%${search}%,platform_user_id.ilike.%${search}%`;
      query = query.or(`name.ilike.%${search}%,${phoneFilter}`);
    }

    if (paginated) {
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
    }

    const { data: clients, error, count } = await query;

    if (error) throw error;

    // Map Message relation to messages array for frontend compatibility and calculate bookings_count
    // Normalize platform from Channel.type if available, falling back to Client.platform
    const mapped = (clients || []).map((client: any) => ({
      ...client,
      platform: client.Channel?.type || client.platform || 'whatsapp',
      messages: client.Message || [],
      bookings_count: client.Booking ? client.Booking.length : 0
    }));

    if (paginated) {
      return NextResponse.json({ data: mapped, total: count ?? 0 });
    }

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("Clients GET error:", error?.message || error, error?.details, error?.hint);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST /api/clients
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const supabase = getServiceRoleClient();
    
    const rawPhone = body.phone || '';
    const phone = rawPhone ? normalizePhone(rawPhone) : '';
    const platform_user_id = body.platform_user_id 
      ? normalizePhone(body.platform_user_id) 
      : phone;

    // Check if client already exists by phone or platform_user_id
    if (phone || platform_user_id) {
      const searchTarget = phone || platform_user_id;
      const last9 = searchTarget.slice(-9);
      const { data: existingClients, error: searchError } = await supabase
        .from('Client')
        .select('id, phone')
        .or(`phone.ilike.%${last9}%,platform_user_id.ilike.%${last9}%`)
        .limit(1);

      if (!searchError && existingClients && existingClients.length > 0) {
        // Update existing client
        const existingId = existingClients[0].id;
        const updateData: any = {};
        if (body.ai_enabled !== undefined) updateData.ai_enabled = body.ai_enabled;
        if (body.name) updateData.name = body.name;
        if (phone && existingClients[0].phone !== phone) updateData.phone = phone;
        
        const { data: updatedClient, error: updateError } = await supabase
          .from('Client')
          .update(updateData)
          .eq('id', existingId)
          .select()
          .single();
          
        if (updateError) throw updateError;
        return NextResponse.json(updatedClient, { status: 200 });
      }
    }

    // Insert new client
    const insertData: any = {
      name: body.name || null,
      phone: phone,
      address: body.address ?? '',
      notes: body.notes ?? '',
      platform_user_id: platform_user_id,
      platform: body.platform ?? 'whatsapp',
    };

    if (body.ai_enabled !== undefined) {
      insertData.ai_enabled = body.ai_enabled;
    }

    const { data: client, error: insertError } = await supabase
      .from('Client')
      .insert(insertData)
      .select()
      .single();

    if (insertError) throw insertError;
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create or update client' }, { status: 500 });
  }
}
