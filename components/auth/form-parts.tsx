// Small building blocks shared by the login and register forms, styled like the Profil screen.

interface FieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password'
  autoComplete: string
  defaultValue?: string
  minLength?: number
}

export function Field({ label, name, type = 'text', autoComplete, defaultValue, minLength }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-medium text-[#858090] dark:text-[#a39cab]">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        minLength={minLength}
        required
        className="w-full rounded-xl border border-[#e2dfe8] bg-[#f1effa]/40 px-3.5 py-3 text-sm outline-none focus:border-[#6f5cc1] dark:border-[#353042] dark:bg-[#2b253a]/40"
      />
    </div>
  )
}

export function SubmitButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-xl bg-[#33256c] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
    >
      {pending ? 'One moment…' : children}
    </button>
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-xl bg-[#fdecec] px-3.5 py-2.5 text-sm text-[#b42318] dark:bg-[#3a1f24] dark:text-[#f3a4a4]">
      {message}
    </p>
  )
}
