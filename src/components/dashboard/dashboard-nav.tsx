'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  LogOut,
  Settings,
  FileText,
  BarChart3,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/surveys', label: 'Encuestas', icon: ClipboardList },
]

export function DashboardNav({ user }: { user: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = user?.display_name
    ? user.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  return (
    <aside className="w-64 border-r bg-card hidden lg:flex flex-col">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg">
          <ClipboardList className="h-5 w-5 text-primary" />
          SurveyApp
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === item.href
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t space-y-2">
        <Link href="/dashboard/profile">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="text-left truncate">
              <p className="text-sm font-medium truncate">{user?.display_name || 'Usuario'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  )
}
