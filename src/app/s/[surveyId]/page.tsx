import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SurveyRunner } from '@/components/survey-runner/survey-runner'

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params
  const supabase = await createClient()

  // First try by slug
  let { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('slug', surveyId)
    .single()

  // If not found, try by ID
  if (!survey) {
    const { data: surveyById } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()
    survey = surveyById
  }

  if (!survey || !['published', 'paused'].includes(survey.status)) {
    notFound()
  }

  // Get the active version with all its data
  if (survey.active_version_id) {
    const { data: version } = await supabase
      .from('survey_versions')
      .select(`
        *,
        survey_pages (
          *,
          questions (
            *,
            question_options (*)
          )
        )
      `)
      .eq('id', survey.active_version_id)
      .single()

    return (
      <SurveyRunner survey={survey} version={version} />
    )
  }

  // No active version - show survey without questions
  return <SurveyRunner survey={survey} version={null} />
}
