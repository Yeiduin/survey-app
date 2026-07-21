'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEditorStore } from '@/stores/survey-editor-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

  const supabase = createClient()

  const handleSave = async () => {
    if (!survey) return
    setSaving(true)

    const { error } = await supabase
      .from('surveys')
      .update({
        title: survey.title,
        description: survey.description,
        settings: survey.settings,
        theme: survey.theme,
      })
      .eq('id', survey.id)

    if (error) {
      toast.error('Error al guardar')
    } else {
      markClean()
      toast.success('Guardado')
    }
    setSaving(false)
  }

  const handlePublish = async () => {
    if (!survey) return
    setSaving(true)

    const { error } = await supabase
      .from('surveys')
      .update({ status: 'published' })
      .eq('id', survey.id)

    if (error) {
      toast.error('Error al publicar')
    } else {
      markClean()
      toast.success('Encuesta publicada')
      router.refresh()
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
        <Link href={`/s/${survey.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            Vista previa
          </Button>
        </Link>
      </div>
    </div>
  )
}
