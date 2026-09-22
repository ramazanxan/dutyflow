import { Loader2 } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationsRealtime } from '@/hooks/useNotifications'
import Board from '@/pages/Board'
import Calendar from '@/pages/Calendar'
import CreateWorkspace from '@/pages/CreateWorkspace'
import JoinWorkspace from '@/pages/JoinWorkspace'
import Members from '@/pages/Members'
import MemberStats from '@/pages/MemberStats'
import Notifications from '@/pages/Notifications'
import Settings from '@/pages/Settings'
import TaskDetail from '@/pages/TaskDetail'
import TaskForm from '@/pages/TaskForm'
import Templates from '@/pages/Templates'
import Welcome from '@/pages/Welcome'
import WorkspaceDashboard from '@/pages/WorkspaceDashboard'
import Workspaces from '@/pages/Workspaces'

export default function App() {
  const { profile, isLoading } = useAuth()

  useNotificationsRealtime()

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  // Адрес не меняем: после ввода имени пользователь попадёт туда, куда шёл —
  // например, по ссылке-приглашению #/join/КОД
  if (!profile) {
    return (
      <>
        <OfflineBanner />
        <Welcome />
      </>
    )
  }

  return (
    <>
      <OfflineBanner />

      <Routes>
        <Route path="/" element={<Workspaces />} />
        <Route path="/create" element={<CreateWorkspace />} />
        <Route path="/join" element={<JoinWorkspace />} />
        <Route path="/join/:code" element={<JoinWorkspace />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/w/:workspaceId" element={<WorkspaceDashboard />} />
        <Route path="/w/:workspaceId/board" element={<Board />} />
        <Route path="/w/:workspaceId/calendar" element={<Calendar />} />
        <Route path="/w/:workspaceId/members" element={<Members />} />
        <Route path="/w/:workspaceId/templates" element={<Templates />} />
        <Route path="/w/:workspaceId/member/:userId" element={<MemberStats />} />
        <Route path="/w/:workspaceId/task/new" element={<TaskForm />} />
        <Route path="/w/:workspaceId/task/:taskId" element={<TaskDetail />} />
        <Route path="/w/:workspaceId/task/:taskId/edit" element={<TaskForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
