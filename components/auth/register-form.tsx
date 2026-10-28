'use client'

import { useActionState } from 'react'
import { signUp, type AuthState } from '@/app/auth/actions'
import { Field, FormError, SubmitButton } from '@/components/auth/form-parts'

const initialState: AuthState = {}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field label="Name" name="fullName" autoComplete="name" defaultValue={state.fullName} />
      <Field label="Email" name="email" type="email" autoComplete="email" defaultValue={state.email} />
      <Field label="Password (at least 8 characters)" name="password" type="password" autoComplete="new-password" minLength={8} />
      <FormError message={state.error} />
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  )
}
