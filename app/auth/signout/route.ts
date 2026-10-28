// /auth/signout: logs out and goes to /login.
// The "Log out" button on the Profile screen will post here (docs/plan.md).
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function signOut(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // 303 so a POST from a form turns into a normal GET of /login.
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}

export { signOut as GET, signOut as POST }
