import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SurveyEditor } from '@/components/survey-builder/survey-editor'

export default async function EditSurveyPage({
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

  return (
    <div className="h-full">
      <SurveyEditor survey={survey} />
    </div>
  )
}
