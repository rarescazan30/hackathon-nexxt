'use client'

import { useActionState } from 'react'
import { signIn, type AuthState } from '@/app/auth/actions'
import { Field, FormError, SubmitButton } from '@/components/auth/form-parts'

const initialState: AuthState = {}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.email} />
      <Field label="Password" name="password" type="password" autoComplete="current-password" />
      <FormError message={state.error} />
      <SubmitButton pending={pending}>Log in</SubmitButton>
    </form>
  )
}
