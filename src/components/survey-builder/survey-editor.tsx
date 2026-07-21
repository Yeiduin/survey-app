'use client'

import { useEffect } from 'react'
import { useEditorStore } from '@/stores/survey-editor-store'
import { EditorToolbar } from './editor-toolbar'
import { PageList } from './page-list'
import { QuestionEditor } from './question-editor'
import QuestionTypeSelector from './question-type-selector'
import { BuilderPreview } from './builder-preview'

interface SurveyEditorProps {
  survey: any
}

export function SurveyEditor({ survey }: SurveyEditorProps) {
  const setSurvey = useEditorStore((s) => s.setSurvey)

  useEffect(() => {
    if (survey) {
      const editorSurvey = {
        id: survey.id,
        title: survey.title,
        description: survey.description || '',
        status: survey.status || 'draft',
        pages: survey.pages || [],
        settings: survey.settings || {},
        theme: survey.theme || {},
      }
      setSurvey(editorSurvey)
    }
  }, [survey, setSurvey])

  return (
    <div className="h-full flex flex-col">
      <EditorToolbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 border-r bg-muted/20 overflow-y-auto p-4 space-y-4">
          <PageList />
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <BuilderPreview />
        </div>
        <div className="w-96 border-l overflow-y-auto p-4">
          <QuestionEditor />
        </div>
      </div>
    </div>
  )
}
