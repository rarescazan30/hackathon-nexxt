// Runs before every page: refreshes the Supabase session cookie and guards routes.
// The onboarding check (profiles.onboarding_completed) lives in the /app page, not here,
// so the proxy stays fast and never queries the database.
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/app', '/onboarding']
const AUTH_ROUTES = ['/login', '/register']

function matches(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          // Refreshed tokens go both to the request (for this render) and the response (for the browser).
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    },
  )

  // getClaims() verifies the JWT; don't trust getSession() on the server.
  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = Boolean(data?.claims)
  const { pathname } = request.nextUrl

  if (!isLoggedIn && matches(pathname, PROTECTED_ROUTES)) {
    return redirectKeepingCookies(request, response, '/login')
  }
  if (isLoggedIn && matches(pathname, AUTH_ROUTES)) {
    return redirectKeepingCookies(request, response, '/app')
  }
  return response
}

// A redirect is a new response, so copy over any refreshed session cookies.
function redirectKeepingCookies(request: NextRequest, response: NextResponse, pathname: string) {
  const redirect = NextResponse.redirect(new URL(pathname, request.url))
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
  return redirect
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
}
