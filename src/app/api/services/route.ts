import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

// GET /api/services — returns available services for booking
export async function GET() {
  try {
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('Product')
      .select('id, name, price, images, availableAtHome, availableAtSalon')
      .eq('isAvailable', true)
      .eq('type', 'service')
      .order('sortOrder', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json([], { status: 500 });
  }
}
