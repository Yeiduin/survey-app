'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { Download, FileJson, FileSpreadsheet, ClipboardCopy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

interface ResultsPanelProps {
  survey: any
  responses: any[]
}

export function ResultsPanel({ survey, responses }: ResultsPanelProps) {
  const completedResponses = responses.filter((r) => r.status === 'completed')
  const totalResponses = responses.length

  const stats = useMemo(() => {
    if (completedResponses.length === 0) return null

    const questionsMap = new Map()
    const questionTypes = new Map()
    const answerCounts = new Map()

    completedResponses.forEach((response) => {
      (response.answers || []).forEach((answer: any) => {
        if (!answer.question_id) return

        if (!answerCounts.has(answer.question_id)) {
          answerCounts.set(answer.question_id, new Map())
        }
        const counts = answerCounts.get(answer.question_id)
        const val = JSON.stringify(answer.value)
        counts.set(val, (counts.get(val) || 0) + 1)
      })
    })

    return { answerCounts, questionTypes }
  }, [completedResponses])

  const handleExportCSV = () => {
    const headers = ['response_id', 'status', 'submitted_at', ...(survey.questions?.map((q: any) => q.title) || [])]
    const rows = responses.map((r) => {
      const answersMap = new Map((r.answers || []).map((a: any) => [a.question_id, JSON.stringify(a.value)]))
      return [r.id, r.status, r.submitted_at, ...(survey.questions?.map((q: any) => answersMap.get(q.id) || '') || [])]
    })
    
    const csv = [headers.join(','), ...rows.map((r) => r.map((v: string) => `"${v || ''}"`).join(','))].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${survey.title.replace(/\s+/g, '_')}_resultados.csv`
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('CSV exportado')
  }

  const handleCopyJSON = () => {
    const json = JSON.stringify(responses, null, 2)
    navigator.clipboard.writeText(json)
    toast.success('JSON copiado al portapapeles')
  }

  if (totalResponses === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resultados</h1>
            <p className="text-muted-foreground">{survey.title}</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-lg mb-2">Sin respuestas aún</p>
            <p className="text-sm text-muted-foreground">
              Comparte tu encuesta para comenzar a recibir respuestas
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Resultados</h1>
          <p className="text-muted-foreground">{survey.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyJSON}>
            <ClipboardCopy className="h-4 w-4 mr-1" />
            JSON
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total respuestas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedResponses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de finalización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalResponses > 0
                ? Math.round((completedResponses.length / totalResponses) * 100)
                : 0}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Parciales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.filter((r) => r.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {stats && (
        <div className="grid gap-6">
          {Array.from(stats.answerCounts.entries()).slice(0, 10).map(([questionId, counts]) => {
            const data = Array.from((counts as Map<string, number>).entries()).map(([key, value]) => ({
              name: key.replace(/"/g, '').slice(0, 30),
              value,
            }))

            if (data.length === 0) return null

            return (
              <Card key={questionId}>
                <CardHeader>
                  <CardTitle className="text-sm">Pregunta {questionId.slice(0, 8)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Respuestas individuales</CardTitle>
          <CardDescription>{totalResponses} respuestas en total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {responses.slice(0, 20).map((response) => (
              <div key={response.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="text-sm">
                  {response.submitted_at
                    ? new Date(response.submitted_at).toLocaleDateString()
                    : 'En progreso'}
                </div>
                <Badge variant={response.status === 'completed' ? 'default' : 'secondary'}>
                  {response.status === 'completed' ? 'Completada' : 'En progreso'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
