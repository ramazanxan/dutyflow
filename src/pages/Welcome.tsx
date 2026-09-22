import { ListChecks, TriangleAlert } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { signInWithEmail } from '@/services/account'

export default function Welcome() {
  const { saveName } = useAuth()
  const [mode, setMode] = useState<'name' | 'signin'>('name')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || isBusy) return

    setIsBusy(true)
    setError(null)

    try {
      await saveName(name)
    } catch {
      setError('Не удалось войти. Проверьте интернет и попробуйте ещё раз.')
      setIsBusy(false)
    }
  }

  async function handleSignIn(event: FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password || isBusy) return

    setIsBusy(true)
    setError(null)

    try {
      await signInWithEmail(email, password)
    } catch {
      setError('Неверная почта или пароль.')
      setIsBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl shadow-lg">
            <ListChecks className="size-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === 'name' ? 'Добро пожаловать 👋' : 'С возвращением'}
          </h1>
          <p className="text-muted-foreground text-balance">
            {mode === 'name'
              ? 'DutyFlow — общие обязанности для семьи, квартиры или команды'
              : 'Войдите по почте, которую привязали к аккаунту'}
          </p>
        </div>

        {mode === 'name' ? (
          <form onSubmit={handleStart} className="mt-8 flex flex-col gap-3">
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
              disabled={isBusy}
            />

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" size="lg" disabled={!name.trim() || isBusy}>
              {isBusy ? 'Входим…' : 'Продолжить'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="mt-8 flex flex-col gap-3">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Почта"
              autoComplete="email"
              aria-label="Почта"
              autoFocus
              disabled={isBusy}
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Пароль"
              autoComplete="current-password"
              aria-label="Пароль"
              disabled={isBusy}
            />

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" size="lg" disabled={!email.trim() || !password || isBusy}>
              {isBusy ? 'Входим…' : 'Войти'}
            </Button>
          </form>
        )}

        <button
          onClick={() => {
            setMode(mode === 'name' ? 'signin' : 'name')
            setError(null)
          }}
          className="text-muted-foreground hover:text-foreground mt-4 w-full text-center text-sm"
        >
          {mode === 'name' ? 'Уже привязывали почту? Войти' : 'Я здесь впервые'}
        </button>

        {mode === 'name' && (
          <p className="text-muted-foreground mt-8 flex gap-2 text-xs leading-relaxed">
            <TriangleAlert className="text-priority-high size-6 shrink-0" />
            Регистрация не нужна — вход привязан к этому браузеру. Позже в настройках можно
            привязать почту, чтобы заходить с других устройств.
          </p>
        )}
      </div>
    </main>
  )
}
