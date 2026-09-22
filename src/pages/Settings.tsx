import {
  ArrowLeft,
  Check,
  KeyRound,
  LogOut,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  TriangleAlert,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { linkEmail, signOut } from '@/services/account'

const THEMES: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Светлая', icon: Sun },
  { value: 'dark', label: 'Тёмная', icon: Moon },
  { value: 'system', label: 'Системная', icon: Monitor },
]

export default function Settings() {
  const { profile, saveName, isAnonymous, email: linkedEmail } = useAuth()
  const { theme, setTheme } = useTheme()

  const [name, setName] = useState(profile?.display_name ?? '')
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLinking, setIsLinking] = useState(false)
  const [linkDone, setLinkDone] = useState<'confirmed' | 'pending' | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)

  async function handleLink(event: FormEvent) {
    event.preventDefault()
    if (isLinking) return

    setIsLinking(true)
    setLinkError(null)

    try {
      const { needsConfirmation } = await linkEmail(email, password)
      setLinkDone(needsConfirmation ? 'pending' : 'confirmed')
      setPassword('')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : ''
      setLinkError(
        message.toLowerCase().includes('already')
          ? 'Эта почта уже занята другим аккаунтом.'
          : 'Не удалось привязать почту. Проверьте адрес и попробуйте ещё раз.',
      )
    } finally {
      setIsLinking(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    location.hash = '#/'
  }

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

          {isAnonymous ? (
            <>
              <div className="bg-card flex gap-3 rounded-2xl border p-4">
                <TriangleAlert className="text-priority-high size-5 shrink-0" />
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Сейчас вход привязан только к этому браузеру. Если очистить данные сайта,
                  доступ к группам пропадёт безвозвратно. Привяжите почту — тот же аккаунт станет
                  доступен с любого устройства.
                </p>
              </div>

              <form onSubmit={handleLink} className="flex flex-col gap-3">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Почта"
                  autoComplete="email"
                  aria-label="Почта"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Пароль, минимум 8 символов"
                  autoComplete="new-password"
                  aria-label="Пароль"
                />

                {linkError && <p className="text-destructive text-sm">{linkError}</p>}

                {linkDone === 'pending' && (
                  <p className="text-status-done text-sm">
                    Осталось подтвердить адрес — мы отправили письмо со ссылкой. Пока вы её не
                    откроете, вход с других устройств не заработает.
                  </p>
                )}

                {linkDone === 'confirmed' && (
                  <p className="text-status-done text-sm">
                    Готово. Теперь можно входить по этой почте с любого устройства.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!email.trim() || password.length < 8 || isLinking}
                  className="self-start"
                >
                  <KeyRound className="size-4" />
                  {isLinking ? 'Привязываем…' : 'Привязать почту'}
                </Button>
              </form>
            </>
          ) : (
            <div className="bg-card flex flex-col gap-3 rounded-2xl border p-4">
              <p className="flex items-center gap-2 text-sm">
                <ShieldCheck className="text-status-done size-5 shrink-0" />
                Доступ сохранён: <span className="font-medium">{linkedEmail}</span>
              </p>
              <p className="text-muted-foreground text-sm">
                Можно входить с любого устройства по этой почте и паролю.
              </p>
              <Button variant="outline" onClick={handleSignOut} className="self-start">
                <LogOut className="size-4" />
                Выйти
              </Button>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </>
  )
}
