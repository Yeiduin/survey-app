export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type SurveyStatus = 'draft' | 'published' | 'paused' | 'closed' | 'archived'
export type SurveyVisibility = 'public' | 'private' | 'password' | 'invite_only'
export type ResponseStatus = 'in_progress' | 'completed' | 'disqualified' | 'abandoned'
export type UserRole = 'user' | 'admin'

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'email'
  | 'number'
  | 'phone'
  | 'url'
  | 'single_choice'
  | 'multiple_choice'
  | 'dropdown'
  | 'yes_no'
  | 'true_false'
  | 'image_choice'
  | 'rating'
  | 'stars'
  | 'nps'
  | 'likert'
  | 'matrix_single'
  | 'matrix_multiple'
  | 'ranking'
  | 'date'
  | 'time'
  | 'datetime'
  | 'date_range'
  | 'file_upload'
  | 'image_upload'
  | 'signature'
  | 'location'
  | 'info_block'
  | 'section_separator'
  | 'consent'
  | 'contact_info'
  | 'point_distribution'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Survey {
  id: string
  owner_id: string
  title: string
  slug: string
  description: string | null
  status: SurveyStatus
  visibility: SurveyVisibility
  active_version_id: string | null
  settings: SurveySettings
  theme: SurveyTheme
  published_at: string | null
  closes_at: string | null
  created_at: string
  updated_at: string
}

export interface SurveySettings {
  allow_anonymous?: boolean
  one_response_per_user?: boolean
  show_progress_bar?: boolean
  randomize_questions?: boolean
  max_responses?: number | null
  password?: string | null
  welcome_message?: string | null
  completion_message?: string | null
  redirect_url?: string | null
  allow_edit_response?: boolean
  save_partial?: boolean
}

export interface SurveyTheme {
  primary_color?: string
  background_color?: string
  text_color?: string
  font_family?: string
  logo_url?: string | null
  cover_image_url?: string | null
}

export interface SurveyVersion {
  id: string
  survey_id: string
  version_number: number
  schema_snapshot: Json
  created_by: string
  created_at: string
  published_at: string | null
}

export interface SurveyPage {
  id: string
  survey_version_id: string
  title: string | null
  description: string | null
  position: number
  settings: Json
}

export interface Question {
  id: string
  page_id: string
  type: QuestionType
  title: string
  description: string | null
  position: number
  required: boolean
  settings: QuestionSettings
  validation: QuestionValidation
  scoring: QuestionScoring | null
}

export interface QuestionSettings {
  placeholder?: string
  default_value?: Json
  min_selections?: number
  max_selections?: number
  min_length?: number
  max_length?: number
  min_value?: number
  max_value?: number
  step?: number
  randomize_options?: boolean
  allow_other?: boolean
  other_label?: string
  rows?: string[]
  columns?: string[]
  max_file_size?: number
  allowed_file_types?: string[]
  time_limit?: number
}

export interface QuestionValidation {
  pattern?: string
  custom_error?: string
  min?: number
  max?: number
}

export interface QuestionScoring {
  correct_answer?: Json
  points?: number
}

export interface QuestionOption {
  id: string
  question_id: string
  label: string
  value: string
  position: number
  image_url: string | null
  score: number | null
  settings: Json
}

export interface LogicRule {
  id: string
  survey_version_id: string
  source_question_id: string
  conditions: LogicCondition[]
  action_type: LogicActionType
  action_config: Json
  priority: number
}

export type LogicOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty'
  | 'includes_any'
  | 'includes_all'
  | 'in_range'

export type LogicActionType =
  | 'show_question'
  | 'hide_question'
  | 'jump_to_page'
  | 'end_survey'
  | 'disqualify'
  | 'show_message'
  | 'assign_score'
  | 'redirect'

export interface LogicCondition {
  question_id: string
  operator: LogicOperator
  value: Json
}

export interface SurveyResponse {
  id: string
  survey_id: string
  survey_version_id: string
  collector_id: string | null
  respondent_id: string | null
  anonymous_token: string | null
  status: ResponseStatus
  started_at: string
  submitted_at: string | null
  duration_seconds: number | null
  metadata: ResponseMetadata
}

export interface ResponseMetadata {
  user_agent?: string
  ip_country?: string
  device_type?: string
  browser?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export interface Answer {
  id: string
  response_id: string
  question_id: string
  value: Json
  numeric_value: number | null
  text_value: string | null
  created_at: string
  updated_at: string
}

export interface SurveyCollector {
  id: string
  survey_id: string
  type: 'link' | 'email' | 'embed' | 'qr'
  name: string
  token: string
  settings: Json
  created_at: string
}
