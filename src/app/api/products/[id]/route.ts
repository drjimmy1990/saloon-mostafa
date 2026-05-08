import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const supabase = getServiceRoleClient();
    const { data: product, error } = await supabase.from('Product').select('*, Branch(*)').eq('id', id).single();
    if (error || !product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
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
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.isAvailable !== undefined) updateData.isAvailable = body.isAvailable;
    if (body.availableAtHome !== undefined) updateData.availableAtHome = body.availableAtHome;
    if (body.availableAtSalon !== undefined) updateData.availableAtSalon = body.availableAtSalon;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.branchId !== undefined) updateData.branchId = body.branchId || null;
    if (body.durationMinutes !== undefined) updateData.durationMinutes = body.durationMinutes;
    if (body.durationMode !== undefined) updateData.durationMode = body.durationMode;
    if (body.depositAmount !== undefined) updateData.depositAmount = body.depositAmount;
    if (body.publishAt !== undefined) updateData.publishAt = body.publishAt || null;

    const { data: product, error } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', id)
      .select("*, Branch(*)")
      .single();

    if (error) throw error;

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const supabase = getServiceRoleClient();
    const { error } = await supabase.from('Product').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
