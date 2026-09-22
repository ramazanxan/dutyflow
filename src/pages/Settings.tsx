import { ArrowLeft, Check, Monitor, Moon, Sun, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor },
]

export default function Settings() {
  const { profile, saveName } = useAuth()
  const { theme, setTheme } = useTheme()

  const [name, setName] = useState(profile?.display_name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDirty = name.trim() !== profile?.display_name && name.trim().length > 0

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!isDirty || isSaving) return

    setIsSaving(true)
    setError(null)

    try {
      await saveName(name)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError('Не удалось сохранить имя. Проверьте интернет и попробуйте ещё раз.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-5 py-8 pb-24 sm:pb-8">
        <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
          <ArrowLeft className="size-4" />
          Главная
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight">Настройки</h1>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Имя</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              aria-label="Ваше имя"
            />

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" disabled={!isDirty || isSaving} className="self-start">
              {saved && <Check className="size-4" />}
              {isSaving ? 'Сохраняем…' : saved ? 'Сохранено' : 'Сохранить'}
            </Button>
          </form>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Оформление</h2>

          <div className="grid grid-cols-3 gap-2">
            {THEMES.map((option) => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors',
                  theme === option.value
                    ? 'border-primary bg-accent font-medium'
                    : 'bg-card hover:bg-accent',
                )}
              >
                <option.icon className="size-5" />
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-semibold">Доступ</h2>

          <div className="bg-card flex gap-3 rounded-2xl border p-4">
            <TriangleAlert className="text-priority-high size-5 shrink-0" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Вход привязан к этому браузеру — пароля нет. Если очистить данные сайта, доступ к
              группам потеряется, и вернуть его будет нельзя. Чтобы зайти с другого устройства,
              попросите код приглашения и вступите в группу заново.
            </p>
          </div>
        </section>
      </main>

      <BottomNav />
    </>
  )
}
