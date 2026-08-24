// Self-portrait: initial self-assessment
export interface SelfPortrait {
  id: number;
  discipline_score: number;
  engagement_score: number;
  procrastination_score: number;
  persistence_score: number;
  strength_text: string;
  change_text: string;
  self_words: string;
  created_at: string;
}

// A single fact entry submitted by user
export interface FactLog {
  id: number;
  date: string;
  completed_text: string;
  uncompleted_text: string;
  progress_evidence: string;
  avoidance_text: string;
  representative_fact: string;
  one_line_fact: string;
  category_tags: string; // JSON array
  created_at: string;
}

// AI analysis output
export interface AnalysisResult {
  id: number;
  period_start: string;
  period_end: string;
  summary: string;
  alignment_score: number;
  confidence: 'low' | 'medium' | 'high';
  matched_beliefs: string; // JSON
  gaps: string; // JSON
  insufficient_evidence: string; // JSON
  suggested_reflection: string;
  created_at: string;
}

export interface MatchedBelief {
  belief: string;
  evidence: string;
  assessment: string;
}

export interface Gap {
  belief: string;
  evidence: string;
  assessment: string;
}

export interface AIAnalysisOutput {
  summary: string;
  alignment_score: number;
  confidence: 'low' | 'medium' | 'high';
  matched_beliefs: MatchedBelief[];
  gaps: Gap[];
  insufficient_evidence: string[];
  suggested_reflection: string;
}

export type Tier = 'free' | 'plus' | 'pro';

/** OpenAI-compatible provider 配置（PRD 9.4） */
export interface ProviderConfig {
  /** 不含 /chat/completions 的 base URL，例如 https://api.openai.com/v1 */
  baseUrl: string;
  model: string;
}

export interface AppSettings {
  apiKey: string | null;
  tier: Tier;
  onboardingComplete: boolean;
  provider: ProviderConfig;
}
