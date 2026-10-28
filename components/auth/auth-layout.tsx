// Shared frame for /login and /register: same background, column and card as the app.
import Link from 'next/link'
import { Card, Logo } from '@/components/app/shell'

interface AuthLayoutProps {
  eyebrow: string
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}

export function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="min-h-screen bg-[#f7f6f9] text-[#292431] dark:bg-[#18151f] dark:text-[#f8f6fb]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-5 pb-10 pt-6">
        <Link href="/" aria-label="Home" className="self-start">
          <Logo />
        </Link>

        <header className="px-1 pb-6 pt-10">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[.18em] text-[#8c7ad9]">{eyebrow}</p>
          <h1 className="text-[27px] font-semibold tracking-[-.04em]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#706b7b] dark:text-[#aaa4b6]">{subtitle}</p>
        </header>

        <Card>{children}</Card>

        <p className="mt-6 text-center text-sm text-[#706b7b] dark:text-[#aaa4b6]">{footer}</p>
      </div>
    </main>
  )
}
