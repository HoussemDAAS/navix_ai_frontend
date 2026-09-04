'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  AtSign,
  CalendarDays,
  Check,
  LogOut,
  Mail,
  RefreshCw,
  Share2,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { getProfile, updateProfile, type Profile, type ProfilePersona } from '@/lib/api'
import { parseSocialLink, type SocialPlatform } from '@/lib/social-links'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SettingsIsland } from '@/components/settings/SettingsIsland'
import { ProfileIdentity } from '@/components/settings/ProfileIdentity'
import { SocialAccountRow } from '@/components/settings/SocialAccountRow'
import { PasteLinkInput } from '@/components/settings/PasteLinkInput'
import { ChipInput } from '@/components/settings/ChipInput'
import { SaveBar } from '@/components/settings/SaveBar'

const TEXT_FIELDS = [
  'full_name',
  'biography',
  'instagram_handle',
  'tiktok_handle',
  'youtube_handle',
  'facebook_handle',
  'niche_description',
] as const

type TextField = (typeof TEXT_FIELDS)[number]

interface SettingsForm extends Record<TextField, string> {
  keywords: string[]
  seed_accounts: string[]
}

const PLATFORMS: SocialPlatform[] = ['instagram', 'tiktok', 'youtube', 'facebook']

const HANDLE_FIELD: Record<SocialPlatform, TextField> = {
  instagram: 'instagram_handle',
  tiktok: 'tiktok_handle',
  youtube: 'youtube_handle',
  facebook: 'facebook_handle',
}

const PERSONA_LABEL: Record<ProfilePersona, string> = {
  creator: 'Creator',
  ecommerce: 'E-commerce',
  agency: 'Agency',
}

const MAX_KEYWORDS = 15
const MAX_SEEDS = 10

function toForm(profile: Profile): SettingsForm {
  return {
    full_name: profile.full_name ?? '',
    biography: profile.biography ?? '',
    instagram_handle: profile.instagram_handle ?? '',
    tiktok_handle: profile.tiktok_handle ?? '',
    youtube_handle: profile.youtube_handle ?? '',
    facebook_handle: profile.facebook_handle ?? '',
    niche_description: profile.niche_description ?? '',
    keywords: profile.keywords ?? [],
    seed_accounts: profile.seed_accounts ?? [],
  }
}

function sameList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

/** Only the fields the user actually changed reach the PATCH. */
function buildPatch(initial: SettingsForm, current: SettingsForm): Partial<Omit<Profile, 'id'>> {
  const patch: Partial<Omit<Profile, 'id'>> = {}

  for (const field of TEXT_FIELDS) {
    const next = current[field].trim()
    if (next !== initial[field].trim()) {
      patch[field] = next === '' ? null : next
    }
  }
  if (!sameList(current.keywords, initial.keywords)) patch.keywords = current.keywords
  if (!sameList(current.seed_accounts, initial.seed_accounts)) {
    patch.seed_accounts = current.seed_accounts
  }

  return patch
}

function normalizeKeyword(raw: string): string | null {
  const value = raw.trim().toLowerCase().replace(/^#/, '')
  if (value.length < 2 || value.length > 40) return null
  return value
}

/** Seeds are stored as "platform:handle" — accept that, or any full profile link. */
function normalizeSeed(raw: string): string | null {
  const value = raw.trim()
  const parsed = parseSocialLink(value)
  if (parsed) return `${parsed.platform}:${parsed.handle}`

  const [platform, ...rest] = value.toLowerCase().split(':')
  const handle = rest.join(':').replace(/^@/, '').trim()
  if (!handle) return null
  if (!PLATFORMS.includes(platform as SocialPlatform)) return null
  if (!/^[A-Za-z0-9._\-/?=]{1,80}$/.test(handle)) return null
  return `${platform}:${handle}`
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [memberSince, setMemberSince] = useState<string | null>(null)
  const [form, setForm] = useState<SettingsForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const [filledPlatform, setFilledPlatform] = useState<SocialPlatform | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [profileRes, userRes] = await Promise.all([getProfile(), supabase.auth.getUser()])
      setProfile(profileRes.data)
      setForm(toForm(profileRes.data))
      setEmail(userRes.data.user?.email ?? null)
      setMemberSince(userRes.data.user?.created_at ?? null)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load your settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const initial = useMemo(() => (profile ? toForm(profile) : null), [profile])

  const patch = useMemo(
    () => (initial && form ? buildPatch(initial, form) : {}),
    [initial, form],
  )
  const isDirty = Object.keys(patch).length > 0

  useEffect(() => {
    if (!savedFlash) return
    const timer = window.setTimeout(() => setSavedFlash(false), 2500)
    return () => window.clearTimeout(timer)
  }, [savedFlash])

  useEffect(() => {
    if (!filledPlatform) return
    const timer = window.setTimeout(() => setFilledPlatform(null), 1600)
    return () => window.clearTimeout(timer)
  }, [filledPlatform])

  const patchForm = useCallback((changes: Partial<SettingsForm>) => {
    setSaveError(null)
    setSavedFlash(false)
    setForm((prev) => (prev ? { ...prev, ...changes } : prev))
  }, [])

  const setHandle = useCallback(
    (platform: SocialPlatform, value: string) => {
      patchForm({ [HANDLE_FIELD[platform]]: value } as Pick<SettingsForm, TextField>)
    },
    [patchForm],
  )

  async function handleSave() {
    if (!isDirty || saving) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await updateProfile(patch)
      setProfile(res.data)
      setForm(toForm(res.data))
      setSavedFlash(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your changes.')
    } finally {
      setSaving(false)
    }
  }

  function handleDiscard() {
    if (!initial) return
    setForm(initial)
    setSaveError(null)
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (loadError || !profile || !form) {
    return (
      <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
        <div className="flex flex-col items-center rounded-[20px] border border-destructive-200 bg-destructive-50 p-8 text-center">
          <AlertCircle className="mb-3 size-6 text-destructive-500" />
          <h2 className="text-body-1 font-semibold text-primary-900">
            We could not load your settings
          </h2>
          <p className="mt-1 max-w-sm text-caption-1 text-alpha-60">
            {loadError ?? 'Please try again in a moment.'}
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-4 inline-flex items-center gap-2 rounded-[12px] border border-primary-900 bg-secondary-300 px-5 py-2.5 text-caption-1 font-medium text-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:translate-y-[2px] active:shadow-none"
          >
            <RefreshCw className="size-4" />
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10 max-w-[1100px]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex flex-wrap items-start justify-between gap-3 sm:mb-10"
      >
        <div>
          <h1 className="text-h5 font-bold text-primary-900 sm:text-h4">Settings</h1>
          <p className="mt-1.5 text-body-2 text-alpha-60">
            Your profile, connected accounts and brand context. Navix uses these to find
            competitors and write in your voice.
          </p>
        </div>
        <AnimatePresence>
          {savedFlash && (
            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1.5 text-caption-1 font-medium text-success-600"
            >
              <Check className="size-4" />
              Saved
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="space-y-5 sm:space-y-6">
        {/* Identity */}
        <SettingsIsland
          index={0}
          icon={UserRound}
          title="Your profile"
          description="How you show up across Navix."
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <ProfileIdentity
              avatarUrl={profile.avatar_url}
              name={form.full_name}
              followersCount={profile.followers_count}
              followingCount={profile.following_count}
              postsCount={profile.posts_count}
              isVerified={profile.is_verified}
              className="sm:w-[180px] sm:shrink-0"
            />

            <div className="min-w-0 flex-1 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="full_name"
                  className="block text-caption-1 font-semibold text-primary-900"
                >
                  Full name
                </label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => patchForm({ full_name: e.target.value })}
                  placeholder="Your name or brand name"
                  size="lg"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="biography"
                  className="block text-caption-1 font-semibold text-primary-900"
                >
                  Bio
                </label>
                <Textarea
                  id="biography"
                  value={form.biography}
                  onChange={(e) => patchForm({ biography: e.target.value })}
                  placeholder="A short line about what you do."
                  maxLength={500}
                  className="h-[96px]"
                />
                <p className="text-caption-2 text-alpha-40">
                  {form.biography.length}/500 characters
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="block text-caption-1 font-semibold text-primary-900">
                  Account type
                </span>
                {profile.persona ? (
                  <Badge
                    variant="outline"
                    className="border-alpha-20 bg-alpha-5 px-3 py-1 text-caption-1 text-primary-900"
                  >
                    {PERSONA_LABEL[profile.persona]}
                  </Badge>
                ) : (
                  <p className="text-caption-2 text-alpha-40">Not set yet.</p>
                )}
              </div>
            </div>
          </div>
        </SettingsIsland>

        {/* Connected accounts */}
        <SettingsIsland
          index={1}
          icon={AtSign}
          title="Connected accounts"
          description="The handles we analyse and benchmark against."
        >
          <PasteLinkInput
            className="mb-4"
            onResolved={(platform, handle) => {
              setHandle(platform, handle)
              setFilledPlatform(platform)
            }}
          />

          {!profile.has_social_presence && (
            <p className="mb-4 rounded-[12px] border border-alpha-10 bg-alpha-5/60 p-3 text-caption-2 text-alpha-60">
              You told us you are not on social yet. Add a handle here whenever you launch one
              and we will start tracking it.
            </p>
          )}

          <div className="space-y-2.5">
            {PLATFORMS.map((platform) => (
              <SocialAccountRow
                key={platform}
                platform={platform}
                value={form[HANDLE_FIELD[platform]]}
                highlighted={filledPlatform === platform}
                onChange={(value) => setHandle(platform, value)}
              />
            ))}
          </div>
        </SettingsIsland>

        {/* Brand context */}
        <SettingsIsland
          index={2}
          icon={Sparkles}
          title="Brand context"
          description="What you sell, who you talk to, and the accounts you look up to."
        >
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="niche_description"
                className="block text-caption-1 font-semibold text-primary-900"
              >
                Niche description
              </label>
              <Textarea
                id="niche_description"
                value={form.niche_description}
                onChange={(e) => patchForm({ niche_description: e.target.value })}
                placeholder="e.g. Handmade ceramic tableware for young couples furnishing their first home."
                maxLength={1000}
              />
              <p className="text-caption-2 text-alpha-40">
                The clearer this is, the sharper your competitor matches.
              </p>
            </div>

            <div className="space-y-2">
              <span className="block text-caption-1 font-semibold text-primary-900">
                Keywords
              </span>
              <ChipInput
                values={form.keywords}
                onChange={(keywords) => patchForm({ keywords })}
                placeholder="Add a keyword and press Enter"
                emptyHint="No keywords yet. Add a few words people would search to find you."
                max={MAX_KEYWORDS}
                normalize={normalizeKeyword}
                invalidMessage="Keywords must be between 2 and 40 characters."
              />
            </div>

            <div className="space-y-2">
              <span className="flex items-center gap-1.5 text-caption-1 font-semibold text-primary-900">
                <Share2 className="size-3.5 text-alpha-40" />
                Benchmark accounts
              </span>
              <ChipInput
                values={form.seed_accounts}
                onChange={(seed_accounts) => patchForm({ seed_accounts })}
                placeholder="Paste a profile link, or type instagram:handle"
                emptyHint="No benchmark accounts yet. Add the accounts you want to be compared with."
                max={MAX_SEEDS}
                normalize={normalizeSeed}
                invalidMessage="Paste a full profile link, or use the format instagram:handle."
              />
            </div>
          </div>
        </SettingsIsland>

        {/* Account */}
        <SettingsIsland
          index={3}
          icon={Mail}
          title="Account"
          description="Your login details."
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-1 rounded-[12px] border border-alpha-10 bg-alpha-5/40 p-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-caption-1 font-semibold text-primary-900">
                <Mail className="size-4 text-alpha-40" />
                Email
              </span>
              <span className="truncate text-body-2 text-alpha-60">
                {email ?? 'Not available'}
              </span>
            </div>

            {memberSince && (
              <div className="flex flex-col gap-1 rounded-[12px] border border-alpha-10 bg-alpha-5/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 text-caption-1 font-semibold text-primary-900">
                  <CalendarDays className="size-4 text-alpha-40" />
                  Member since
                </span>
                <span className="text-body-2 text-alpha-60">
                  {new Date(memberSince).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            <div className="pt-1">
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-destructive-200 bg-white px-4 py-2.5 text-caption-1 font-medium text-destructive-500 transition-colors hover:bg-destructive-50 disabled:pointer-events-none disabled:opacity-60 sm:w-auto"
              >
                {signingOut ? <Spinner size="sm" /> : <LogOut className="size-4" />}
                Sign out
              </button>
            </div>
          </div>
        </SettingsIsland>
      </div>

      <SaveBar
        visible={isDirty || saving}
        saving={saving}
        error={saveError}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  )
}
