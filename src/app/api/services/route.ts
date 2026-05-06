import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

// GET /api/services?branchId=xyz — returns available services for booking
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const supabase = getServiceRoleClient();

    let query = supabase
      .from('Product')
      .select('id, name, price, images, availableAtHome, availableAtSalon, branchId')
      .eq('isAvailable', true)
      .eq('type', 'service')
      .order('sortOrder', { ascending: true });

    // Filter by branch if provided
    if (branchId) {
      query = query.eq('branchId', branchId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}
