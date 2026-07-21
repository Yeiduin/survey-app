'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Edit, MoreHorizontal, Trash2, Copy, BarChart3, Eye } from 'lucide-react'
import { toast } from 'sonner'

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  published: { label: 'Publicada', variant: 'default' },
  paused: { label: 'Pausada', variant: 'outline' },
  closed: { label: 'Cerrada', variant: 'destructive' },
  archived: { label: 'Archivada', variant: 'outline' },
}

export function SurveyList({ surveys }: { surveys: any[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta encuesta? Esta acción no se puede deshacer.')) return
    
    try {
      const res = await fetch(`/api/surveys/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al eliminar')
      toast.success('Encuesta eliminada')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleDuplicate = async (survey: any) => {
    try {
      const res = await fetch(`/api/surveys/${survey.id}/duplicate`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al duplicar')
      toast.success('Encuesta duplicada')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al duplicar')
    }
  }

  if (surveys.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No tienes encuestas aún</p>
          <Link href="/dashboard/surveys/new">
            <Button>Crear tu primera encuesta</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {surveys.map((survey) => {
        const status = statusLabels[survey.status] || statusLabels.draft
        return (
          <Card key={survey.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{survey.title}</CardTitle>
                  {survey.description && (
                    <CardDescription className="line-clamp-1">{survey.description}</CardDescription>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/surveys/${survey.id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/surveys/${survey.id}/results`)}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Resultados
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDuplicate(survey)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(survey.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardFooter className="pt-0">
              <div className="flex items-center justify-between w-full">
                <Badge variant={status.variant}>{status.label}</Badge>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => window.open(`/s/${survey.slug || survey.id}`, '_blank')}>
                    <Eye className="h-4 w-4 mr-1" />
                    Vista
                  </Button>
                </div>
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
