import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || `survey-${Date.now()}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { title, description } = await request.json()
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Título requerido' }, { status: 400 })
    }

    const slug = generateSlug(title)

    const { data, error } = await supabase
      .from('surveys')
      .insert({
        owner_id: user.id,
        title,
        slug,
        description: description || null,
        settings: {},
        theme: {},
      })
      .select()
      .single()

    if (error) {
      // If slug collision, append timestamp
      if (error.code === '23505') {
        const { data: retry } = await supabase
          .from('surveys')
          .insert({
            owner_id: user.id,
            title,
            slug: `${slug}-${Date.now()}`,
            description: description || null,
            settings: {},
            theme: {},
          })
          .select()
          .single()
        if (retry) return NextResponse.json(retry, { status: 201 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
