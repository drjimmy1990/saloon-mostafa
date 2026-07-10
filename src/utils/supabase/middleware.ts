import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  return supabaseResponse
}
