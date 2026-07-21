'use client'

import { useEditorStore } from '@/stores/survey-editor-store'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, Plus, Copy } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function QuestionEditor() {
  const survey = useEditorStore((s) => s.survey)
  const activePage = useEditorStore((s) => s.activePage)
  const selectedQuestionId = useEditorStore((s) => s.selectedQuestionId)
  const updateQuestion = useEditorStore((s) => s.updateQuestion)
  const removeQuestion = useEditorStore((s) => s.removeQuestion)
  const duplicateQuestion = useEditorStore((s) => s.duplicateQuestion)
  const addOption = useEditorStore((s) => s.addOption)
  const removeOption = useEditorStore((s) => s.removeOption)
  const updateOption = useEditorStore((s) => s.updateOption)

  if (!survey) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Selecciona una pregunta para editarla
      </div>
    )
  }

  const page = survey.pages[activePage]
  if (!page) return null

  const question = page.questions.find((q) => q.id === selectedQuestionId)

  if (!question) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        Selecciona una pregunta para editarla
      </div>
    )
  }

  const hasOptions = ['single_choice', 'multiple_choice', 'dropdown'].includes(question.type)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Configuración</h3>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => duplicateQuestion(activePage, question.id)}
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => removeQuestion(activePage, question.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="q-title">Título</Label>
        <Input
          id="q-title"
          value={question.title}
          onChange={(e) => updateQuestion(activePage, question.id, { title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="q-desc">Descripción</Label>
        <Textarea
          id="q-desc"
          value={question.description}
          onChange={(e) => updateQuestion(activePage, question.id, { description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="q-required">Obligatoria</Label>
        <Switch
          id="q-required"
          checked={question.required}
          onCheckedChange={(checked) => updateQuestion(activePage, question.id, { required: checked })}
        />
      </div>

      {hasOptions && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Opciones</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => addOption(activePage, question.id)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Agregar
              </Button>
            </div>
            {question.options.map((option, optIndex) => (
              <div key={option.id} className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs w-5">{optIndex + 1}.</span>
                <Input
                  value={option.label}
                  onChange={(e) =>
                    updateOption(activePage, question.id, option.id, { label: e.target.value })
                  }
                  className="flex-1 h-8 text-sm"
                  placeholder={`Opción ${optIndex + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => removeOption(activePage, question.id, option.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
