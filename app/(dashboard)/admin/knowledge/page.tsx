'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookMarked, FileUp, Link2, ListFilter, Search, Sparkles, Trash2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  addKnowledgeArticle,
  deleteKnowledgeItem,
  getKnowledgeStats,
  importKnowledgeFile,
  importKnowledgeText,
  listKnowledge,
  searchKnowledge,
  updateKnowledgeItem,
  type KnowledgeItem,
  type KnowledgeSearchHit,
  type KnowledgeStats,
  type KnowledgeType,
} from '@/lib/api'
import { useWorkspace } from '@/components/layout/WorkspaceContext'
import { SettingsIsland } from '@/components/settings/SettingsIsland'
import { LimeButton } from '@/components/onboarding/LimeButton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'

/**
 * Internal page (email allowlist in the API). The library every project's AI learns
 * from: hooks, CTAs, frameworks, example scripts, dialect rules and distilled
 * articles. Not part of the product surface shown to users.
 */

const TYPES: Array<{ value: KnowledgeType; label: string; hint: string }> = [
  { value: 'hook', label: 'Hooks', hint: 'One opening line per row, [BRACKETS] allowed' },
  { value: 'cta', label: 'CTAs', hint: 'One call to action per row' },
  { value: 'script', label: 'Example scripts', hint: 'A full script the AI should learn the register from' },
  { value: 'caption', label: 'Example captions', hint: 'A full caption, same idea' },
  { value: 'framework', label: 'Frameworks', hint: 'A structure with sections the AI follows' },
  { value: 'rule', label: 'Rules', hint: 'Dialect or style rules, always applied' },
  { value: 'article', label: 'Article principles', hint: 'Distilled from a page' },
]
const LANGUAGES = [
  { value: '', label: 'Let the AI decide' },
  { value: 'derja', label: 'Derja' },
  { value: 'mixed', label: 'Mixed (Derja + French/English)' },
  { value: 'fr', label: 'French' },
  { value: 'en', label: 'English' },
  { value: 'other', label: 'Other' },
]
const SCRIPTS = [
  { value: '', label: 'Let the AI decide' },
  { value: 'arabic', label: 'Arabic letters' },
  { value: 'latin', label: 'Latin letters' },
  { value: 'mixed', label: 'Both' },
  { value: 'na', label: 'No text (structure)' },
]
const FORMATS = ['', 'reel', 'carousel', 'image', 'story', 'caption', 'any']
const GOALS = ['', 'sell', 'educate', 'entertain', 'announce', 'engage', 'any']
const FUNNELS = ['', 'tof', 'mof', 'bof', 'any']
const SPLITS = [
  { value: '', label: 'Automatic (hooks and CTAs one per line, the rest whole)' },
  { value: 'line', label: 'One item per line' },
  { value: 'blank', label: 'Split on blank lines' },
  { value: 'marker', label: 'Split on --- lines' },
  { value: 'none', label: 'Keep as one item' },
]

const field = 'w-full rounded-[12px] border border-alpha-10 bg-white px-3 py-2.5 text-caption-1 text-primary-900 outline-none focus:border-primary-900'
const quietBtn = 'inline-flex items-center gap-1.5 rounded-[10px] border border-alpha-10 px-3 py-2 text-caption-1 font-medium text-alpha-60 transition-colors hover:border-primary-900 hover:text-primary-900 disabled:opacity-50'
const chip = 'inline-flex items-center rounded-full bg-alpha-5 border border-alpha-10 px-2 py-0.5 text-caption-2 text-primary-900'

function NativeSelect({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> | string[]; label: string }) {
  const opts = options.map((o) => (typeof o === 'string' ? { value: o, label: o === '' ? 'Let the AI decide' : o } : o))
  return (
    <label className="block">
      <span className="mb-1 block text-caption-2 font-semibold uppercase tracking-wide text-alpha-50">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={field}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function typeLabel(t: string) {
  return TYPES.find((x) => x.value === t)?.label ?? t
}

export default function KnowledgePage() {
  const { profile, loading: wsLoading } = useWorkspace()
  const isAdmin = !!profile?.is_admin

  // Library
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<KnowledgeStats | null>(null)
  const [filters, setFilters] = useState({ type: '', language: '', status: '', q: '' })
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<KnowledgeItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Add
  const [mode, setMode] = useState<'paste' | 'file' | 'article'>('paste')
  const [type, setType] = useState<KnowledgeType>('hook')
  const [split, setSplit] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [defaults, setDefaults] = useState({ language: '', script: '', format: '', goal: '', funnel: '', field: '', note: '' })
  const [autoTag, setAutoTag] = useState(true)
  const [importing, setImporting] = useState(false)

  // Test retrieval
  const [query, setQuery] = useState('')
  const [queryType, setQueryType] = useState('')
  const [queryLanguage, setQueryLanguage] = useState('')
  const [hits, setHits] = useState<KnowledgeSearchHit[] | null>(null)
  const [searching, setSearching] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [list, st] = await Promise.all([listKnowledge({ ...filters, limit: 100 }), getKnowledgeStats()])
      setItems(list.data.items)
      setTotal(list.data.total)
      setStats(st.data)
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Could not load the library' })
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    if (isAdmin) void refresh()
  }, [isAdmin, refresh])

  const cleanDefaults = useMemo(
    () => Object.fromEntries(Object.entries(defaults).filter(([, v]) => v.trim() !== '')),
    [defaults],
  )

  async function handleImport() {
    setImporting(true)
    setNotice(null)
    try {
      let message = ''
      if (mode === 'paste') {
        if (!text.trim()) throw new Error('Paste something first')
        const res = await importKnowledgeText({ text, type, split: (split || undefined) as never, auto_tag: autoTag, defaults: cleanDefaults })
        message = res.message
        setText('')
      } else if (mode === 'file') {
        if (!file) throw new Error('Choose a file first')
        const res = await importKnowledgeFile(file, { type, split: (split || undefined) as never, auto_tag: autoTag, defaults: cleanDefaults })
        message = res.message
        setFile(null)
      } else {
        if (!url.trim()) throw new Error('Paste the article link first')
        const res = await addKnowledgeArticle({ url: url.trim(), field: defaults.field || undefined, language: defaults.language || undefined })
        message = res.message
        setUrl('')
      }
      setNotice({ tone: 'ok', text: message })
      await refresh()
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Import failed' })
    } finally {
      setImporting(false)
    }
  }

  async function handleSearch() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await searchKnowledge({ query, type: queryType || undefined, language: queryLanguage || undefined, k: 10 })
      setHits(res.data)
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Search failed' })
    } finally {
      setSearching(false)
    }
  }

  async function setStatus(item: KnowledgeItem, status: KnowledgeItem['status']) {
    try {
      const res = await updateKnowledgeItem(item.id, { status })
      setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)))
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Update failed' })
    }
  }

  async function handleDelete(item: KnowledgeItem) {
    try {
      await deleteKnowledgeItem(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setTotal((t) => Math.max(0, t - 1))
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Delete failed' })
    }
  }

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    try {
      const res = await updateKnowledgeItem(editing.id, {
        type: editing.type,
        title: editing.title ?? undefined,
        content: editing.content,
        language: editing.language,
        script: editing.script,
        field: editing.field ?? undefined,
        format: editing.format,
        goal: editing.goal,
        funnel: editing.funnel,
        group_label: editing.group_label ?? undefined,
        note: editing.note ?? undefined,
        status: editing.status,
      })
      setItems((prev) => prev.map((i) => (i.id === res.data.id ? res.data : i)))
      setEditing(null)
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  if (wsLoading && !profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center"><Spinner /></div>
    )
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[720px] px-4 py-16">
        <EmptyState icon={BookMarked} title="Not available" description="This page is reserved to the Navix team." />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-headline font-bold text-primary-900">Knowledge</h1>
          <p className="mt-1 text-body-2 text-alpha-60">
            What the AI of every project learns from: hooks, CTAs, frameworks, example scripts, dialect rules and distilled articles.
          </p>
        </div>
        {stats && (
          <div className="flex flex-wrap gap-1.5">
            <span className={chip}>{stats.total} items</span>
            {Object.entries(stats.by_type).map(([t, n]) => (
              <span key={t} className={chip}>{typeLabel(t)} {n}</span>
            ))}
            {stats.by_status.pending ? <span className={cn(chip, 'bg-warning-100 text-warning-700 border-warning-300')}>{stats.by_status.pending} to review</span> : null}
          </div>
        )}
      </div>

      {notice && (
        <p className={cn('mb-5 rounded-[12px] border px-4 py-3 text-caption-1', notice.tone === 'ok' ? 'bg-secondary-50 border-secondary-200 text-primary-900' : 'bg-destructive-50 border-destructive-200 text-destructive-700')}>
          {notice.text}
        </p>
      )}

      <div className="space-y-6">
        {/* Add */}
        <SettingsIsland icon={FileUp} title="Add to the library" description="Paste text, upload a file, or point at an article. Tags you leave empty are suggested by the AI." index={0}>
          <div className="flex flex-wrap gap-2">
            {([
              ['paste', 'Paste text'],
              ['file', 'Upload a file'],
              ['article', 'Article link'],
            ] as const).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-caption-1 font-medium transition-colors',
                  mode === m ? 'border-primary-900 bg-primary-900 text-white' : 'border-alpha-10 bg-white text-primary-900 hover:border-primary-900',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              {mode === 'paste' && (
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={12}
                  placeholder={type === 'hook' || type === 'cta' ? 'One per line. Short header lines become the group, lines starting with مثال: attach to the line above.' : 'Paste the full text. Use --- between items to add several at once.'}
                  className="min-h-[220px]"
                />
              )}
              {mode === 'file' && (
                <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-alpha-20 bg-alpha-5/50 p-6 text-center hover:border-primary-900">
                  <FileUp className="size-5 text-alpha-60" />
                  <span className="text-caption-1 font-medium text-primary-900">{file ? file.name : 'Choose a .txt, .md, .csv or .pdf file'}</span>
                  <span className="text-caption-2 text-alpha-50">Word files: save as PDF or paste the text</span>
                  <input type="file" accept=".txt,.md,.csv,.json,.tsv,.pdf,text/plain,text/markdown,text/csv,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
              {mode === 'article' && (
                <div className="space-y-2">
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                  <p className="text-caption-2 text-alpha-50">The page is read once and turned into 3 to 10 standalone principles, each saved with its source.</p>
                </div>
              )}
              {mode !== 'article' && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <NativeSelect label="Type" value={type} onChange={(v) => setType(v as KnowledgeType)} options={TYPES.filter((t) => t.value !== 'article').map((t) => ({ value: t.value, label: `${t.label}: ${t.hint}` }))} />
                  <NativeSelect label="Split" value={split} onChange={setSplit} options={SPLITS} />
                </div>
              )}
            </div>
            <div className="space-y-3 rounded-[14px] border border-alpha-10 bg-alpha-5/40 p-4">
              <p className="text-caption-1 font-semibold text-primary-900">Tags for this import</p>
              <NativeSelect label="Language" value={defaults.language} onChange={(v) => setDefaults((d) => ({ ...d, language: v }))} options={LANGUAGES} />
              {mode !== 'article' && <NativeSelect label="Script" value={defaults.script} onChange={(v) => setDefaults((d) => ({ ...d, script: v }))} options={SCRIPTS} />}
              <label className="block">
                <span className="mb-1 block text-caption-2 font-semibold uppercase tracking-wide text-alpha-50">Field or niche</span>
                <input value={defaults.field} onChange={(e) => setDefaults((d) => ({ ...d, field: e.target.value }))} placeholder="e-commerce, fitness, coaching..." className={field} />
              </label>
              {mode !== 'article' && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <NativeSelect label="Format" value={defaults.format} onChange={(v) => setDefaults((d) => ({ ...d, format: v }))} options={FORMATS} />
                    <NativeSelect label="Goal" value={defaults.goal} onChange={(v) => setDefaults((d) => ({ ...d, goal: v }))} options={GOALS} />
                    <NativeSelect label="Funnel" value={defaults.funnel} onChange={(v) => setDefaults((d) => ({ ...d, funnel: v }))} options={FUNNELS} />
                  </div>
                  <label className="block">
                    <span className="mb-1 block text-caption-2 font-semibold uppercase tracking-wide text-alpha-50">Why it works</span>
                    <input value={defaults.note} onChange={(e) => setDefaults((d) => ({ ...d, note: e.target.value }))} placeholder="Optional, applied to every item" className={field} />
                  </label>
                  <label className="flex items-center gap-2 text-caption-1 text-primary-900">
                    <input type="checkbox" checked={autoTag} onChange={(e) => setAutoTag(e.target.checked)} className="size-4 accent-primary-900" />
                    Let the AI fill the empty tags
                  </label>
                </>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <LimeButton onClick={handleImport} loading={importing} size="md">
              <Sparkles className="size-4" />
              {mode === 'article' ? 'Read and extract' : 'Import'}
            </LimeButton>
          </div>
        </SettingsIsland>

        {/* Test */}
        <SettingsIsland icon={Search} title="Test what the AI gets" description="Type a brief the way a user would. These are the items the Studio would receive." index={1}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={3} placeholder="e.g. reel to sell a car mat, Tunisian audience, cold traffic" />
            </div>
            <NativeSelect label="Type" value={queryType} onChange={setQueryType} options={[{ value: '', label: 'All types' }, ...TYPES.map((t) => ({ value: t.value, label: t.label }))]} />
            <NativeSelect label="Language" value={queryLanguage} onChange={setQueryLanguage} options={[{ value: '', label: 'All languages' }, ...LANGUAGES.slice(1)]} />
          </div>
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={handleSearch} disabled={searching || !query.trim()} className={quietBtn}>
              {searching ? <Spinner size="sm" /> : <Search className="size-4" />}
              Search
            </button>
          </div>
          {hits && (
            <ul className="mt-4 space-y-2">
              {hits.length === 0 && <li className="text-caption-1 text-alpha-50">Nothing matched. Add items of that type and language first.</li>}
              {hits.map((h) => (
                <li key={h.item_id} className="rounded-[12px] border border-alpha-10 bg-white p-3">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className={cn(chip, 'bg-secondary-300 border-primary-900 font-semibold')}>{typeLabel(h.type)}</span>
                    <span className={chip}>{h.language} · {h.script}</span>
                    {h.field && <span className={chip}>{h.field}</span>}
                    <span className="ml-auto text-caption-2 text-alpha-50">match {Math.round(h.similarity * 100)}%</span>
                  </div>
                  {h.title && <p className="text-caption-1 font-semibold text-primary-900">{h.title}</p>}
                  <p className="whitespace-pre-wrap text-caption-1 text-primary-900">{h.content.slice(0, 500)}{h.content.length > 500 ? '…' : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </SettingsIsland>

        {/* Library */}
        <SettingsIsland icon={ListFilter} title={`Library (${total})`} description="Everything the AI can draw from. Items in review come from users' approved and edited drafts; approve them to make them shared." index={2}>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <NativeSelect label="Type" value={filters.type} onChange={(v) => setFilters((f) => ({ ...f, type: v }))} options={[{ value: '', label: 'All types' }, ...TYPES.map((t) => ({ value: t.value, label: t.label }))]} />
            <NativeSelect label="Language" value={filters.language} onChange={(v) => setFilters((f) => ({ ...f, language: v }))} options={[{ value: '', label: 'All languages' }, ...LANGUAGES.slice(1)]} />
            <NativeSelect label="Status" value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))} options={[{ value: '', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'pending', label: 'To review' }, { value: 'rejected', label: 'Rejected' }]} />
            <label className="block">
              <span className="mb-1 block text-caption-2 font-semibold uppercase tracking-wide text-alpha-50">Search</span>
              <input value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} placeholder="word, field, group..." className={field} />
            </label>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-caption-1 text-alpha-50">No items yet. Import your first hooks above.</p>
          ) : (
            <ul className="mt-4 divide-y divide-alpha-10">
              {items.map((item) => {
                const open = expanded === item.id
                const isEditing = editing?.id === item.id
                return (
                  <li key={item.id} className="py-3">
                    {isEditing && editing ? (
                      <div className="space-y-3 rounded-[14px] border border-primary-900 bg-white p-4">
                        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                          <NativeSelect label="Type" value={editing.type} onChange={(v) => setEditing({ ...editing, type: v as KnowledgeType })} options={TYPES.map((t) => ({ value: t.value, label: t.label }))} />
                          <NativeSelect label="Language" value={editing.language} onChange={(v) => setEditing({ ...editing, language: v })} options={LANGUAGES.slice(1)} />
                          <NativeSelect label="Script" value={editing.script} onChange={(v) => setEditing({ ...editing, script: v })} options={SCRIPTS.slice(1)} />
                          <NativeSelect label="Status" value={editing.status} onChange={(v) => setEditing({ ...editing, status: v as KnowledgeItem['status'] })} options={[{ value: 'active', label: 'Active' }, { value: 'pending', label: 'To review' }, { value: 'rejected', label: 'Rejected' }]} />
                          <NativeSelect label="Format" value={editing.format} onChange={(v) => setEditing({ ...editing, format: v })} options={FORMATS.slice(1)} />
                          <NativeSelect label="Goal" value={editing.goal} onChange={(v) => setEditing({ ...editing, goal: v })} options={GOALS.slice(1)} />
                          <NativeSelect label="Funnel" value={editing.funnel} onChange={(v) => setEditing({ ...editing, funnel: v })} options={FUNNELS.slice(1)} />
                          <label className="block">
                            <span className="mb-1 block text-caption-2 font-semibold uppercase tracking-wide text-alpha-50">Field</span>
                            <input value={editing.field ?? ''} onChange={(e) => setEditing({ ...editing, field: e.target.value })} className={field} />
                          </label>
                        </div>
                        <input value={editing.title ?? ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Title" className={field} />
                        <Textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} rows={6} />
                        <input value={editing.group_label ?? ''} onChange={(e) => setEditing({ ...editing, group_label: e.target.value })} placeholder="Group (e.g. the hook family)" className={field} />
                        <input value={editing.note ?? ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="Why it works" className={field} />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setEditing(null)} className={quietBtn}>Cancel</button>
                          <LimeButton onClick={saveEdit} loading={saving} size="md">Save</LimeButton>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className={cn(chip, 'bg-secondary-300 border-primary-900 font-semibold')}>{typeLabel(item.type)}</span>
                            <span className={chip}>{item.language} · {item.script}</span>
                            {item.field && <span className={chip}>{item.field}</span>}
                            {item.format !== 'any' && <span className={chip}>{item.format}</span>}
                            {item.goal !== 'any' && <span className={chip}>{item.goal}</span>}
                            {item.funnel !== 'any' && <span className={chip}>{item.funnel}</span>}
                            {item.group_label && <span className={cn(chip, 'text-alpha-60')}>{item.group_label}</span>}
                            {item.status !== 'active' && (
                              <span className={cn(chip, item.status === 'pending' ? 'bg-warning-100 text-warning-700 border-warning-300' : 'bg-destructive-50 text-destructive-700 border-destructive-200')}>
                                {item.status === 'pending' ? 'to review' : 'rejected'}
                              </span>
                            )}
                            {item.source_kind !== 'admin' && <span className={cn(chip, 'text-alpha-60')}>{item.source_kind.replace('_', ' ')}</span>}
                          </div>
                          {item.title && item.title !== item.content.slice(0, 60) && (
                            <p className="text-caption-1 font-semibold text-primary-900">{item.title}</p>
                          )}
                          <button type="button" onClick={() => setExpanded(open ? null : item.id)} className="block w-full text-left">
                            <p className={cn('whitespace-pre-wrap text-caption-1 text-primary-900', !open && 'line-clamp-2')}>{item.content}</p>
                          </button>
                          {open && item.note && <p className="mt-1 text-caption-2 text-alpha-60">Why: {item.note}</p>}
                          {open && item.source_url && (
                            <a href={item.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-caption-2 text-info-600 hover:underline">
                              <Link2 className="size-3" /> source
                            </a>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {item.status === 'pending' && (
                            <>
                              <button type="button" onClick={() => setStatus(item, 'active')} className={quietBtn} title="Approve into the library"><Check className="size-4" /></button>
                              <button type="button" onClick={() => setStatus(item, 'rejected')} className={quietBtn} title="Reject"><X className="size-4" /></button>
                            </>
                          )}
                          <button type="button" onClick={() => setEditing(item)} className={quietBtn}>Edit</button>
                          <button type="button" onClick={() => handleDelete(item)} className={cn(quietBtn, 'hover:border-destructive-500 hover:text-destructive-700')} title="Delete"><Trash2 className="size-4" /></button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {!loading && total > items.length && (
            <p className="mt-3 text-caption-2 text-alpha-50">Showing the latest {items.length} of {total}. Use the filters to find the rest.</p>
          )}
        </SettingsIsland>
      </div>
    </div>
  )
}
