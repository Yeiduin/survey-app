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

    // Get original survey
    const { data: original, error: getError } = await supabase
      .from('surveys')
      .select('*')
      .eq('id', surveyId)
      .eq('owner_id', user.id)
      .single()

    if (getError || !original) {
      return NextResponse.json({ error: 'Encuesta no encontrada' }, { status: 404 })
    }

    // Create duplicate
    const slug = `${original.slug}-copy-${Date.now()}`
    const { data: duplicate, error: insertError } = await supabase
      .from('surveys')
      .insert({
        owner_id: user.id,
        title: `${original.title} (copia)`,
        slug,
        description: original.description,
        settings: original.settings,
        theme: original.theme,
        status: 'draft',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json(duplicate, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
