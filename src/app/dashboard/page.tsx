import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { count: totalSurveys } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  const { count: publishedSurveys } = await supabase
    .from('surveys')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', user.id)
    .eq('status', 'published')

  const { data: userSurveyIds } = await supabase
    .from('surveys')
    .select('id')
    .eq('owner_id', user.id)

  const surveyIdList = userSurveyIds?.map(s => s.id) || []
  let totalResponses = 0
  if (surveyIdList.length > 0) {
    const { count } = await supabase
      .from('responses')
      .select('*', { count: 'exact', head: true })
      .in('survey_id', surveyIdList)
    totalResponses = count || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de control</h1>
          <p className="text-muted-foreground">Bienvenido a tu panel de encuestas</p>
        </div>
        <Link href="/dashboard/surveys/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva encuesta
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total encuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSurveys || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Publicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedSurveys || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses || 0}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
