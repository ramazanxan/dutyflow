import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, SearchX } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useJoinWorkspace } from '@/hooks/useWorkspaces'
import { workspaceCategoryIcon } from '@/lib/constants'
import { previewWorkspace } from '@/services/workspaces'

export default function JoinWorkspace() {
  const { code: codeFromLink } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const join = useJoinWorkspace()

  const [input, setInput] = useState(codeFromLink ?? '')
  const [submittedCode, setSubmittedCode] = useState(codeFromLink ?? '')

  const preview = useQuery({
    queryKey: ['workspace-preview', submittedCode],
    queryFn: () => previewWorkspace(submittedCode),
    enabled: submittedCode.length > 0,
    retry: false,
  })

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSubmittedCode(input.trim().toUpperCase())
  }

  async function handleJoin() {
    const workspaceId = await join.mutateAsync(submittedCode)
    navigate(`/w/${workspaceId}`)
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 py-8">
      <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm">
        <ArrowLeft className="size-4" />
        Назад
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Вступить в группу</h1>

      <form onSubmit={handleSearch} className="flex flex-col gap-3">
        <label htmlFor="code" className="text-sm font-medium">
          Код приглашения
        </label>
        <Input
          id="code"
          value={input}
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          placeholder="8F4K2X"
          maxLength={6}
          autoFocus={!codeFromLink}
          className="text-center font-mono text-2xl tracking-[0.2em]"
        />
        <Button type="submit" variant="secondary" disabled={input.trim().length === 0}>
          Найти группу
        </Button>
      </form>

      {preview.isFetching && <div className="bg-muted h-28 animate-pulse rounded-2xl" />}

      {preview.isError && (
        <p className="text-destructive text-sm">
          Не удалось проверить код. Проверьте интернет и попробуйте ещё раз.
        </p>
      )}

      {preview.isSuccess && !preview.data && (
        <div className="bg-card flex flex-col items-center gap-2 rounded-2xl border p-6 text-center">
          <SearchX className="text-muted-foreground size-8" />
          <p className="font-medium">Группа не найдена</p>
          <p className="text-muted-foreground text-sm">Проверьте код и попробуйте ещё раз</p>
        </div>
      )}

      {preview.data && (
        <div className="flex flex-col gap-4">
          <div className="bg-card flex items-center gap-4 rounded-2xl border p-4">
            <span className="bg-secondary flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl">
              {workspaceCategoryIcon(preview.data.category)}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{preview.data.name}</span>
              <span className="text-muted-foreground block text-sm">
                {preview.data.memberCount} уже в группе
              </span>
            </span>
          </div>

          {join.isError && (
            <p className="text-destructive text-sm">
              Не удалось вступить в группу. Попробуйте ещё раз.
            </p>
          )}

          <Button size="lg" onClick={handleJoin} disabled={join.isPending}>
            {join.isPending ? 'Вступаем…' : 'Вступить в группу'}
          </Button>
        </div>
      )}
    </main>
  )
}
