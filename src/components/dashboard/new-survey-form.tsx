'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100) || `survey-${Date.now()}`
}

export function NewSurveyForm({ userId }: { userId: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const slug = generateSlug(title)
    
    const { data, error: insertError } = await supabase
      .from('surveys')
      .insert({
        owner_id: userId,
        title,
        slug,
        description: description || null,
        settings: {},
        theme: {},
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push(`/dashboard/surveys/${data.id}/edit`)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard/surveys"
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis encuestas
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nueva encuesta</CardTitle>
          <CardDescription>
            Dale un título y una descripción a tu encuesta. Podrás editarla después.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Título de la encuesta</Label>
              <Input
                id="title"
                placeholder="Ej: Encuesta de satisfacción"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Describe el propósito de tu encuesta..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Creando...' : 'Crear encuesta'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
