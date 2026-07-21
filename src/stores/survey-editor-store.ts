import { create } from 'zustand'

export interface EditorQuestion {
  id: string
  type: string
  title: string
  description: string
  required: boolean
  position: number
  settings: Record<string, any>
  validation: Record<string, any>
  options: EditorOption[]
}

export interface EditorOption {
  id: string
  label: string
  value: string
  position: number
}

export interface EditorPage {
  id: string
  title: string
  description: string
  position: number
  questions: EditorQuestion[]
}

export interface EditorSurvey {
  id: string
  title: string
  description: string
  status: string
  pages: EditorPage[]
  settings: Record<string, any>
  theme: Record<string, any>
}

interface SurveyEditorState {
  survey: EditorSurvey | null
  activePage: number
  selectedQuestionId: string | null
  isDirty: boolean
  isSaving: boolean

  setSurvey: (survey: EditorSurvey) => void
  setActivePage: (page: number) => void
  selectQuestion: (id: string | null) => void

  updateTitle: (title: string) => void
  updateDescription: (description: string) => void
  updateSettings: (settings: Record<string, any>) => void
  updateTheme: (theme: Record<string, any>) => void

  addPage: () => void
  removePage: (pageIndex: number) => void
  updatePage: (pageIndex: number, data: Partial<EditorPage>) => void
  reorderPages: (fromIndex: number, toIndex: number) => void

  addQuestion: (pageIndex: number, type: string) => void
  removeQuestion: (pageIndex: number, questionId: string) => void
  updateQuestion: (pageIndex: number, questionId: string, data: Partial<EditorQuestion>) => void
  reorderQuestions: (pageIndex: number, fromIndex: number, toIndex: number) => void
  duplicateQuestion: (pageIndex: number, questionId: string) => void

  addOption: (pageIndex: number, questionId: string) => void
  removeOption: (pageIndex: number, questionId: string, optionId: string) => void
  updateOption: (pageIndex: number, questionId: string, optionId: string, data: Partial<EditorOption>) => void

  markDirty: () => void
  markClean: () => void
  setSaving: (saving: boolean) => void
}

// Quick UUID generator
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const defaultQuestion = (type: string, position: number): EditorQuestion => ({
  id: generateId(),
  type,
  title: type === 'info_block' ? 'Bloque informativo' : 'Nueva pregunta',
  description: '',
  required: false,
  position,
  settings: {},
  validation: {},
  options: type === 'single_choice' || type === 'multiple_choice' || type === 'dropdown'
    ? [
        { id: generateId(), label: 'Opción 1', value: 'opcion_1', position: 0 },
        { id: generateId(), label: 'Opción 2', value: 'opcion_2', position: 1 },
      ]
    : [],
})

const defaultPage = (position: number): EditorPage => ({
  id: generateId(),
  title: '',
  description: '',
  position,
  questions: [],
})

export const useEditorStore = create<SurveyEditorState>((set, get) => ({
  survey: null,
  activePage: 0,
  selectedQuestionId: null,
  isDirty: false,
  isSaving: false,

  setSurvey: (survey) => {
    if (!survey.pages || survey.pages.length === 0) {
      survey.pages = [defaultPage(0)]
    }
    set({ survey, isDirty: false })
  },

  setActivePage: (page) => set({ activePage: page, selectedQuestionId: null }),
  selectQuestion: (id) => set({ selectedQuestionId: id }),

  updateTitle: (title) => {
    const survey = get().survey
    if (!survey) return
    set({ survey: { ...survey, title }, isDirty: true })
  },

  updateDescription: (description) => {
    const survey = get().survey
    if (!survey) return
    set({ survey: { ...survey, description }, isDirty: true })
  },

  updateSettings: (settings) => {
    const survey = get().survey
    if (!survey) return
    set({ survey: { ...survey, settings: { ...survey.settings, ...settings } }, isDirty: true })
  },

  updateTheme: (theme) => {
    const survey = get().survey
    if (!survey) return
    set({ survey: { ...survey, theme: { ...survey.theme, ...theme } }, isDirty: true })
  },

  addPage: () => {
    const survey = get().survey
    if (!survey) return
    const newPage = defaultPage(survey.pages.length)
    set({
      survey: { ...survey, pages: [...survey.pages, newPage] },
      activePage: survey.pages.length,
      isDirty: true,
    })
  },

  removePage: (pageIndex) => {
    const survey = get().survey
    if (!survey || survey.pages.length <= 1) return
    const pages = survey.pages.filter((_, i) => i !== pageIndex)
    set({
      survey: { ...survey, pages },
      activePage: Math.min(pageIndex, pages.length - 1),
      isDirty: true,
    })
  },

  updatePage: (pageIndex, data) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    pages[pageIndex] = { ...pages[pageIndex], ...data }
    set({ survey: { ...survey, pages }, isDirty: true })
  },

  reorderPages: (fromIndex, toIndex) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    const [moved] = pages.splice(fromIndex, 1)
    pages.splice(toIndex, 0, moved)
    set({ survey: { ...survey, pages }, isDirty: true })
  },

  addQuestion: (pageIndex, type) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    const questions = [...pages[pageIndex].questions]
    const newQuestion = defaultQuestion(type, questions.length)
    pages[pageIndex] = { ...pages[pageIndex], questions: [...questions, newQuestion] }
    set({ survey: { ...survey, pages }, selectedQuestionId: newQuestion.id, isDirty: true })
  },

  removeQuestion: (pageIndex, questionId) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    pages[pageIndex] = {
      ...pages[pageIndex],
      questions: pages[pageIndex].questions.filter((q) => q.id !== questionId),
    }
    set({ survey: { ...survey, pages }, selectedQuestionId: null, isDirty: true })
  },

  updateQuestion: (pageIndex, questionId, data) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    pages[pageIndex] = {
      ...pages[pageIndex],
      questions: pages[pageIndex].questions.map((q) =>
        q.id === questionId ? { ...q, ...data } : q
      ),
    }
    set({ survey: { ...survey, pages }, isDirty: true })
  },

  reorderQuestions: (pageIndex, fromIndex, toIndex) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    const questions = [...pages[pageIndex].questions]
    const [moved] = questions.splice(fromIndex, 1)
    questions.splice(toIndex, 0, moved)
    pages[pageIndex] = { ...pages[pageIndex], questions }
    set({ survey: { ...survey, pages }, isDirty: true })
  },

  duplicateQuestion: (pageIndex, questionId) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    const question = pages[pageIndex].questions.find((q) => q.id === questionId)
    if (!question) return
    const newQuestion: EditorQuestion = {
      ...JSON.parse(JSON.stringify(question)),
      id: generateId(),
      title: `${question.title} (copia)`,
      position: question.position + 1,
      options: question.options.map((opt) => ({
        ...opt,
        id: generateId(),
      })),
    }
    const questions = [...pages[pageIndex].questions]
    questions.splice(question.position + 1, 0, newQuestion)
    pages[pageIndex] = { ...pages[pageIndex], questions }
    set({ survey: { ...survey, pages }, isDirty: true })
  },

  addOption: (pageIndex, questionId) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    const question = pages[pageIndex].questions.find((q) => q.id === questionId)
    if (!question) return
    const position = question.options.length
    const newOption: EditorOption = {
      id: generateId(),
      label: `Opción ${position + 1}`,
      value: `opcion_${position + 1}`,
      position,
    }
    const options = [...question.options, newOption]
    const questions = pages[pageIndex].questions.map((q) =>
      q.id === questionId ? { ...q, options } : q
    )
    pages[pageIndex] = { ...pages[pageIndex], questions }
    set({ survey: { ...survey, pages }, isDirty: true })
  },

  removeOption: (pageIndex, questionId, optionId) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    const questions = pages[pageIndex].questions.map((q) =>
      q.id === questionId
        ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
        : q
    )
    pages[pageIndex] = { ...pages[pageIndex], questions }
    set({ survey: { ...survey, pages }, isDirty: true })
  },

  updateOption: (pageIndex, questionId, optionId, data) => {
    const survey = get().survey
    if (!survey) return
    const pages = [...survey.pages]
    const questions = pages[pageIndex].questions.map((q) =>
      q.id === questionId
        ? {
            ...q,
            options: q.options.map((o) =>
              o.id === optionId ? { ...o, ...data } : o
            ),
          }
        : q
    )
    pages[pageIndex] = { ...pages[pageIndex], questions }
    set({ survey: { ...survey, pages }, isDirty: true })
  },

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
  setSaving: (saving) => set({ isSaving: saving }),
}))
