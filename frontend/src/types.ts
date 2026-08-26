export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department?: string;
  institution?: string;
  is_active: boolean;
  created_at: string;
}

export interface DemoAccount {
  role: string;
  name: string;
  username: string;
  password: string;
  department: string;
  institution: string;
}

export interface SuspectedMedicine {
  drug_name: string;
  dose?: string;
  unit?: string;
  route?: string;
  frequency?: string;
  start_date?: string;
  stop_date?: string;
  indication?: string;
  batch_no?: string;
  manufacturer?: string;
  is_suspected: boolean;
}

export interface ConcomitantMedicine {
  drug_name: string;
  dose?: string;
  route?: string;
  start_date?: string;
  stop_date?: string;
  indication?: string;
}

export interface ReactionDetail {
  term: string;
  meddra_pt?: string;
  onset_date?: string;
  duration?: string;
  time_to_onset?: string;
  outcome?: string;
  description?: string;
}

export interface MissingFieldItem {
  field: string;
  category: 'mandatory_ich' | 'important_clinical' | 'recommended';
  description: string;
  suggested_action: string;
}

export interface AuditLog {
  id: number;
  action: string;
  details?: string;
  timestamp: string;
  user?: User;
}

export interface ADRReport {
  id: number;
  report_number: string;
  patient_identifier?: string;
  patient_age?: number;
  patient_age_unit?: string;
  patient_gender?: string;
  patient_weight_kg?: number;
  medical_history?: string;
  known_allergies?: string;
  clinical_narrative?: string;
  suspected_medicines: SuspectedMedicine[];
  concomitant_medicines: ConcomitantMedicine[];
  reactions: ReactionDetail[];
  reaction_onset_date?: string;
  reaction_outcome?: string;
  is_serious: boolean;
  seriousness_death?: boolean;
  seriousness_life_threatening?: boolean;
  seriousness_hospitalization?: boolean;
  seriousness_disability?: boolean;
  seriousness_congenital_anomaly?: boolean;
  seriousness_other_medically_important?: boolean;
  seriousness_details?: string;
  dechallenge_action?: string;
  dechallenge_outcome?: string;
  rechallenge_action?: string;
  rechallenge_outcome?: string;
  causality_method?: string;
  causality_score?: number;
  causality_category?: string;
  naranjo_answers?: Record<string, number>;
  lab_findings?: string;
  additional_remarks?: string;
  reporter_name?: string;
  reporter_role?: string;
  reporter_contact?: string;
  reporter_institution?: string;
  reporter_country?: string;
  ai_raw_extraction?: Record<string, any>;
  ai_confidence_score?: number;
  ai_missing_fields?: MissingFieldItem[];
  completeness_score?: number;
  ich_criteria_met?: boolean;
  status: 'DRAFT' | 'AI_EXTRACTED' | 'PENDING_REVIEW' | 'VERIFIED_APPROVED' | 'SUBMITTED';
  verified_by_user_id?: number;
  verified_at?: string;
  verification_notes?: string;
  created_by_user_id?: number;
  created_at: string;
  updated_at: string;
  created_by?: User;
  verified_by?: User;
  audit_logs?: AuditLog[];
}

export interface AIExtractionResponse {
  patient_age?: number;
  patient_age_unit?: string;
  patient_gender?: string;
  patient_weight_kg?: number;
  medical_history?: string;
  suspected_medicines: SuspectedMedicine[];
  concomitant_medicines: ConcomitantMedicine[];
  reactions: ReactionDetail[];
  reaction_onset_date?: string;
  reaction_outcome?: string;
  is_serious: boolean;
  seriousness_criteria: Record<string, boolean>;
  seriousness_details?: string;
  action_taken?: string;
  dechallenge_action?: string;
  dechallenge_outcome?: string;
  rechallenge_action?: string;
  rechallenge_outcome?: string;
  lab_findings?: string;
  confidence_score: number;
  field_provenance: Record<string, any>;
  missing_fields: MissingFieldItem[];
  completeness_score: number;
  ich_criteria_met: boolean;
  naranjo_estimate?: {
    score: number;
    category: string;
    interpretation: string;
    suggested_answers: Record<string, number>;
  };
}

export interface ClinicalScenario {
  id: string;
  title: string;
  description: string;
  category: string;
  narrative: string;
}

export interface NaranjoQuestion {
  id: string;
  question: string;
  options: Record<string, number>;
}

export interface DashboardStats {
  total_reports: number;
  serious_reports: number;
  pending_review: number;
  verified_approved: number;
  avg_completeness_score: number;
  top_suspected_drugs: { name: string; count: number }[];
  top_reactions: { term: string; count: number }[];
  seriousness_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  causality_distribution: Record<string, number>;
  recent_reports: ADRReport[];
}
