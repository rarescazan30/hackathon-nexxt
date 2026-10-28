// Supabase returns { data, error } instead of throwing; this turns errors into exceptions.
export function unwrap<R extends { data: unknown; error: unknown }>(result: R): NonNullable<R['data']> {
  if (result.error) throw result.error
  return result.data as NonNullable<R['data']>
}
