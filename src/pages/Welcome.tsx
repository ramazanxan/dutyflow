import { CheckCircle2, ListChecks, Users } from 'lucide-react'

export default function Welcome() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-2xl shadow-lg">
          <ListChecks className="size-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">DutyFlow</h1>
        <p className="text-muted-foreground max-w-sm text-balance">
          Общие обязанности для семьи, квартиры, команды или учебной группы
        </p>
      </div>

      <div className="grid w-full max-w-md gap-3">
        <FeatureRow icon={<Users className="size-5" />} text="Группа по коду приглашения, без регистрации" />
        <FeatureRow icon={<ListChecks className="size-5" />} text="Задачи с дедлайнами, повторами и напоминаниями" />
        <FeatureRow icon={<CheckCircle2 className="size-5" />} text="XP за выполнение и общая статистика" />
      </div>

      <p className="text-muted-foreground text-sm">Этап 1 — каркас проекта готов</p>
    </main>
  )
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="bg-card flex items-center gap-3 rounded-xl border p-4">
      <span className="text-primary">{icon}</span>
      <span className="text-card-foreground text-sm">{text}</span>
    </div>
  )
}
