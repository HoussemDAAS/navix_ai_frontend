export type VoiceStyle = "Professionnel" | "Décontracté" | "Énergique" | "Éducatif";

export interface OnboardingData {
  name: string;
  niche: string;
  location: string;
  tone: number;
  voice: VoiceStyle;
  objectives: string[];
  avoidSubjects?: string;
}

export interface StepProps {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
}
