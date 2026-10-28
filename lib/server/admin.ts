// The admin account is the one whose email is ADMIN_EMAIL in .env.local (created by
// `npm run seed`). It sees the Admin button and /admin; everyone else gets a 404 there.

export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase()
  return admin !== '' && (email ?? '').trim().toLowerCase() === admin
}
