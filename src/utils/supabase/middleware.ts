import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-browser cookies, so please do not add any code here.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all routes except /login and public API routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login')
  
  if (
    !user &&
    !isAuthRoute &&
    !request.nextUrl.pathname.startsWith('/api/public') &&
    !request.nextUrl.pathname.startsWith('/api/webhooks') &&
    !request.nextUrl.pathname.startsWith('/api/notifications') &&
    request.nextUrl.pathname !== '/favicon.ico' &&
    !request.nextUrl.pathname.startsWith('/_next')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  
  // If user is logged in and tries to access /login, redirect to /
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Demo user API security enforcement
  if (user && request.nextUrl.pathname.startsWith('/api/')) {
    try {
      const { data: roleData } = await getServiceRoleClient()
        .from('AppUserRole')
        .select('role')
        .eq('user_id', user.id)
        .single()

      if (roleData?.role === 'demo') {
        const path = request.nextUrl.pathname
        const method = request.method.toUpperCase()

        // 1. Restricted paths (/api/users* and /api/clients/export)
        if (path.startsWith('/api/users') || path.startsWith('/api/clients/export')) {
          return NextResponse.json(
            { error: 'غير مصرح - حساب العرض التوضيحي لا يمكنه الوصول لهذه البيانات' },
            { status: 403 }
          )
        }

        // 2. Write HTTP methods (POST, PUT, PATCH, DELETE)
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          return NextResponse.json(
            { error: 'وضع العرض التوضيحي للقراءة فقط - لا يمكن تعديل البيانات' },
            { status: 403 }
          )
        }
      }
    } catch {
      // Ignore database error in middleware and proceed to route handler
    }
  }

  return supabaseResponse
}
