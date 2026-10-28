// Buttons that depend on whether someone is logged in. Server components: they read the
// session, so pages render them inside <Suspense> with the logged-out version as fallback.
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RegisterForm } from '@/components/auth/register-form'

const PRIMARY = 'pulse-hover w-full rounded-xl bg-[#33256c] py-3 text-center text-sm font-semibold text-white dark:bg-[#6f5cc1]'
const SECONDARY = 'pulse-hover w-full rounded-xl bg-white py-3 text-center text-sm font-semibold text-[#33256c] dark:bg-[#211d2b] dark:text-white'

/** First name of the logged-in user, or null. */
async function signedInName(): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', data.user.id).maybeSingle()
  return (profile?.full_name ?? data.user.email ?? 'you').split(' ')[0]
}

export function LoggedOutButtons() {
  return (
    <div className="flex max-w-[360px] flex-col gap-3">
      <Link href="/register" className={PRIMARY}>
        Sign up
      </Link>
      <Link href="/login" className={SECONDARY}>
        Log in
      </Link>
    </div>
  )
}

/** Landing page: Sign up / Log in, or Open the app / Log out when already logged in. */
export async function LandingButtons() {
  const name = await signedInName()
  if (!name) return <LoggedOutButtons />
  return (
    <div className="flex max-w-[360px] flex-col gap-3">
      <Link href="/app" className={PRIMARY}>
        Open the app
      </Link>
      <form action="/auth/signout" method="post">
        <button className={SECONDARY}>Log out ({name})</button>
      </form>
    </div>
  )
}

/** /register: the form, or — when logged in — a way to log out and make a new account. */
export async function RegisterOrSignedIn() {
  const name = await signedInName()
  if (!name) return <RegisterForm />
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm leading-6">
        You&rsquo;re logged in as <b>{name}</b>. To create a new account, log out first.
      </p>
      <form action="/auth/signout?next=/register" method="post">
        <button className={PRIMARY}>Log out and create a new account</button>
      </form>
      <Link href="/app" className={SECONDARY}>
        Open the app
      </Link>
    </div>
  )
}
