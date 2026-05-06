import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

// GET /api/products?type=service|product&branchId=uuid
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type'); // 'service' | 'product' | null
    const branchId = searchParams.get('branchId');

    let query = supabase
      .from('Product')
      .select("*, Branch(*)")
      .order('sortOrder', { ascending: true });

    if (typeFilter === 'service' || typeFilter === 'product') {
      query = query.eq('type', typeFilter);
    }

    if (branchId) {
      query = query.eq('branchId', branchId);
    }

    const { data: products, error } = await query;

    if (error) throw error;
    return NextResponse.json(products || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceRoleClient();

    // Get the highest sortOrder to place the new product at the end
    const { data: lastProduct } = await supabase
      .from('Product')
      .select('sortOrder')
      .order('sortOrder', { ascending: false })
      .limit(1)
      .single();

    const nextSortOrder = (lastProduct?.sortOrder ?? 0) + 1;

    const { data: product, error } = await supabase
      .from('Product')
      .insert({
        name: body.name,
        description: body.description ?? '',
        price: body.price ?? '',
        images: body.images ?? [],
        isAvailable: body.isAvailable ?? true,
        availableAtHome: body.availableAtHome ?? false,
        availableAtSalon: body.availableAtSalon ?? true,
        category: body.category ?? '',
        notes: body.notes ?? '',
        sortOrder: nextSortOrder,
        type: body.type ?? 'service',
        stock: body.stock ?? null,
        branchId: body.branchId || null,
        durationMinutes: body.durationMinutes ?? 30,
        durationMode: body.durationMode ?? 'time',
        depositAmount: body.depositAmount ?? 0,
        publishAt: body.publishAt || null,
      })
      .select("*, Branch(*)")
      .single();

    if (error) throw error;

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

// PUT /api/products — Batch reorder
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    // Expect: { orderedIds: ["id1", "id2", ...] }
    const orderedIds: string[] = body.orderedIds;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: 'orderedIds array required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Update each product's sortOrder based on its position in the array
    const updates = orderedIds.map((id, index) =>
      supabase
        .from('Product')
        .update({ sortOrder: index + 1 })
        .eq('id', id)
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to reorder products' }, { status: 500 });
  }
}
