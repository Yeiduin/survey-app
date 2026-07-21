import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ surveyId: string }> }
) {
  try {
    const { surveyId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { data: survey, error: getError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .eq('owner_id', user.id)
      .single()

    if (getError || !survey) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
    }

    // Find the latest draft version and publish it
    const { data: draftVersion } = await supabase
      .from('survey_versions')
      .select('*')
      .eq('survey_id', surveyId)
      .is('published_at', null)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    let activeVersionId = survey.active_version_id

    if (draftVersion) {
      // Get the schema snapshot by fetching pages/questions/options
      const { data: schemaData } = await supabase
        .from('survey_pages')
        .select(`
          *,
          questions (
            *,
            question_options (*)
          )
        `)
        .eq('survey_version_id', draftVersion.id)
        .order('position')

      // Publish the version
      await supabase
        .from('survey_versions')
        .update({
          published_at: new Date().toISOString(),
          schema_snapshot: schemaData ? JSON.parse(JSON.stringify(schemaData)) : {},
        })
        .eq('id', draftVersion.id)

      activeVersionId = draftVersion.id
    }

    // Create a collector for the survey (if none exists)
    const { data: existingCollectors } = await supabase
      .from('survey_collectors')
      .select('id')
      .eq('survey_id', surveyId)
      .limit(1)

    if (!existingCollectors || existingCollectors.length === 0) {
      await supabase
        .from('survey_collectors')
        .insert({
          survey_id: surveyId,
          type: 'link',
          name: 'Default',
        })
    }

    // Update survey status to published
    const { data: updated, error } = await supabase
      .from('surveys')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        active_version_id: activeVersionId,
      })
      .eq('id', surveyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
