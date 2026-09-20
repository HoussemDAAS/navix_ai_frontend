import { supabase } from '@/lib/supabase/client'
import type { StudioEvent } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Send one message to a Studio session and read the assistant's turn as it
 * streams (Server-Sent Events over fetch — EventSource cannot carry the auth header).
 */
export async function streamStudioMessage(
  projectId: string,
  sessionId: string,
  body: { content: string; language?: string },
  onEvent: (event: StudioEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch(`${API_URL}/projects/${projectId}/studio/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status})`
    try {
      const json = (await res.json()) as { message?: string }
      if (json.message) message = json.message
    } catch {
      // non-JSON error body
    }
    throw new Error(message)
  }

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
