import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ResultsPanel } from '@/components/analytics/results-panel'

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: survey } = await supabase
    .from('surveys')
    .select('*')
    .eq('id', surveyId)
    .eq('owner_id', user.id)
    .single()

  if (!survey) redirect('/dashboard/surveys')

  const { data: responses } = await supabase
    .from('responses')
    .select('*, answers(*)')
    .eq('survey_id', surveyId)

  return <ResultsPanel survey={survey} responses={responses || []} />
}
