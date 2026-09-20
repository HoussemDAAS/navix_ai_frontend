import { supabase } from '@/lib/supabase/client'
import type { StudioEvent, StudioReference } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function authHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const json = (await res.json()) as { message?: string | string[] }
    if (Array.isArray(json.message)) return json.message.join(', ')
    if (json.message) return json.message
  } catch {
    // non-JSON error body
  }
  return `Request failed (${res.status})`
}

/**
 * Send one message to a Studio session and read the assistant's turn as it
 * streams (Server-Sent Events over fetch — EventSource cannot carry the auth header).
 */
export async function streamStudioMessage(
  projectId: string,
  sessionId: string,
  body: { content: string; language?: string; reference_ids?: string[] },
  onEvent: (event: StudioEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_URL}/projects/${projectId}/studio/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(await authHeaders()),
    },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(await errorMessage(res))

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    let split = buffer.indexOf('\n\n')
    while (split >= 0) {
      const frame = buffer.slice(0, split)
      buffer = buffer.slice(split + 2)
      const line = frame.split('\n').find((l) => l.startsWith('data: '))
      if (line) {
        try {
          onEvent(JSON.parse(line.slice(6)) as StudioEvent)
        } catch {
          // malformed frame — skip
        }
      }
      split = buffer.indexOf('\n\n')
    }
  }
}

/** A public Instagram/TikTok post by link. Resolves once caption, metrics and transcript are in. */
export async function addStudioLinkReference(
  projectId: string,
  sessionId: string,
  url: string,
  signal?: AbortSignal,
): Promise<StudioReference> {
  const res = await fetch(`${API_URL}/projects/${projectId}/studio/sessions/${sessionId}/references/link`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ url }),
    signal,
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  const json = (await res.json()) as { data: StudioReference }
  return json.data
}

/** Upload one example (photo, PDF, text, video/audio). Resolves once the agent can read it. */
export async function uploadStudioReference(
  projectId: string,
  sessionId: string,
  file: File,
  signal?: AbortSignal,
): Promise<StudioReference> {
  const form = new FormData()
  form.append('file', file, file.name)
  const res = await fetch(`${API_URL}/projects/${projectId}/studio/sessions/${sessionId}/references`, {
    method: 'POST',
    headers: await authHeaders(),
    body: form,
    signal,
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  const json = (await res.json()) as { data: StudioReference }
  return json.data
}
