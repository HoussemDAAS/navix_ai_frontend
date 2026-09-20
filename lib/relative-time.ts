/** "3 days ago" style label for a past timestamp; null when unknown or in the future. */
export function relativeTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const diffMs = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diffMs) || diffMs < 0) return null
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  return `${months} month${months === 1 ? '' : 's'} ago`
}

/** "in 5 hours" style label for a future timestamp; null when unknown or already past. */
export function relativeTimeUntil(iso: string | null | undefined): string | null {
  if (!iso) return null
  const diffMs = new Date(iso).getTime() - Date.now()
  if (!Number.isFinite(diffMs) || diffMs <= 0) return null
  const minutes = Math.ceil(diffMs / 60_000)
  if (minutes < 60) return `in ${minutes} min`
  const hours = Math.ceil(minutes / 60)
  if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.ceil(hours / 24)
  return `in ${days} day${days === 1 ? '' : 's'}`
}
