import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

// GET /api/staff-services?staffId=xxx OR ?productId=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get('staffId');
    const productId = searchParams.get('productId');

    let query = supabase
      .from('StaffService')
      .select('*, Staff(id, name, nameAr, branchId), Product(id, name, price, category)');

    if (staffId) {
      query = query.eq('staff_id', staffId);
    }
    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('StaffService GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff services' }, { status: 500 });
  }
}

// POST /api/staff-services — Bulk assign services to a staff member
// Body: { staffId: string, productIds: string[] }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { staffId, productIds } = body;

    if (!staffId || !Array.isArray(productIds)) {
      return NextResponse.json({ error: 'staffId and productIds[] required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Delete existing assignments for this staff
    await supabase.from('StaffService').delete().eq('staff_id', staffId);

    // Insert new assignments
    if (productIds.length > 0) {
      const rows = productIds.map((pid: string) => ({
        staff_id: staffId,
        product_id: pid,
      }));

      const { error } = await supabase.from('StaffService').insert(rows);
      if (error) throw error;
    }

    // Return updated list
    const { data } = await supabase
      .from('StaffService')
      .select('*, Product(id, name, price, category)')
      .eq('staff_id', staffId);

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('StaffService POST error:', error);
    return NextResponse.json({ error: 'Failed to assign services' }, { status: 500 });
  }
}

// PUT /api/staff-services — Bulk assign staff to a product (product-centric)
// Body: { productId: string, staffIds: string[] }
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, staffIds } = body;

    if (!productId || !Array.isArray(staffIds)) {
      return NextResponse.json({ error: 'productId and staffIds[] required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Delete existing assignments for this product
    await supabase.from('StaffService').delete().eq('product_id', productId);

    // Insert new assignments
    if (staffIds.length > 0) {
      const rows = staffIds.map((sid: string) => ({
        staff_id: sid,
        product_id: productId,
      }));

      const { error } = await supabase.from('StaffService').insert(rows);
      if (error) throw error;
    }

    // Return updated list
    const { data } = await supabase
      .from('StaffService')
      .select('*, Staff(id, name, branchId)')
      .eq('product_id', productId);

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('StaffService PUT error:', error);
    return NextResponse.json({ error: 'Failed to assign staff to product' }, { status: 500 });
  }
}
