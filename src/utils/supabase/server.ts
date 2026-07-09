import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Cookie-based server client — reads the caller's Supabase Auth session
// from request cookies. Use this for auth checks in API routes/pages.
// Next.js 16: cookies() is async (returns Promise<ReadonlyRequestCookies>).
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — safe to ignore; refresh on next navigation.
          }
        },
      },
    }
  );
}