import { Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Dashboard() {
  const { profile } = useAuth()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Добро пожаловать, {profile?.display_name} 👋
        </h1>
      </header>

      <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border p-8 text-center">
        <Users className="text-muted-foreground size-10" />
        <p className="font-medium">У вас пока нет групп</p>
        <p className="text-muted-foreground text-sm text-balance">
          Создание групп и вход по коду приглашения появятся на следующем этапе
        </p>
      </div>
    </main>
  )
}
