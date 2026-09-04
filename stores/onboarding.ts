import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Persona = 'ecommerce' | 'agency' | 'creator'

export type OnboardingStep =
  | 'account_type'
  | 'identity'
  | 'socials'
  | 'scraping'
  | 'competitors'
  | 'brand_kit'
  | 'completed'

interface RunInfo {
  runId: string
  platform: string
}

interface OnboardingDraft {
  // Shared identity
  entity_name: string
  entity_logo_url: string | null   // dataURL preview only — real upload deferred
  full_name: string
  website_url: string
  country: string
  languages: string[]
  niche: string
  target_market: string

  // Ecommerce-only
  product_category: string
  product_subcategory: string

  // Socials
  instagram_handle: string
  tiktok_handle: string
  youtube_handle: string
  facebook_handle: string
  linkedin_handle: string

  // Onboarding v2: pasted profile links, or "I'm new" niche description
  social_links: string[]
  has_social_presence: boolean
  niche_description: string
  keywords: string[]
  seed_accounts: string[]
}

const emptyDraft: OnboardingDraft = {
  entity_name: '',
  entity_logo_url: null,
  full_name: '',
  website_url: '',
  country: '',
  languages: ['en'],
  niche: '',
  target_market: '',
  product_category: '',
  product_subcategory: '',
  instagram_handle: '',
  tiktok_handle: '',
  youtube_handle: '',
  facebook_handle: '',
  linkedin_handle: '',
  social_links: [''],
  has_social_presence: true,
  niche_description: '',
  keywords: [],
  seed_accounts: [],
}

interface OnboardingStore {
  persona: Persona | null
  onboardingStep: OnboardingStep
  draft: OnboardingDraft
  projectId: string | null
  runIds: RunInfo[] | null
  // Legacy numeric step kept for back-compat with the old loading page
  step: 1 | 2 | 3

  setPersona: (persona: Persona) => void
  setOnboardingStep: (step: OnboardingStep) => void
  patchDraft: (patch: Partial<OnboardingDraft>) => void
  resetDraft: () => void
  setProjectId: (id: string) => void
  setRunIds: (runs: RunInfo[]) => void
  setStep: (step: 1 | 2 | 3) => void
  reset: () => void
}

const initialState = {
  persona: null as Persona | null,
  onboardingStep: 'account_type' as OnboardingStep,
  draft: emptyDraft,
  projectId: null as string | null,
  runIds: null as RunInfo[] | null,
  step: 1 as 1 | 2 | 3,
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,
      setPersona: (persona) => set({ persona }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      patchDraft: (patch) =>
        set((s) => ({ draft: { ...s.draft, ...patch } })),
      resetDraft: () => set({ draft: emptyDraft }),
      setProjectId: (id) => set({ projectId: id }),
      setRunIds: (runs) => set({ runIds: runs }),
      setStep: (step) => set({ step }),
      reset: () => set(initialState),
    }),
    {
      name: 'navix-onboarding',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
