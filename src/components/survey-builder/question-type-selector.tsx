'use client'

import { useState } from 'react'
import { useEditorStore } from '@/stores/survey-editor-store'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Type,
  AlignLeft,
  Mail,
  Hash,
  Phone,
  Link,
  Circle,
  CheckSquare,
  ChevronDown,
  Star,
  Heart,
  Calendar,
  Clock,
  Upload,
  FileText,
  List,
  Table,
  GripHorizontal,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuestionTypeItem {
  type: string
  label: string
  icon: React.ReactNode
  category: string
}

const questionTypes: QuestionTypeItem[] = [
  // Texto
  { type: 'short_text', label: 'Texto corto', icon: <Type className="h-4 w-4" />, category: 'Texto' },
  { type: 'long_text', label: 'Texto largo', icon: <AlignLeft className="h-4 w-4" />, category: 'Texto' },
  { type: 'email', label: 'Correo electrónico', icon: <Mail className="h-4 w-4" />, category: 'Texto' },
  { type: 'number', label: 'Número', icon: <Hash className="h-4 w-4" />, category: 'Texto' },
  { type: 'phone', label: 'Teléfono', icon: <Phone className="h-4 w-4" />, category: 'Texto' },
  { type: 'url', label: 'URL', icon: <Link className="h-4 w-4" />, category: 'Texto' },
  // Selección
  { type: 'single_choice', label: 'Selección única', icon: <Circle className="h-4 w-4" />, category: 'Selección' },
  { type: 'multiple_choice', label: 'Selección múltiple', icon: <CheckSquare className="h-4 w-4" />, category: 'Selección' },
  { type: 'dropdown', label: 'Lista desplegable', icon: <ChevronDown className="h-4 w-4" />, category: 'Selección' },
  { type: 'yes_no', label: 'Sí / No', icon: <Circle className="h-4 w-4" />, category: 'Selección' },
  // Valoración
  { type: 'rating', label: 'Escala de valoración', icon: <Star className="h-4 w-4" />, category: 'Valoración' },
  { type: 'nps', label: 'NPS (0-10)', icon: <Heart className="h-4 w-4" />, category: 'Valoración' },
  // Fecha
  { type: 'date', label: 'Fecha', icon: <Calendar className="h-4 w-4" />, category: 'Fecha' },
  { type: 'time', label: 'Hora', icon: <Clock className="h-4 w-4" />, category: 'Fecha' },
  // Información
  { type: 'info_block', label: 'Bloque informativo', icon: <FileText className="h-4 w-4" />, category: 'Información' },
  { type: 'file_upload', label: 'Subida de archivo', icon: <Upload className="h-4 w-4" />, category: 'Información' },
]

const categories = ['Texto', 'Selección', 'Valoración', 'Fecha', 'Información']

export default function QuestionTypeSelector({
  pageIndex,
  children,
}: {
  pageIndex: number
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const addQuestion = useEditorStore((s) => s.addQuestion)

  const handleSelect = (type: string) => {
    addQuestion(pageIndex, type)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children || (
          <Button variant="outline" className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Agregar pregunta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar pregunta</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {categories.map((category) => {
            const items = questionTypes.filter((qt) => qt.category === category)
            if (items.length === 0) return null
            return (
              <div key={category}>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {items.map((item) => (
                    <button
                      key={item.type}
                      onClick={() => handleSelect(item.type)}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors text-left"
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
