'use client'

import { useEditorStore } from '@/stores/survey-editor-store'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import QuestionTypeSelector from './question-type-selector'

function QuestionPreview({ question }: { question: any }) {
  switch (question.type) {
    case 'short_text':
      return <Input placeholder={question.settings?.placeholder || 'Escribe tu respuesta...'} />
    case 'long_text':
      return <Textarea placeholder={question.settings?.placeholder || 'Escribe tu respuesta...'} rows={3} />
    case 'email':
      return <Input type="email" placeholder="correo@ejemplo.com" />
    case 'number':
      return <Input type="number" placeholder="0" />
    case 'phone':
      return <Input type="tel" placeholder="+56 9 1234 5678" />
    case 'url':
      return <Input type="url" placeholder="https://ejemplo.com" />
    case 'single_choice':
    case 'yes_no':
      return (
        <RadioGroup>
          {question.options?.map((opt: any) => (
            <div key={opt.id} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={opt.id} />
              <Label htmlFor={opt.id}>{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      )
    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {question.options?.map((opt: any) => (
            <div key={opt.id} className="flex items-center gap-2">
              <Checkbox id={opt.id} />
              <Label htmlFor={opt.id}>{opt.label}</Label>
            </div>
          ))}
        </div>
      )
    case 'dropdown':
      return (
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {question.options?.map((opt: any) => (
              <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    case 'rating':
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Button key={n} variant="outline" size="sm" className="h-10 w-10">
              {n}
            </Button>
          ))}
        </div>
      )
    case 'nps':
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <Button key={n} variant="outline" size="sm" className="h-10 w-9 text-xs p-0">
                {n}
              </Button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Nada probable</span>
            <span>Extremadamente probable</span>
          </div>
        </div>
      )
    case 'date':
      return <Input type="date" />
    case 'time':
      return <Input type="time" />
    case 'info_block':
      return (
        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
          {question.description || 'Bloque informativo'}
        </div>
      )
    default:
      return <Input placeholder="Respuesta..." />
  }
}

export function BuilderPreview() {
  const survey = useEditorStore((s) => s.survey)
  const activePage = useEditorStore((s) => s.activePage)
  const selectedQuestionId = useEditorStore((s) => s.selectedQuestionId)
  const selectQuestion = useEditorStore((s) => s.selectQuestion)

  if (!survey) return null

  const page = survey.pages[activePage]
  if (!page) return null

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold">{survey.title}</h1>
        {survey.description && (
          <p className="text-muted-foreground">{survey.description}</p>
        )}
      </div>

      {page.questions.map((question, qIndex) => (
        <Card
          key={question.id}
          className={cn(
            'cursor-pointer transition-all hover:ring-1 hover:ring-primary/30',
            selectedQuestionId === question.id && 'ring-2 ring-primary'
          )}
          onClick={() => selectQuestion(question.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start gap-2">
              <span className="text-sm font-medium">
                {qIndex + 1}. {question.title}
              </span>
              {question.required && (
                <span className="text-destructive text-sm">*</span>
              )}
            </div>
            {question.description && (
              <p className="text-sm text-muted-foreground">{question.description}</p>
            )}
          </CardHeader>
          <CardContent>
            <QuestionPreview question={question} />
          </CardContent>
        </Card>
      ))}

      <QuestionTypeSelector pageIndex={activePage}>
        <Button variant="outline" className="w-full border-dashed gap-2">
          <span className="text-lg leading-none">+</span>
          Agregar pregunta
        </Button>
      </QuestionTypeSelector>
    </div>
  )
}
