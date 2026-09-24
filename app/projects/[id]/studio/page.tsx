'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  ChevronDown,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Music,
  Paperclip,
  Plus,
  Send,
  Square,
  X,
  type LucideIcon,
} from 'lucide-react'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AiMark } from '@/components/ui/ai-mark'
import { Spinner } from '@/components/ui/spinner'
import { DraftCard, IdeaCard } from '@/components/studio/ArtifactCards'
import { MemoryPanel } from '@/components/studio/MemoryPanel'
import { Markdown } from '@/components/studio/Markdown'
import { QuestionCard, TypingDots } from '@/components/studio/QuestionCard'
import { addStudioLinkReference, streamStudioMessage, uploadStudioReference } from '@/lib/studio-stream'
import { cn } from '@/lib/utils'
import {
  createStudioSession,
  getStudioMessages,
  listStudioReferences,
  listStudioSessions,
  type ReferenceKind,
  type StudioArtifact,
  type StudioDraft,
  type StudioIdea,
  type StudioMessage,
  type StudioReference,
  type StudioSession,
} from '@/lib/api'

const LANGUAGES = ['same as my posts', 'English', 'French', 'Arabic', 'Tunisian Arabic (Derja)']

const STARTERS = [
  'Ideas for this week',
  'Turn my best post into a series',
  'Write a reel script about my journey',
  'A caption for a photo I will post today',
]

const TOOL_LABEL: Record<string, string> = {
  search_my_posts: 'Reading your posts',
  search_field: 'Looking at your field',
  read_reference: 'Reading your reference',
  propose_ideas: 'Shaping ideas',
  write_draft: 'Writing',
}

const ACCEPT = 'image/*,video/*,audio/*,application/pdf,text/plain,text/markdown,.md,.txt,.csv'

/** Instagram post/reel and TikTok video links become references, like uploads */
const POST_URL_RE =
  /https?:\/\/(?:[\w-]+\.)?(?:instagram\.com\/(?:p|reel|reels|tv)\/[\w-]+\/?|tiktok\.com\/[^\s"'<>]+)/gi

function postUrlsIn(text: string): string[] {
  return Array.from(new Set(text.match(POST_URL_RE) ?? []))
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url)
    const tail = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean).slice(-2).join('/')
    return `${u.hostname.replace(/^www\./, '')}/${tail}`
  } catch {
    return url
  }
}

const KIND_ICON: Record<ReferenceKind, LucideIcon> = {
  image: ImageIcon,
  pdf: FileText,
  text: FileText,
  video: Film,
  audio: Music,
  link: Link2,
}

const KIND_VERB: Record<ReferenceKind, string> = {
  image: 'Looking at the photo',
  pdf: 'Reading the PDF',
  text: 'Reading the text',
  video: 'Transcribing the video',
  audio: 'Transcribing the audio',
  link: 'Reading the post',
}

function kindOfFile(file: File): ReferenceKind {
  const mime = file.type.toLowerCase()
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return 'text'
}

/** Sessions keep the default title until the first message names them */
function sessionLabel(s: StudioSession): string {
  if (s.title && s.title !== 'New session') return s.title
  return `Session · ${new Date(s.created_at).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

interface PendingTurn {
  text: string
  artifacts: StudioArtifact[]
  tool: string | null
}

interface Attachment {
  localId: string
  name: string
  kind: ReferenceKind
  status: 'uploading' | 'ready' | 'failed'
  reference?: StudioReference
  error?: string
}

function StudioContent() {
  const params = useParams()
  const projectId = params.id as string
  const searchParams = useSearchParams()

  const [sessions, setSessions] = useState<StudioSession[]>([])
  const [session, setSession] = useState<StudioSession | null>(null)
  const [messages, setMessages] = useState<StudioMessage[]>([])
  const [references, setReferences] = useState<StudioReference[]>([])
  const [pending, setPending] = useState<PendingTurn | null>(null)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  // The Library hands off with ?prompt= ("Draft in Studio", "Refine in Studio")
  const [input, setInput] = useState(() => searchParams.get('prompt') ?? '')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'ideas' | 'drafts' | 'references' | 'memory'>('ideas')
  const [dragging, setDragging] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openSession = useCallback(
    async (id: string) => {
      const [res, refs] = await Promise.all([
        getStudioMessages(projectId, id),
        listStudioReferences(projectId, id).catch(() => ({ data: [] as StudioReference[] })),
      ])
      setSession(res.data.session)
      setMessages(res.data.messages)
      setReferences(refs.data ?? [])
      setAttachments([])
      setLanguage(res.data.session.content_language || LANGUAGES[0])
    },
    [projectId],
  )

  const newSession = useCallback(async () => {
    const res = await createStudioSession(projectId, language)
    setSessions((prev) => [res.data.session, ...prev])
    setSession(res.data.session)
    setMessages(res.data.messages)
    setReferences([])
    setAttachments([])
  }, [projectId, language])

  // Boot: reopen the latest session, or start the first one
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await listStudioSessions(projectId)
        if (cancelled) return
        const list = res.data ?? []
        setSessions(list)
        if (list.length > 0) {
          await openSession(list[0].id)
        } else {
          const created = await createStudioSession(projectId)
          if (cancelled) return
          setSessions([created.data.session])
          setSession(created.data.session)
          setMessages(created.data.messages)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not open the Studio.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId, openSession])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, pending?.text, pending?.artifacts.length])

  /* ── Attachments ─────────────────────────────────────────── */

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      if (!session) return
      const list = Array.from(files)
      for (const file of list) {
        const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const kind = kindOfFile(file)
        setAttachments((prev) => [...prev, { localId, name: file.name, kind, status: 'uploading' }])
        uploadStudioReference(projectId, session.id, file)
          .then((reference) => {
            setReferences((prev) => [...prev, reference])
            setAttachments((prev) =>
              prev.map((a) =>
                a.localId === localId
                  ? reference.status === 'ready'
                    ? { ...a, status: 'ready', reference }
                    : { ...a, status: 'failed', reference, error: reference.error ?? 'Could not read this file' }
                  : a,
              ),
            )
          })
          .catch((err) => {
            setAttachments((prev) =>
              prev.map((a) =>
                a.localId === localId
                  ? { ...a, status: 'failed', error: err instanceof Error ? err.message : 'Upload failed' }
                  : a,
              ),
            )
          })
      }
    },
    [projectId, session],
  )

  /** Fetch a post by link (caption, metrics, transcript) and resolve with its reference, or null. */
  const addLink = useCallback(
    async (url: string): Promise<StudioReference | null> => {
      if (!session) return null
      const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setAttachments((prev) => [...prev, { localId, name: shortUrl(url), kind: 'link', status: 'uploading' }])
      try {
        const reference = await addStudioLinkReference(projectId, session.id, url)
        setReferences((prev) => [...prev, reference])
        setAttachments((prev) =>
          prev.map((a) =>
            a.localId === localId
              ? reference.status === 'ready'
                ? { ...a, name: reference.title, status: 'ready', reference }
                : { ...a, status: 'failed', reference, error: reference.error ?? 'Could not read this post' }
              : a,
          ),
        )
        return reference.status === 'ready' ? reference : null
      } catch (err) {
        setAttachments((prev) =>
          prev.map((a) =>
            a.localId === localId
              ? { ...a, status: 'failed', error: err instanceof Error ? err.message : 'Could not read this post' }
              : a,
          ),
        )
        return null
      }
    },
    [projectId, session],
  )

  const removeAttachment = useCallback((localId: string) => {
    setAttachments((prev) => prev.filter((a) => a.localId !== localId))
  }, [])

  const uploading = attachments.some((a) => a.status === 'uploading')

  /** A pasted post link becomes a reference chip instead of text */
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const text = e.clipboardData.getData('text').trim()
    const urls = postUrlsIn(text)
    if (urls.length === 1 && urls[0] === text) {
      e.preventDefault()
      void addLink(text)
    }
  }

  /* ── Sending ─────────────────────────────────────────────── */

  const send = useCallback(
    async (text: string) => {
      const content = text.trim()
      if (!content || !session || busy || uploading) return

      setError(null)
      setBusy(true)

      // Links typed into the message are read first, then attached like uploads
      const attachedUrls = new Set(attachments.map((a) => a.reference?.source_url).filter(Boolean))
      const linkUrls = postUrlsIn(content).filter((u) => !attachedUrls.has(u))
      const linkRefs = (await Promise.all(linkUrls.map((u) => addLink(u)))).filter(
        (r): r is StudioReference => r !== null,
      )

      const readyRefs = [
        ...attachments.filter((a) => a.status === 'ready' && a.reference).map((a) => a.reference!),
        ...linkRefs,
      ]
      const referenceIds = readyRefs.map((r) => r.id)
      const chips: StudioArtifact[] = readyRefs.map((r) => ({
        type: 'reference' as const,
        id: r.id,
        title: r.title,
        kind: r.kind,
      }))

      setInput('')
      setAttachments([])
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          session_id: session.id,
          role: 'user',
          content,
          artifacts: chips,
          created_at: new Date().toISOString(),
        },
      ])
      const turn: PendingTurn = { text: '', artifacts: [], tool: null }
      setPending({ ...turn })
      const controller = new AbortController()
      abortRef.current = controller

      try {
        await streamStudioMessage(
          projectId,
          session.id,
          { content, language, reference_ids: referenceIds.length > 0 ? referenceIds : undefined },
          (event) => {
            if (event.type === 'token') {
              turn.text += event.text
              turn.tool = null
            } else if (event.type === 'tool') {
              turn.tool = event.name
            } else if (event.type === 'ideas') {
              turn.artifacts.push(...event.ideas.map((i) => ({ type: 'idea' as const, ...i })))
              turn.tool = null
            } else if (event.type === 'draft') {
              turn.artifacts.push({ type: 'draft' as const, ...event.draft })
              turn.tool = null
            } else if (event.type === 'question') {
              turn.artifacts.push({ type: 'question' as const, ...event.question })
              turn.tool = null
            } else if (event.type === 'suggestions') {
              turn.artifacts.push({ type: 'suggestions' as const, suggestions: event.suggestions })
              turn.tool = null
            } else if (event.type === 'error') {
              setError(event.message)
            }
            setPending({ ...turn, artifacts: [...turn.artifacts] })
          },
          controller.signal,
        )
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'The Studio could not answer.')
        }
      } finally {
        if (turn.text || turn.artifacts.length > 0) {
          setMessages((prev) => [
            ...prev,
            {
              id: `local-a-${Date.now()}`,
              session_id: session.id,
              role: 'assistant',
              content: turn.text,
              artifacts: turn.artifacts,
              created_at: new Date().toISOString(),
            },
          ])
        }
        setPending(null)
        setBusy(false)
        abortRef.current = null
        setSessions((prev) =>
          prev.map((s) => (s.id === session.id && s.title === 'New session' ? { ...s, title: content.slice(0, 60) } : s)),
        )
      }
    },
    [projectId, session, busy, uploading, attachments, language, addLink],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const draftIdea = useCallback(
    (idea: StudioIdea) => {
      void send(`Write a draft for the idea "${idea.title_pillar}" as a ${idea.format}.`)
    },
    [send],
  )

  const reviseDraft = useCallback((draft: StudioDraft) => {
    setInput(`Revise "${draft.idea_title}" v${draft.version ?? 1}: `)
    composerRef.current?.focus()
  }, [])

  const artifacts = useMemo(() => {
    const all: StudioArtifact[] = []
    for (const m of messages) all.push(...(m.artifacts ?? []))
    if (pending) all.push(...pending.artifacts)
    return all
  }, [messages, pending])
  const ideas = artifacts.filter((a): a is { type: 'idea' } & StudioIdea => a.type === 'idea')
  const drafts = artifacts.filter((a): a is { type: 'draft' } & StudioDraft => a.type === 'draft').reverse()

  const showStarters = messages.length <= 1 && !pending
  const canSend = !busy && !uploading && input.trim().length > 0

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-8 max-w-[1240px]">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-h5 font-bold text-primary-900 sm:text-h4">Studio</h1>
          <p className="mt-1 text-body-2 text-alpha-60">
            Brainstorm with Navix. Ideas and drafts land in your libraries as you go.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {sessions.length > 1 && session && (
            <div className="relative">
              <select
                value={session.id}
                onChange={(e) => void openSession(e.target.value)}
                disabled={busy}
                className="appearance-none rounded-[10px] border border-alpha-10 bg-white py-2 pl-3 pr-8 text-caption-1 font-medium text-primary-900 outline-none focus:border-primary-900"
                aria-label="Previous sessions"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {sessionLabel(s)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-alpha-40" />
            </div>
          )}
          <button
            type="button"
            onClick={() => void newSession()}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-[10px] border border-primary-900 bg-white px-3 py-2 text-caption-1 font-semibold text-primary-900 shadow-signature transition-all hover:bg-secondary-50 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            New session
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Conversation */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex h-[calc(100vh-14rem)] min-h-[520px] flex-col rounded-[20px] border bg-white shadow-card transition-colors',
            dragging ? 'border-primary-900 bg-secondary-50' : 'border-alpha-10',
          )}
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
            {messages.map((m, i) => (
              <MessageRow
                key={m.id}
                message={m}
                projectId={projectId}
                onDraft={draftIdea}
                onRevise={reviseDraft}
                onSend={(text) => void send(text)}
                busy={busy}
                isLast={i === messages.length - 1 && !pending}
                answered={messages.slice(i + 1).some((x) => x.role === 'user')}
              />
            ))}

            {pending && (
              <div className="flex gap-3">
                <AiMark size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1 space-y-3">
                  {pending.text && <Markdown>{pending.text}</Markdown>}
                  {pending.tool ? (
                    <TypingDots label={`${TOOL_LABEL[pending.tool] ?? 'Working'}…`} />
                  ) : (
                    !pending.text && <TypingDots />
                  )}
                  {pending.artifacts.map((a, i) =>
                    a.type === 'idea' ? (
                      <IdeaCard key={`p-${i}`} idea={a} onDraft={draftIdea} disabled />
                    ) : a.type === 'draft' ? (
                      <DraftCard key={`p-${i}`} draft={a} projectId={projectId} onRevise={reviseDraft} disabled />
                    ) : a.type === 'question' ? (
                      <QuestionCard key={`p-${i}`} question={a} answered={false} disabled onAnswer={() => undefined} />
                    ) : null,
                  )}
                </div>
              </div>
            )}

            {showStarters && (
              <div className="flex flex-wrap gap-2 pl-10">
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    className="rounded-full border border-alpha-10 bg-alpha-5 px-3 py-1.5 text-caption-1 font-medium text-primary-900 transition-colors hover:border-primary-900 hover:bg-white"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <p className="rounded-[12px] border border-destructive-200 bg-destructive-50 px-4 py-3 text-caption-1 text-destructive-600">
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-alpha-10 p-3 sm:p-4">
            {attachments.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {attachments.map((a) => {
                  const Icon = KIND_ICON[a.kind]
                  return (
                    <span
                      key={a.localId}
                      className={cn(
                        'inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-caption-2',
                        a.status === 'failed'
                          ? 'border-destructive-200 bg-destructive-50 text-destructive-600'
                          : a.status === 'ready'
                            ? 'border-success-300 bg-success-50 text-success-700'
                            : 'border-alpha-10 bg-alpha-5 text-alpha-60',
                      )}
                      title={a.error}
                    >
                      {a.status === 'uploading' ? <Spinner size="sm" /> : <Icon className="size-3 shrink-0" />}
                      <span className="truncate">{a.name}</span>
                      <span className="shrink-0 text-alpha-40">
                        {a.status === 'uploading' ? `· ${KIND_VERB[a.kind]}…` : a.status === 'ready' ? '· ready' : '· failed'}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.localId)}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-white"
                        aria-label={`Remove ${a.name}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}
            <textarea
              ref={composerRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              onPaste={handlePaste}
              rows={2}
              placeholder="Tell Navix what you want to make — paste a reel or TikTok link, or attach a photo, PDF, script or video…"
              className="w-full resize-none rounded-[12px] border border-alpha-10 bg-alpha-5/50 px-4 py-3 text-body-2 text-primary-900 outline-none transition-colors placeholder:text-alpha-30 focus:border-primary-900 focus:bg-white"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={ACCEPT}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={busy || !session}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-alpha-10 px-3 py-2 text-caption-1 font-medium text-alpha-60 transition-colors hover:border-primary-900 hover:text-primary-900 disabled:opacity-50"
                  title="Attach a photo, PDF, text or video as an example"
                >
                  <Paperclip className="size-3.5" />
                  Attach
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = window.prompt('Paste an Instagram post/reel or TikTok video link')
                    if (url && postUrlsIn(url).length === 1) void addLink(url.trim())
                    else if (url) setError('That does not look like an Instagram post or TikTok video link.')
                  }}
                  disabled={busy || !session}
                  className="inline-flex items-center gap-1.5 rounded-[10px] border border-alpha-10 px-3 py-2 text-caption-1 font-medium text-alpha-60 transition-colors hover:border-primary-900 hover:text-primary-900 disabled:opacity-50"
                  title="Add an Instagram or TikTok post by link"
                >
                  <Link2 className="size-3.5" />
                  Link
                </button>
                <label className="flex items-center gap-2 text-caption-2 text-alpha-60">
                  Content in
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-[8px] border border-alpha-10 bg-white px-2 py-1 text-caption-2 font-medium text-primary-900 outline-none focus:border-primary-900"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-2">
                {busy && (
                  <button
                    type="button"
                    onClick={stop}
                    className="inline-flex items-center gap-1.5 rounded-[10px] border border-alpha-10 px-3 py-2 text-caption-1 font-medium text-alpha-60 hover:border-primary-900 hover:text-primary-900"
                  >
                    <Square className="size-3.5" />
                    Stop
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void send(input)}
                  disabled={!canSend}
                  title={uploading ? 'Waiting for your attachments to be read' : undefined}
                  className="inline-flex items-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-2 text-caption-1 font-semibold text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send className="size-3.5" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <aside className="self-start rounded-[20px] border border-alpha-10 bg-white p-4 shadow-card lg:sticky lg:top-6">
          <div className="mb-3 flex items-center gap-1 rounded-[10px] bg-alpha-5 p-1">
            {(['ideas', 'drafts', 'references', 'memory'] as const).map((t) => {
              const count =
                t === 'ideas' ? ideas.length : t === 'drafts' ? drafts.length : t === 'references' ? references.length : null
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 rounded-[8px] px-1.5 py-1.5 text-caption-2 font-semibold capitalize transition-colors sm:text-caption-1',
                    tab === t ? 'bg-white text-primary-900 shadow-card' : 'text-alpha-60 hover:text-primary-900',
                  )}
                >
                  {t}
                  {count !== null && <span className="ml-1 text-alpha-40">{count}</span>}
                </button>
              )
            })}
          </div>
          <div className="max-h-[calc(100vh-18rem)] space-y-3 overflow-y-auto pr-1">
            {tab === 'ideas' &&
              (ideas.length === 0 ? (
                <p className="px-1 py-6 text-center text-caption-1 text-alpha-60">Ideas Navix proposes in this session collect here.</p>
              ) : (
                ideas.map((idea, i) => <IdeaCard key={idea.id ?? i} idea={idea} onDraft={draftIdea} compact disabled={busy} />)
              ))}
            {tab === 'drafts' &&
              (drafts.length === 0 ? (
                <p className="px-1 py-6 text-center text-caption-1 text-alpha-60">Drafts appear here and in your Drafts library.</p>
              ) : (
                drafts.map((draft, i) => (
                  <DraftCard key={draft.id ?? i} draft={draft} projectId={projectId} onRevise={reviseDraft} compact disabled={busy} />
                ))
              ))}
            {tab === 'references' &&
              (references.length === 0 ? (
                <p className="px-1 py-6 text-center text-caption-1 text-alpha-60">
                  Photos, PDFs, scripts and videos you attach are read once and stay available to Navix here.
                </p>
              ) : (
                references.map((r) => <ReferenceCard key={r.id} reference={r} />)
              ))}
            {tab === 'memory' && <MemoryPanel projectId={projectId} />}
          </div>
        </aside>
      </div>
    </div>
  )
}

function ReferenceCard({ reference }: { reference: StudioReference }) {
  const Icon = KIND_ICON[reference.kind]
  return (
    <div className="rounded-[14px] border border-alpha-10 bg-white p-3 shadow-card">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-alpha-5 text-alpha-60">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-caption-1 font-semibold text-primary-900">{reference.title}</p>
          <p
            className={cn(
              'mt-0.5 text-caption-2',
              reference.status === 'failed' ? 'text-destructive-600' : 'text-alpha-60',
            )}
          >
            {reference.status === 'ready'
              ? reference.summary || 'Read.'
              : reference.status === 'failed'
                ? reference.error || 'Could not be read.'
                : 'Reading…'}
          </p>
        </div>
      </div>
    </div>
  )
}

function MessageRow({
  message,
  projectId,
  onDraft,
  onRevise,
  onSend,
  busy,
  isLast,
  answered,
}: {
  message: StudioMessage
  projectId: string
  onDraft: (idea: StudioIdea) => void
  onRevise: (draft: StudioDraft) => void
  onSend: (text: string) => void
  busy: boolean
  /** Latest assistant message: its suggestion chips are live */
  isLast: boolean
  /** A user message came after this one: its question form is closed */
  answered: boolean
}) {
  if (message.role === 'user') {
    const attached = (message.artifacts ?? []).filter((a) => a.type === 'reference')
    return (
      <div className="flex flex-col items-end gap-1.5">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-[16px] rounded-br-[4px] bg-primary-900 px-4 py-2.5 text-body-2 leading-relaxed text-white">
          {message.content}
        </p>
        {attached.length > 0 && (
          <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
            {attached.map((a) => {
              const Icon = a.type === 'reference' ? KIND_ICON[a.kind] : FileText
              return (
                <span key={a.id} className="inline-flex items-center gap-1 rounded-full border border-alpha-10 bg-alpha-5 px-2 py-0.5 text-caption-2 text-alpha-60">
                  <Icon className="size-3" />
                  {a.title}
                </span>
              )
            })}
          </div>
        )}
      </div>
    )
  }
  return (
    <div className="flex gap-3">
      <AiMark size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1 space-y-3">
        {message.content && <Markdown>{message.content}</Markdown>}
        {(message.artifacts ?? []).map((a, i) =>
          a.type === 'idea' ? (
            <IdeaCard key={a.id ?? `i-${i}`} idea={a} onDraft={onDraft} disabled={busy} />
          ) : a.type === 'draft' ? (
            <DraftCard key={a.id ?? `d-${i}`} draft={a} projectId={projectId} onRevise={onRevise} disabled={busy} />
          ) : a.type === 'question' ? (
            <QuestionCard key={`q-${i}`} question={a} answered={answered} disabled={busy} onAnswer={onSend} />
          ) : a.type === 'suggestions' && isLast && !busy ? (
            <div key={`s-${i}`} className="flex flex-wrap gap-2">
              {a.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSend(s)}
                  className="rounded-full border border-primary-900/30 bg-white px-3 py-1.5 text-caption-1 font-medium text-primary-900 transition-colors hover:border-primary-900 hover:bg-secondary-50"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null,
        )}
      </div>
    </div>
  )
}

export default function StudioPage() {
  return (
    <DashboardShell>
      <Suspense
        fallback={
          <div className="flex h-[60vh] items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
      >
        <StudioContent />
      </Suspense>
    </DashboardShell>
  )
}
