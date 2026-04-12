'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Instagram, Youtube, Globe, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useOnboardingStore } from '@/stores/onboarding'
import { ProgressBar } from '@/components/onboarding/ProgressBar'
import { Input } from '@/components/ui/input'
import { createProject, discoverCompetitors, updateProfile } from '@/lib/api'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'

/* ── Icons ── */

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.53a8.27 8.27 0 0 0 4.85 1.56V6.64a4.84 4.84 0 0 1-1.09.05Z" />
    </svg>
  )
}

/* ── Hierarchical niche data ── */

interface NicheCategory {
  label: string
  subs: string[]
}

const ecommerceNiches: NicheCategory[] = [
  { label: 'Beauty & Skincare', subs: ['Organic', 'Anti-aging', 'Makeup', 'Haircare', "Men's grooming"] },
  { label: 'Fashion', subs: ['Streetwear', 'Luxury', 'Activewear', 'Sustainable', 'Vintage'] },
  { label: 'Health & Wellness', subs: ['Supplements', 'CBD & Natural', 'Mental health', 'Yoga & Meditation'] },
  { label: 'Food & Beverage', subs: ['Snacks', 'Coffee & Tea', 'Meal prep', 'Vegan', 'Alcohol'] },
  { label: 'Home & Decor', subs: ['Furniture', 'Kitchen', 'Candles', 'Plants', 'Art'] },
  { label: 'Fitness', subs: ['Gym wear', 'Equipment', 'Supplements', 'Accessories'] },
  { label: 'Tech & Gadgets', subs: ['Phone accessories', 'Smart home', 'Wearables', 'Audio'] },
  { label: 'Jewelry', subs: ['Fine jewelry', 'Handmade', 'Watches', 'Piercings'] },
  { label: 'Pets', subs: ['Dog', 'Cat', 'Food & Treats', 'Accessories'] },
  { label: 'Kids & Baby', subs: ['Clothing', 'Toys', 'Education', 'Nursery'] },
]

const agencyNiches: NicheCategory[] = [
  { label: 'Beauty & Skincare', subs: ['Organic brands', 'Luxury beauty', 'Indie makeup', 'Haircare'] },
  { label: 'Fashion & Apparel', subs: ['Streetwear', 'Luxury', 'Fast fashion', 'Sustainable'] },
  { label: 'Food & Restaurant', subs: ['Fine dining', 'Fast casual', 'Delivery apps', 'Specialty'] },
  { label: 'Real Estate', subs: ['Residential', 'Commercial', 'Luxury', 'Rental'] },
  { label: 'Health & Fitness', subs: ['Gyms', 'Wellness apps', 'Supplements', 'Mental health'] },
  { label: 'Tech & SaaS', subs: ['B2B', 'B2C', 'Mobile apps', 'AI & Automation'] },
  { label: 'Travel & Hospitality', subs: ['Hotels', 'Airlines', 'Tourism', 'Experiences'] },
  { label: 'Education', subs: ['Online courses', 'K-12', 'University', 'EdTech'] },
  { label: 'Finance', subs: ['Fintech', 'Crypto', 'Insurance', 'Banking'] },
  { label: 'E-Commerce', subs: ['DTC brands', 'Marketplaces', 'Dropshipping', 'Subscription'] },
]

const creatorNiches: NicheCategory[] = [
  { label: 'Fashion & Style', subs: ['Streetwear', 'Thrifting', 'OOTD', 'Hauls', 'Luxury'] },
  { label: 'Beauty & Makeup', subs: ['Tutorials', 'Skincare', 'Reviews', 'GRWM', 'Nails'] },
  { label: 'Fitness & Health', subs: ['Workouts', 'Nutrition', 'Yoga', 'Running', 'Gym'] },
  { label: 'Travel', subs: ['Budget', 'Luxury', 'Solo', 'Adventure', 'Digital nomad'] },
  { label: 'Food & Cooking', subs: ['Recipes', 'Restaurant reviews', 'Healthy eating', 'Baking'] },
  { label: 'Tech & Reviews', subs: ['Gadgets', 'Unboxing', 'Coding', 'AI tools', 'Apps'] },
  { label: 'Gaming', subs: ['Streams', 'Reviews', 'Esports', 'Mobile', 'Retro'] },
  { label: 'Comedy', subs: ['Skits', 'Memes', 'Reactions', 'Storytelling'] },
  { label: 'Education', subs: ['Study tips', 'Languages', 'Science', 'Finance tips'] },
  { label: 'Lifestyle', subs: ['Vlogs', 'Minimalism', 'Productivity', 'Self-improvement'] },
  { label: 'Business', subs: ['Entrepreneurship', 'Marketing', 'Investing', 'Side hustles'] },
  { label: 'Art & Design', subs: ['Digital art', 'Photography', 'Graphic design', 'DIY crafts'] },
]

/* ── Countries ── */

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
  'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica',
  'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador',
  'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands',
  'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
  'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
  'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
  'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga',
  'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
  'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
]

/* ── Reusable pill ── */

function Pill({
  label,
  selected,
  onClick,
  hasArrow,
}: {
  label: string
  selected: boolean
  onClick: () => void
  hasArrow?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-caption-1 font-medium transition-all duration-150 border whitespace-nowrap',
        selected
          ? 'bg-primary-btn text-white border-primary-btn'
          : 'border-alpha-10 text-primary-900 hover:border-primary-btn hover:bg-alpha-5'
      )}
    >
      {label}
      {hasArrow && !selected && <ChevronRight className="size-3 text-alpha-30" />}
    </button>
  )
}

/* ── Hierarchical niche selector ── */

function NicheSelector({
  categories,
  selectedCategory,
  selectedSub,
  onSelectCategory,
  onSelectSub,
  error,
}: {
  categories: NicheCategory[]
  selectedCategory: string | null
  selectedSub: string | null
  onSelectCategory: (v: string) => void
  onSelectSub: (v: string) => void
  error?: boolean
}) {
  const activeSubs = categories.find((c) => c.label === selectedCategory)?.subs || []

  return (
    <div className={cn(error && !selectedCategory && 'ring-2 ring-destructive-300 rounded-[14px] p-1.5 -m-1.5')}>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((cat) => (
          <Pill
            key={cat.label}
            label={cat.label}
            selected={selectedCategory === cat.label}
            onClick={() => onSelectCategory(cat.label)}
            hasArrow
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {selectedCategory && activeSubs.length > 0 && (
          <motion.div
            key={selectedCategory}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-alpha-10">
              {activeSubs.map((sub) => (
                <Pill
                  key={sub}
                  label={sub}
                  selected={selectedSub === sub}
                  onClick={() => onSelectSub(sub)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Page ── */

export default function SetupPage() {
  const router = useRouter()
  const persona = useOnboardingStore((s) => s.persona)
  const setStep = useOnboardingStore((s) => s.setStep)
  const setProjectId = useOnboardingStore((s) => s.setProjectId)
  const setRunIds = useOnboardingStore((s) => s.setRunIds)

  const [brandName, setBrandName] = useState('')
  const [website, setWebsite] = useState('')
  const [instagram, setInstagram] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [youtube, setYoutube] = useState('')
  const [nicheCategory, setNicheCategory] = useState<string | null>(null)
  const [nicheSub, setNicheSub] = useState<string | null>(null)
  const [country, setCountry] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!persona) router.replace('/onboarding/role')
  }, [persona, router])

  if (!persona) return null

  function handleSelectCategory(v: string) {
    setNicheCategory(v)
    setNicheSub(null)
    setErrors((prev) => ({ ...prev, niche: false }))
  }

  function validate(): boolean {
    const errs: Record<string, boolean> = {}
    if (!brandName.trim()) errs.name = true
    if (!nicheCategory) errs.niche = true
    if (!country) errs.country = true
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setStep(2)

    const niche = nicheSub ? `${nicheCategory} — ${nicheSub}` : nicheCategory!

    try {
      const { data: project } = await createProject({
        name: brandName.trim(),
        niche,
        location: country || undefined,
        persona: persona || undefined,
        website: website.trim() || undefined,
        instagram_handle: instagram.trim() || undefined,
        tiktok_handle: tiktok.trim() || undefined,
        youtube_handle: youtube.trim() || undefined,
      })

      setProjectId(project.id)

      const discovery = await discoverCompetitors({
        niche,
        location: country || undefined,
        project_id: project.id,
        persona: persona || undefined,
        instagram_handle: instagram.trim() || undefined,
        tiktok_handle: tiktok.trim() || undefined,
        youtube_handle: youtube.trim() || undefined,
      })
      setRunIds(discovery.data.runs.map((r) => ({ runId: r.runId, platform: r.platform })))

      await updateProfile({
        persona: persona,
        instagram_handle: instagram.trim() || null,
        tiktok_handle: tiktok.trim() || null,
        youtube_handle: youtube.trim() || null,
        onboarding_completed: true,
      })

      router.push('/onboarding/loading')
    } catch (err) {
      console.warn('API unavailable:', err)
      setLoading(false)
    }
  }

  const niches = persona === 'ecommerce' ? ecommerceNiches
    : persona === 'agency' ? agencyNiches
    : creatorNiches

  const headlines: Record<string, string> = {
    ecommerce: 'Tell us about your brand',
    agency: 'Tell us about your client',
    creator: 'Tell us about you',
  }

  const nameLabels: Record<string, string> = {
    ecommerce: 'Brand name',
    agency: 'Client brand name',
    creator: 'Your name or brand',
  }

  const namePlaceholders: Record<string, string> = {
    ecommerce: 'e.g. Bloom Cosmetics',
    agency: 'e.g. Bloom Cosmetics',
    creator: 'e.g. Sarah Creates',
  }

  return (
    <>
      <ProgressBar percent={33} />

      <div className="flex flex-col items-center px-4 sm:px-6 pt-4 sm:pt-8 pb-8">
        {/* Back + step */}
        <div className="w-full max-w-[580px] flex items-center justify-between mb-4 sm:mb-6">
          <Link
            href="/onboarding/role"
            className="inline-flex items-center gap-1.5 text-caption-1 font-medium text-slate-500 hover:text-primary-btn transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Change role
          </Link>
          <span className="text-caption-2 font-medium text-alpha-30">Step 2 of 3</span>
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-h5 sm:text-h4 font-bold text-primary-btn text-center mb-5 sm:mb-8"
        >
          {headlines[persona]}
        </motion.h1>

        {/* Form card */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onSubmit={handleSubmit}
          className="w-full max-w-[580px] border border-black rounded-[28px] sm:rounded-[40px] shadow-signature overflow-hidden bg-white p-5 sm:p-8 space-y-5"
        >
          {/* Brand name */}
          <div className="space-y-1.5">
            <Label htmlFor="brandName">{nameLabels[persona]}</Label>
            <Input
              id="brandName"
              size="lg"
              placeholder={namePlaceholders[persona]}
              value={brandName}
              onChange={(e) => { setBrandName(e.target.value); setErrors((p) => ({ ...p, name: false })) }}
              error={errors.name}
            />
            {errors.name && <p className="text-caption-2 text-destructive-500">Required</p>}
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <Label htmlFor="website">
              Website
              <span className="text-slate-400 font-normal text-caption-2 ml-1">(optional)</span>
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-alpha-30" />
              <Input
                id="website"
                size="lg"
                className="pl-9"
                placeholder="https://yourbrand.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
          </div>

          {/* Social media handles */}
          <div className="space-y-2">
            <Label>
              Social media
              <span className="text-slate-400 font-normal text-caption-2 ml-1">(paste your handles)</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-alpha-30" />
                <Input
                  size="lg"
                  className="pl-9"
                  placeholder="@username"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
              <div className="relative">
                <TikTokIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-alpha-30" />
                <Input
                  size="lg"
                  className="pl-9"
                  placeholder="@username"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                />
              </div>
              <div className="relative">
                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-alpha-30" />
                <Input
                  size="lg"
                  className="pl-9"
                  placeholder="@channel"
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Niche */}
          <div className="space-y-2">
            <Label>
              {persona === 'ecommerce' && 'What are you selling?'}
              {persona === 'agency' && 'Industry / niche'}
              {persona === 'creator' && 'Pick your niche'}
            </Label>
            <NicheSelector
              categories={niches}
              selectedCategory={nicheCategory}
              selectedSub={nicheSub}
              onSelectCategory={handleSelectCategory}
              onSelectSub={(v) => { setNicheSub(v); setErrors((p) => ({ ...p, niche: false })) }}
              error={errors.niche}
            />
            {errors.niche && <p className="text-caption-2 text-destructive-500">Pick a category</p>}
          </div>

          {/* Country */}
          <div className="space-y-1.5">
            <Label>Target country</Label>
            <Select
              value={country || ''}
              onValueChange={(v) => { setCountry(v); setErrors((p) => ({ ...p, country: false })) }}
            >
              <SelectTrigger error={errors.country}>
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.country && <p className="text-caption-2 text-destructive-500">Pick a country</p>}
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] bg-secondary-300 px-4 py-3 text-body-2 font-medium text-primary-900 border border-primary-900 shadow-signature transition-all duration-200 hover:bg-secondary-400 hover:shadow-[0px_3px_0px_0px_#191a23] active:shadow-none active:translate-y-[2px] disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? 'Launching discovery...' : (
              <>
                Find My Competitors
                <ArrowRight className="size-4" />
              </>
            )}
          </button>

          <p className="text-caption-2 text-alpha-30 text-center">
            We'll scan Instagram, TikTok & YouTube for accounts in your niche.
          </p>
        </motion.form>
      </div>
    </>
  )
}
