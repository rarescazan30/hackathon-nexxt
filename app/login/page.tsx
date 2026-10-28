import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthLayout } from '@/components/auth/auth-layout'
import { DemoButton, OrDivider } from '@/components/auth/demo-button'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'zile. — Log in',
}

export default function LoginPage() {
  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Log in"
      subtitle="See how your retirement is shaping up."
      footer={
        <>
          No account yet?{' '}
          <Link href="/register" className="font-semibold text-[#5f4bb6] dark:text-[#a594f0]">
            Create one
          </Link>
        </>
      }
    >
      <LoginForm />
      <OrDivider />
      <DemoButton />
    </AuthLayout>
  )
}
