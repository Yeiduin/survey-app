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

  if (!survey) {
    notFound()
  }

  // Allow owners to preview any status; public only sees published/paused
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === survey.owner_id

  if (!['published', 'paused'].includes(survey.status) && !isOwner) {
    notFound()
  }

  // Get the active version with all its data (or latest draft for owners)
  let versionId = survey.active_version_id

  // For draft previews, get the latest unpublished version
  if (!versionId && isOwner) {
    const { data: draftVersion } = await supabase
      .from('survey_versions')
      .select('id')
      .eq('survey_id', survey.id)
      .is('published_at', null)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()
    if (draftVersion) {
      versionId = draftVersion.id
    }
  }

  if (versionId) {
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
      .eq('id', versionId)
      .single()

    return (
      <SurveyRunner survey={survey} version={version} />
    )
  }

  // No version found - show survey without questions
  return <SurveyRunner survey={survey} version={null} />
}
