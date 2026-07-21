import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { survey_id, survey_version_id, answers } = body

    if (!survey_id) {
      return NextResponse.json({ error: 'survey_id requerido' }, { status: 400 })
    }

    // Verify survey is published
    const { data: survey } = await supabase
      .from('surveys')
      .select('id, status, active_version_id')
      .eq('id', survey_id)
      .single()

    if (!survey) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
    }

    if (survey.status !== 'published' && survey.status !== 'paused') {
      return NextResponse.json({ error: 'Encuesta no disponible' }, { status: 400 })
    }

    const { data: response, error: responseError } = await supabase
      .from('responses')
      .insert({
        survey_id,
        survey_version_id: survey_version_id || survey.active_version_id,
        status: 'completed',
        submitted_at: new Date().toISOString(),
        metadata: {
          user_agent: request.headers.get('user-agent') || '',
        },
      })
      .select()
      .single()

    if (responseError) {
      return NextResponse.json({ error: responseError.message }, { status: 400 })
    }

    // Insert answers if provided
    if (answers && Array.isArray(answers) && answers.length > 0) {
      const answerRows = answers.map((a: any) => ({
        response_id: response.id,
        question_id: a.question_id,
        value: a.value !== undefined ? JSON.parse(JSON.stringify(a.value)) : null,
        numeric_value: typeof a.value === 'number' ? a.value : null,
        text_value: typeof a.value === 'string' ? a.value : null,
      }))

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answerRows)

      if (answersError) {
        // Log but don't fail the response
        console.error('Error saving answers:', answersError)
      }
    }

    return NextResponse.json({ success: true, response_id: response.id }, { status: 201 })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
