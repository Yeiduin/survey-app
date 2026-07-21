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

    // Verify ownership
    const { data: survey, error: surveyError } = await supabase
      .from('surveys')
      .select('id, title, description, settings, theme')
      .eq('id', surveyId)
      .eq('owner_id', user.id)
      .single()

    if (surveyError || !survey) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, settings, theme, pages } = body

    // Update survey metadata
    const surveyUpdates: Record<string, any> = {}
    if (title !== undefined) surveyUpdates.title = title
    if (description !== undefined) surveyUpdates.description = description
    if (settings !== undefined) surveyUpdates.settings = settings
    if (theme !== undefined) surveyUpdates.theme = theme

    if (Object.keys(surveyUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('surveys')
        .update(surveyUpdates)
        .eq('id', surveyId)
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    // Save pages, questions, options if provided
    if (pages && Array.isArray(pages)) {
      // Get or create a draft version
      let { data: existingVersion } = await supabase
        .from('survey_versions')
        .select('id')
        .eq('survey_id', surveyId)
        .is('published_at', null)
        .order('version_number', { ascending: false })
        .limit(1)
        .single()

      let versionId: string

      if (existingVersion) {
        versionId = existingVersion.id
        // Delete existing pages, questions, options for this version
        // Cascade delete handles questions and options
        await supabase
          .from('survey_pages')
          .delete()
          .eq('survey_version_id', versionId)
      } else {
        // Create new draft version
        const { data: maxVersion } = await supabase
          .from('survey_versions')
          .select('version_number')
          .eq('survey_id', surveyId)
          .order('version_number', { ascending: false })
          .limit(1)
          .single()

        const nextVersion = (maxVersion?.version_number || 0) + 1
        const { data: newVersion, error: versionError } = await supabase
          .from('survey_versions')
          .insert({
            survey_id: surveyId,
            version_number: nextVersion,
            schema_snapshot: {},
            created_by: user.id,
          })
          .select()
          .single()

        if (versionError || !newVersion) {
          return NextResponse.json({ error: 'Error al crear versión' }, { status: 500 })
        }
        versionId = newVersion.id
      }

      // Insert pages
      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const page = pages[pIdx]
        const { data: dbPage, error: pageError } = await supabase
          .from('survey_pages')
          .insert({
            survey_version_id: versionId,
            title: page.title || null,
            description: page.description || null,
            position: pIdx,
            settings: page.settings || {},
          })
          .select()
          .single()

        if (pageError || !dbPage) continue

        // Insert questions for this page
        if (page.questions && Array.isArray(page.questions)) {
          for (let qIdx = 0; qIdx < page.questions.length; qIdx++) {
            const q = page.questions[qIdx]
            const { data: dbQ, error: qError } = await supabase
              .from('questions')
              .insert({
                page_id: dbPage.id,
                type: q.type || 'short_text',
                title: q.title || 'Pregunta',
                description: q.description || null,
                position: qIdx,
                required: q.required || false,
                settings: q.settings || {},
                validation: q.validation || {},
              })
              .select()
              .single()

            if (qError || !dbQ) continue

            // Insert options for this question
            if (q.options && Array.isArray(q.options)) {
              const optionRows = q.options.map((opt: any, oIdx: number) => ({
                question_id: dbQ.id,
                label: opt.label || `Opción ${oIdx + 1}`,
                value: opt.value || `opcion_${oIdx + 1}`,
                position: oIdx,
                settings: opt.settings || {},
              }))

              if (optionRows.length > 0) {
                await supabase.from('question_options').insert(optionRows)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
