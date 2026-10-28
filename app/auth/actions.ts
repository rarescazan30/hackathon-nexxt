'use server'

// Server actions for login and register. They run on the server.
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export interface AuthState {
  error?: string
  email?: string
  fullName?: string
}

const AFTER_LOGIN = '/app'
const AFTER_SIGN_UP = '/onboarding'

const MIN_PASSWORD_LENGTH = 8

const SignInInput = z.object({
  email: z.email(),
  password: z.string().min(1),
})

const SignUpInput = z.object({
  fullName: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(MIN_PASSWORD_LENGTH),
})

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const input = SignInInput.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  const email = String(formData.get('email') ?? '')
  if (!input.success) {
    return { error: 'Enter your email and password.', email }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(input.data)
  if (error) {
    return { error: 'Wrong email or password.', email }
  }
  redirect(AFTER_LOGIN)
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fields = {
    fullName: String(formData.get('fullName') ?? ''),
    email: String(formData.get('email') ?? ''),
  }
  const input = SignUpInput.safeParse({ ...fields, password: formData.get('password') })
  if (!input.success) {
    const field = input.error.issues[0]?.path[0]
    const messages: Record<string, string> = {
      fullName: 'Enter your name.',
      email: "That email doesn't look right.",
      password: `Your password needs at least ${MIN_PASSWORD_LENGTH} characters.`,
    }
    return { error: messages[String(field)] ?? 'Please check your details.', ...fields }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: input.data.email,
    password: input.data.password,
    // The on_auth_user_created trigger copies full_name into profiles.
    options: { data: { full_name: input.data.fullName } },
  })
  if (error) {
    const messages: Record<string, string> = {
      user_already_exists: 'An account with this email already exists.',
      email_address_invalid: "That email doesn't look right.",
      over_email_send_rate_limit: 'Too many sign-ups in a short time. Try again in a few minutes.',
    }
    return { error: messages[error.code ?? ''] ?? "We couldn't create your account. Please try again.", ...fields }
  }
  if (!data.session) {
    // Only happens if "Confirm email" gets turned on in Supabase.
    return { error: 'We sent you a confirmation email. Open the link, then log in.', ...fields }
  }
  redirect(AFTER_SIGN_UP)
}
