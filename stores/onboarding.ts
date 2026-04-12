import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Persona = 'ecommerce' | 'agency' | 'creator'

interface RunInfo {
  runId: string
  platform: string
}

interface OnboardingStore {
  persona: Persona | null
  projectId: string | null
  runIds: RunInfo[] | null
  step: 1 | 2 | 3

  setPersona: (persona: Persona) => void
  setProjectId: (id: string) => void
  setRunIds: (runs: RunInfo[]) => void
  setStep: (step: 1 | 2 | 3) => void
  reset: () => void
}

const initialState = {
  persona: null as Persona | null,
  projectId: null as string | null,
  runIds: null as RunInfo[] | null,
  step: 1 as 1 | 2 | 3,
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...initialState,
      setPersona: (persona) => set({ persona }),
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
