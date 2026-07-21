'use client'

import { useEditorStore } from '@/stores/survey-editor-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, GripVertical, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageList() {
  const survey = useEditorStore((s) => s.survey)
  const activePage = useEditorStore((s) => s.activePage)
  const setActivePage = useEditorStore((s) => s.setActivePage)
  const addPage = useEditorStore((s) => s.addPage)
  const removePage = useEditorStore((s) => s.removePage)
  const updatePage = useEditorStore((s) => s.updatePage)

  if (!survey) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Páginas</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={addPage}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {survey.pages.map((page, index) => (
        <div
          key={page.id}
          className={cn(
            'p-3 rounded-lg border cursor-pointer transition-colors',
            activePage === index
              ? 'border-primary bg-primary/5'
              : 'hover:bg-muted'
          )}
          onClick={() => setActivePage(index)}
        >
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={page.title}
              onChange={(e) => updatePage(index, { title: e.target.value })}
              placeholder={`Página ${index + 1}`}
              className="h-7 text-sm border-none shadow-none p-0 focus-visible:ring-0"
              onClick={(e) => e.stopPropagation()}
            />
            {survey.pages.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  removePage(index)
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {page.questions.length} pregunta{page.questions.length !== 1 ? 's' : ''}
          </p>
        </div>
      ))}
    </div>
  )
}
