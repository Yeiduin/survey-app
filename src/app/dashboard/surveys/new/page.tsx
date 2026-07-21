import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewSurveyForm } from '@/components/dashboard/new-survey-form'

export default async function NewSurveyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <NewSurveyForm userId={user.id} />
}
