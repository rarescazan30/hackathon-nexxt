// /auth/signout: logs out and goes to /login, or to /register with ?next=/register
// ("Log out and create a new account").
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function signOut(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // Only these two places: never redirect to a URL taken from the request.
  const next = request.nextUrl.searchParams.get('next') === '/register' ? '/register' : '/login'
  // 303 so a POST from a form turns into a normal GET.
  return NextResponse.redirect(new URL(next, request.url), { status: 303 })
}

export { signOut as GET, signOut as POST }
