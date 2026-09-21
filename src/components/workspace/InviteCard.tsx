import { Check, Copy, Share2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { inviteLink } from '@/lib/constants'

export function InviteCard({ code }: { code: string }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  async function copy(kind: 'code' | 'link') {
    await navigator.clipboard.writeText(kind === 'code' ? code : inviteLink(code))
    setCopied(kind)
    setTimeout(() => setCopied(null), 2000)
  }

  async function share() {
    const link = inviteLink(code)

    if (navigator.share) {
      try {
        await navigator.share({ title: 'DutyFlow', text: `Код группы: ${code}`, url: link })
        return
      } catch {
        // Пользователь закрыл системное окно «Поделиться» — просто копируем ссылку
      }
    }

    await copy('link')
  }

  return (
    <div className="bg-card flex flex-col items-center gap-4 rounded-2xl border p-6">
      <p className="text-muted-foreground text-sm">Код приглашения</p>

      <p className="font-mono text-4xl font-semibold tracking-[0.2em]">{code}</p>

      <div className="flex w-full flex-col gap-2 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={() => copy('code')}>
          {copied === 'code' ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied === 'code' ? 'Скопировано' : 'Скопировать код'}
        </Button>

        <Button className="flex-1" onClick={share}>
          {copied === 'link' ? <Check className="size-4" /> : <Share2 className="size-4" />}
          {copied === 'link' ? 'Ссылка скопирована' : 'Поделиться ссылкой'}
        </Button>
      </div>
    </div>
  )
}
