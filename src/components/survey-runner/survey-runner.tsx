'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Send } from 'lucide-react'

interface SurveyRunnerProps {
  survey: any
  version: any
}

type Answers = Record<string, string | string[] | number | boolean | null>

function getDefaultAnswer(type: string): string | string[] | null {
  const textTypes = ['short_text', 'long_text', 'email', 'url', 'phone', 'date', 'time', 'number']
  if (textTypes.includes(type)) return ''
  if (type === 'multiple_choice') return []
  return null
}

export function SurveyRunner({ survey, version }: SurveyRunnerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const pages = version?.survey_pages?.sort((a: any, b: any) => a.position - b.position) || []
  const flatQuestions = pages.flatMap((page: any) => 
    page.questions?.sort((a: any, b: any) => a.position - b.position) || []
  )

  const totalPages = pages.length || 1
  const progress = totalPages > 1 ? ((currentPage + 1) / totalPages) * 100 : 0

  const updateAnswer = useCallback((questionId: string, value: string | string[] | boolean | number | null) => {
    if (value !== null) {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
    }
  }, [])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await supabase.from('responses').insert({
        survey_id: survey.id,
        survey_version_id: version?.id,
        status: 'completed',
        metadata: {
          user_agent: navigator.userAgent,
        },
      })
      setSubmitted(true)
      toast.success('Respuesta enviada correctamente')
    } catch {
      toast.error('Error al enviar la respuesta')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl">¡Respuesta enviada!</CardTitle>
            <CardDescription>
              Gracias por completar la encuesta. Tu respuesta ha sido registrada.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (survey.status === 'paused' || survey.status === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Encuesta cerrada</CardTitle>
            <CardDescription>
              Esta encuesta no está aceptando respuestas en este momento.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentPageQuestions = pages[currentPage]?.questions || flatQuestions
  const isLastPage = currentPage >= totalPages - 1

  const renderQuestion = (question: any) => {
    const value = answers[question.id] ?? getDefaultAnswer(question.type)
    const hasOptions = ['single_choice', 'multiple_choice', 'dropdown', 'yes_no'].includes(question.type)

    return (
      <div key={question.id}>
        <div className="mb-3">
          <p className="text-sm font-medium">
            {question.title}
            {question.required && <span className="text-destructive ml-1">*</span>}
          </p>
          {question.description && (
            <p className="text-sm text-muted-foreground mt-1">{question.description}</p>
          )}
        </div>

        {question.type === 'short_text' && (
          <Input
            value={value as string || ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.settings?.placeholder || ''}
          />
        )}

        {question.type === 'long_text' && (
          <Textarea
            value={value as string || ''}
            onChange={(e) => updateAnswer(question.id, e.target.value)}
            placeholder={question.settings?.placeholder || ''}
            rows={3}
          />
        )}

        {question.type === 'email' && (
          <Input type="email" value={value as string || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} placeholder="correo@ejemplo.com" />
        )}

        {question.type === 'number' && (
          <Input type="number" value={value as string || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} />
        )}

        {question.type === 'phone' && (
          <Input type="tel" value={value as string || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} />
        )}

        {question.type === 'url' && (
          <Input type="url" value={value as string || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} placeholder="https://" />
        )}

        {question.type === 'single_choice' && (
          <RadioGroup value={value as string || ''} onValueChange={(val) => updateAnswer(question.id, val)}>
            {question.question_options?.sort((a: any, b: any) => a.position - b.position).map((opt: any) => (
              <div key={opt.id} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={opt.id} />
                <Label htmlFor={opt.id}>{opt.label}</Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {question.type === 'multiple_choice' && (
          <div className="space-y-2">
            {question.question_options?.sort((a: any, b: any) => a.position - b.position).map((opt: any) => (
              <div key={opt.id} className="flex items-center gap-2">
                <Checkbox
                  id={opt.id}
                  checked={Array.isArray(value) && value.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(value) ? [...value] : []
                    if (checked) {
                      updateAnswer(question.id, [...current, opt.value])
                    } else {
                      updateAnswer(question.id, current.filter((v: string) => v !== opt.value))
                    }
                  }}
                />
                <Label htmlFor={opt.id}>{opt.label}</Label>
              </div>
            ))}
          </div>
        )}

        {question.type === 'dropdown' && (
          <Select value={value as string || ''} onValueChange={(val) => updateAnswer(question.id, val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una opción" />
            </SelectTrigger>
            <SelectContent>
              {question.question_options?.sort((a: any, b: any) => a.position - b.position).map((opt: any) => (
                <SelectItem key={opt.id} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {question.type === 'yes_no' && (
          <RadioGroup value={value as string || ''} onValueChange={(val) => updateAnswer(question.id, val)}>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="si" id={`${question.id}-si`} />
              <Label htmlFor={`${question.id}-si`}>Sí</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="no" id={`${question.id}-no`} />
              <Label htmlFor={`${question.id}-no`}>No</Label>
            </div>
          </RadioGroup>
        )}

        {question.type === 'rating' && (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Button
                key={n}
                variant={value === n ? 'default' : 'outline'}
                size="sm"
                className="h-10 w-10"
                onClick={() => updateAnswer(question.id, n)}
              >
                {n}
              </Button>
            ))}
          </div>
        )}

        {question.type === 'nps' && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <Button
                  key={n}
                  variant={value === n ? 'default' : 'outline'}
                  size="sm"
                  className="h-10 w-9 text-xs p-0"
                  onClick={() => updateAnswer(question.id, n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Nada probable</span>
              <span>Extremadamente probable</span>
            </div>
          </div>
        )}

        {question.type === 'date' && (
          <Input type="date" value={value as string || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} />
        )}

        {question.type === 'time' && (
          <Input type="time" value={value as string || ''} onChange={(e) => updateAnswer(question.id, e.target.value)} />
        )}

        {question.type === 'info_block' && (
          <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
            {question.description || question.title}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {totalPages > 1 && (
          <div className="mb-8">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              Página {currentPage + 1} de {totalPages}
            </p>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{survey.title}</CardTitle>
            {survey.description && (
              <CardDescription>{survey.description}</CardDescription>
            )}
          </CardHeader>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-6">
            {currentPageQuestions.map((question: any) => (
              <div key={question.id}>{renderQuestion(question)}</div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          {currentPage > 0 ? (
            <Button variant="outline" onClick={() => setCurrentPage((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          ) : <div />}

          {isLastPage ? (
            <Button onClick={handleSubmit} disabled={loading}>
              <Send className="h-4 w-4 mr-1" />
              {loading ? 'Enviando...' : 'Enviar respuestas'}
            </Button>
          ) : (
            <Button onClick={() => setCurrentPage((p) => p + 1)}>
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
