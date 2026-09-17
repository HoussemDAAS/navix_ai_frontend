import type { CalendarItem } from '@/lib/api'

/** Client-side exports for the editorial calendar — .ics for calendar apps, .csv for sheets. */

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toIcsUtc(iso: string): string {
  const d = new Date(iso)
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
}

export function buildIcs(items: CalendarItem[]): string {
  const stamp = toIcsUtc(new Date().toISOString())
  const events = items
    .filter((i) => i.scheduled_at)
    .map((i) => {
      const start = new Date(i.scheduled_at)
      const end = new Date(start.getTime() + 60 * 60 * 1000)
      const platform = PLATFORM_LABELS[i.platform] ?? i.platform
      return [
        'BEGIN:VEVENT',
        `UID:${i.id}@navix`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${toIcsUtc(start.toISOString())}`,
        `DTEND:${toIcsUtc(end.toISOString())}`,
        `SUMMARY:${escapeIcs(`[${platform}] ${i.title}`)}`,
        ...(i.notes ? [`DESCRIPTION:${escapeIcs(i.notes)}`] : []),
        `STATUS:${i.status === 'published' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT',
      ].join('\r\n')
    })
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Navix//Editorial Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

export function buildCsv(items: CalendarItem[]): string {
  const header = ['Date', 'Time', 'Title', 'Platform', 'Status', 'Notes'].join(',')
  const rows = [...items]
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .map((i) => {
      const d = new Date(i.scheduled_at)
      return [
        csvCell(d.toLocaleDateString()),
        csvCell(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })),
        csvCell(i.title),
        csvCell(PLATFORM_LABELS[i.platform] ?? i.platform),
        csvCell(i.status),
        csvCell(i.notes ?? ''),
      ].join(',')
    })
  return [header, ...rows].join('\n')
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
