'use client'

// "Log in as Andrei (demo)": logs in as the seeded demo user, so judges skip sign-up.
import { useActionState } from 'react'
import { Sparkles } from 'lucide-react'
import { signInAsDemo, type AuthState } from '@/app/auth/actions'
import { FormError } from '@/components/auth/form-parts'

const initialState: AuthState = {}

export function DemoButton() {
  const [state, formAction, pending] = useActionState(signInAsDemo, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#ddd8e6] py-3 text-sm font-semibold text-[#5f4bb6] transition-colors hover:bg-[#f1effa] disabled:opacity-60 dark:border-[#353042] dark:text-[#a594f0] dark:hover:bg-[#2b253a]"
      >
        <Sparkles size={16} />
        {pending ? 'One moment…' : 'Log in as Andrei (demo)'}
      </button>
      <FormError message={state.error} />
    </form>
  )
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-[#96909f]">
      <span className="h-px flex-1 bg-[#e2dfe8] dark:bg-[#353042]" />
      or
      <span className="h-px flex-1 bg-[#e2dfe8] dark:bg-[#353042]" />
    </div>
  )
}
