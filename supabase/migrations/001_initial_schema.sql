-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE survey_status AS ENUM ('draft', 'published', 'paused', 'closed', 'archived');
CREATE TYPE survey_visibility AS ENUM ('public', 'private', 'password', 'invite_only');
CREATE TYPE response_status AS ENUM ('in_progress', 'completed', 'disqualified', 'abandoned');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE question_type AS ENUM (
  'short_text', 'long_text', 'email', 'number', 'phone', 'url',
  'single_choice', 'multiple_choice', 'dropdown', 'yes_no', 'true_false',
  'image_choice', 'rating', 'stars', 'nps', 'likert',
  'matrix_single', 'matrix_multiple', 'ranking',
  'date', 'time', 'datetime', 'date_range',
  'file_upload', 'image_upload', 'signature', 'location',
  'info_block', 'section_separator', 'consent', 'contact_info', 'point_distribution'
);
CREATE TYPE logic_operator AS ENUM (
  'equals', 'not_equals', 'contains', 'not_contains',
  'greater_than', 'less_than', 'is_empty', 'is_not_empty',
  'includes_any', 'includes_all', 'in_range'
);
CREATE TYPE logic_action_type AS ENUM (
  'show_question', 'hide_question', 'jump_to_page', 'end_survey',
  'disqualify', 'show_message', 'assign_score', 'redirect'
);
CREATE TYPE collector_type AS ENUM ('link', 'email', 'embed', 'qr');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Surveys table
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Encuesta sin título',
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  status survey_status NOT NULL DEFAULT 'draft',
  visibility survey_visibility NOT NULL DEFAULT 'public',
  active_version_id UUID,
  settings JSONB NOT NULL DEFAULT '{}',
  theme JSONB NOT NULL DEFAULT '{}',
  published_at TIMESTAMPTZ,
  closes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_surveys_owner ON surveys(owner_id);
CREATE INDEX idx_surveys_status ON surveys(status);
CREATE INDEX idx_surveys_slug ON surveys(slug);

-- Survey versions
CREATE TABLE survey_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  schema_snapshot JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  UNIQUE(survey_id, version_number)
);

-- Add FK for active_version_id
ALTER TABLE surveys ADD CONSTRAINT fk_active_version 
  FOREIGN KEY (active_version_id) REFERENCES survey_versions(id);

-- Survey pages
CREATE TABLE survey_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_version_id UUID NOT NULL REFERENCES survey_versions(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  settings JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_pages_version ON survey_pages(survey_version_id);

-- Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id UUID NOT NULL REFERENCES survey_pages(id) ON DELETE CASCADE,
  type question_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN NOT NULL DEFAULT false,
  settings JSONB NOT NULL DEFAULT '{}',
  validation JSONB NOT NULL DEFAULT '{}',
  scoring JSONB
);

CREATE INDEX idx_questions_page ON questions(page_id);

-- Question options
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  score NUMERIC,
  settings JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_options_question ON question_options(question_id);

-- Logic rules
CREATE TABLE logic_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_version_id UUID NOT NULL REFERENCES survey_versions(id) ON DELETE CASCADE,
  source_question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  conditions JSONB NOT NULL DEFAULT '[]',
  action_type logic_action_type NOT NULL,
  action_config JSONB NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_logic_version ON logic_rules(survey_version_id);

-- Survey collectors
CREATE TABLE survey_collectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type collector_type NOT NULL DEFAULT 'link',
  name TEXT NOT NULL DEFAULT 'Default',
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collectors_survey ON survey_collectors(survey_id);
CREATE INDEX idx_collectors_token ON survey_collectors(token);

-- Responses
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  survey_version_id UUID NOT NULL REFERENCES survey_versions(id),
  collector_id UUID REFERENCES survey_collectors(id),
  respondent_id UUID REFERENCES profiles(id),
  anonymous_token TEXT,
  status response_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  metadata JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_responses_survey ON responses(survey_id);
CREATE INDEX idx_responses_status ON responses(status);
CREATE INDEX idx_responses_respondent ON responses(respondent_id);

-- Answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  value JSONB,
  numeric_value NUMERIC,
  text_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_answers_response ON answers(response_id);
CREATE INDEX idx_answers_question ON answers(question_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON surveys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE logic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_collectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
  
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Surveys: owners can CRUD their own surveys
CREATE POLICY "Users can view own surveys" ON surveys
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create surveys" ON surveys
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own surveys" ON surveys
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own surveys" ON surveys
  FOR DELETE USING (auth.uid() = owner_id);

-- Public surveys can be viewed by anyone (for the survey runner)
CREATE POLICY "Anyone can view published public surveys" ON surveys
  FOR SELECT USING (status = 'published' AND visibility = 'public');

-- Survey versions: same as surveys
CREATE POLICY "Owners can manage versions" ON survey_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = survey_versions.survey_id AND surveys.owner_id = auth.uid())
  );

CREATE POLICY "Anyone can view published versions" ON survey_versions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = survey_versions.survey_id AND surveys.status = 'published' AND surveys.visibility = 'public')
  );

-- Pages: cascade from survey versions
CREATE POLICY "Owners can manage pages" ON survey_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM survey_versions sv
      JOIN surveys s ON s.id = sv.survey_id
      WHERE sv.id = survey_pages.survey_version_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view published pages" ON survey_pages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM survey_versions sv
      JOIN surveys s ON s.id = sv.survey_id
      WHERE sv.id = survey_pages.survey_version_id AND s.status = 'published'
    )
  );

-- Questions: cascade from pages
CREATE POLICY "Owners can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM survey_pages sp
      JOIN survey_versions sv ON sv.id = sp.survey_version_id
      JOIN surveys s ON s.id = sv.survey_id
      WHERE sp.id = questions.page_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view published questions" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM survey_pages sp
      JOIN survey_versions sv ON sv.id = sp.survey_version_id
      JOIN surveys s ON s.id = sv.survey_id
      WHERE sp.id = questions.page_id AND s.status = 'published'
    )
  );

-- Question options: cascade from questions
CREATE POLICY "Owners can manage options" ON question_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN survey_pages sp ON sp.id = q.page_id
      JOIN survey_versions sv ON sv.id = sp.survey_version_id
      JOIN surveys s ON s.id = sv.survey_id
      WHERE q.id = question_options.question_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view published options" ON question_options
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM questions q
      JOIN survey_pages sp ON sp.id = q.page_id
      JOIN survey_versions sv ON sv.id = sp.survey_version_id
      JOIN surveys s ON s.id = sv.survey_id
      WHERE q.id = question_options.question_id AND s.status = 'published'
    )
  );

-- Logic rules: same pattern
CREATE POLICY "Owners can manage logic" ON logic_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM survey_versions sv
      JOIN surveys s ON s.id = sv.survey_id
      WHERE sv.id = logic_rules.survey_version_id AND s.owner_id = auth.uid()
    )
  );

-- Collectors
CREATE POLICY "Owners can manage collectors" ON survey_collectors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = survey_collectors.survey_id AND surveys.owner_id = auth.uid())
  );

CREATE POLICY "Anyone can view collectors for published surveys" ON survey_collectors
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = survey_collectors.survey_id AND surveys.status = 'published')
  );

-- Responses: respondents can insert and view own; survey owners can view all
CREATE POLICY "Anyone can submit responses to published surveys" ON responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = responses.survey_id AND surveys.status = 'published')
  );

CREATE POLICY "Respondents can view own responses" ON responses
  FOR SELECT USING (respondent_id = auth.uid());

CREATE POLICY "Survey owners can view responses" ON responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM surveys WHERE surveys.id = responses.survey_id AND surveys.owner_id = auth.uid())
  );

CREATE POLICY "Respondents can update own in-progress responses" ON responses
  FOR UPDATE USING (respondent_id = auth.uid() AND status = 'in_progress');

-- Answers: same as responses
CREATE POLICY "Anyone can submit answers" ON answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN surveys s ON s.id = r.survey_id
      WHERE r.id = answers.response_id AND s.status = 'published'
    )
  );

CREATE POLICY "Survey owners can view answers" ON answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r
      JOIN surveys s ON s.id = r.survey_id
      WHERE r.id = answers.response_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY "Respondents can view own answers" ON answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM responses r WHERE r.id = answers.response_id AND r.respondent_id = auth.uid()
    )
  );

CREATE POLICY "Respondents can update own answers" ON answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM responses r WHERE r.id = answers.response_id AND r.respondent_id = auth.uid() AND r.status = 'in_progress'
    )
  );
