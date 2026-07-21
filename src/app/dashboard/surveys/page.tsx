import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SurveyList } from '@/components/dashboard/survey-list'

export default async function SurveysPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: surveys } = await supabase
    .from('surveys')
    .select('*')
    .eq('owner_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis encuestas</h1>
          <p className="text-muted-foreground">Gestiona todas tus encuestas</p>
        </div>
        <Link href="/dashboard/surveys/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva encuesta
          </Button>
        </Link>
      </div>

      <SurveyList surveys={surveys || []} />
    </div>
  )
}
