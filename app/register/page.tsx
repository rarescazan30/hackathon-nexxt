import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'zile. — Create account',
}

export default function RegisterPage() {
  return (
    <AuthLayout
      eyebrow="First step"
      title="Create account"
      subtitle="It takes a minute. Then we show you how you'd live in retirement."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[#5f4bb6] dark:text-[#a594f0]">
            Log in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  )
}
