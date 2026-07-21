import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params
    const supabase = await createClient()

    // Get survey
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
    }

    // Check access: must be owner or published/paused
    const { data: { user } } = await supabase.auth.getUser()
    const isOwner = user?.id === survey.owner_id
    if (!['published', 'paused'].includes(survey.status) && !isOwner) {
      return NextResponse.json({ error: 'No disponible' }, { status: 403 })
    }

    // Get active version with all data
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

      return NextResponse.json({ survey, version })
    }

    return NextResponse.json({ survey, version: null })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
