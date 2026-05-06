import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';

// GET /api/categories?type=service|product
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceRoleClient();
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');

    let query = supabase
      .from('Category')
      .select('*')
      .order('createdAt', { ascending: true });

    if (typeFilter === 'service' || typeFilter === 'product') {
      query = query.eq('type', typeFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = getServiceRoleClient();
    const { data, error } = await supabase
      .from('Category')
      .insert({
        label: body.label,
        color: body.color ?? 'sage',
        type: body.type ?? 'service',
        image: body.image ?? '',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
