import { ListChecks, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'

export default function Welcome() {
  const { saveName } = useAuth()
  const [name, setName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      await saveName(name)
    } catch {
      setError('Не удалось войти. Проверьте интернет и попробуйте ещё раз.')
      setIsSaving(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl shadow-lg">
            <ListChecks className="size-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Добро пожаловать 👋</h1>
          <p className="text-muted-foreground text-balance">
            DutyFlow — общие обязанности для семьи, квартиры или команды
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
          <label htmlFor="name" className="text-sm font-medium">
            Как тебя зовут?
          </label>
          <Input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, Рамазан"
            maxLength={40}
            autoComplete="name"
            autoFocus
            disabled={isSaving}
          />

          {error && <p className="text-destructive text-sm">{error}</p>}

          <Button type="submit" size="lg" disabled={!name.trim() || isSaving}>
            {isSaving ? 'Входим…' : 'Продолжить'}
          </Button>
        </form>

        <p className="text-muted-foreground mt-8 flex gap-2 text-xs leading-relaxed">
          <TriangleAlert className="text-priority-high size-6 shrink-0" />
          Регистрация не нужна — вход привязан к этому браузеру. Не очищайте данные сайта, иначе
          потеряете доступ к своим группам.
        </p>
      </div>
    </main>
  )
}
