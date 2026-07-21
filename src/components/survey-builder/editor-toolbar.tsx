'use client'

import { useRouter } from 'next/navigation'
import { useEditorStore } from '@/stores/survey-editor-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Save, Eye, Globe, Loader2, Undo } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export function EditorToolbar() {
  const router = useRouter()
  const survey = useEditorStore((s) => s.survey)
  const updateTitle = useEditorStore((s) => s.updateTitle)
  const isDirty = useEditorStore((s) => s.isDirty)
  const isSaving = useEditorStore((s) => s.isSaving)
  const setSaving = useEditorStore((s) => s.setSaving)
  const markClean = useEditorStore((s) => s.markClean)

  const handleSave = async () => {
    if (!survey) return
    setSaving(true)

    try {
      const res = await fetch(`/api/surveys/${survey.id}/editor-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: survey.title,
          description: survey.description,
          settings: survey.settings,
          theme: survey.theme,
          pages: survey.pages,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      markClean()
      toast.success('Guardado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar')
    }
    setSaving(false)
  }

  const handlePublish = async () => {
    if (!survey) return
    setSaving(true)

    try {
      // First save the editor state
      const saveRes = await fetch(`/api/surveys/${survey.id}/editor-save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: survey.title,
          description: survey.description,
          settings: survey.settings,
          theme: survey.theme,
          pages: survey.pages,
        }),
      })

      if (!saveRes.ok) {
        const data = await saveRes.json()
        throw new Error(data.error || 'Error al guardar antes de publicar')
      }

      // Then publish
      const publishRes = await fetch(`/api/surveys/${survey.id}/publish`, {
        method: 'POST',
      })

      if (!publishRes.ok) {
        const data = await publishRes.json()
        throw new Error(data.error || 'Error al publicar')
      }

      markClean()
      toast.success('Encuesta publicada')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al publicar')
    }
    setSaving(false)
  }

  if (!survey) return null

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-background gap-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/surveys">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Input
          value={survey.title}
          onChange={(e) => updateTitle(e.target.value)}
          className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 h-9 w-80"
        />
      </div>

      <div className="flex items-center gap-2">
        {isDirty && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Undo className="h-3 w-3" />
            Sin guardar
          </span>
        )}
        <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving || !isDirty}>
          {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Guardar
        </Button>
        {survey.status === 'draft' && (
          <Button size="sm" onClick={handlePublish} disabled={isSaving}>
            <Globe className="h-4 w-4 mr-1" />
            Publicar
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => window.open(`/s/${survey.id}`, '_blank')}>
          <Eye className="h-4 w-4 mr-1" />
          Vista previa
        </Button>
      </div>
    </div>
  )
}
