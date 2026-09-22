import { Loader2 } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useNotificationsRealtime } from '@/hooks/useNotifications'
import CreateWorkspace from '@/pages/CreateWorkspace'
import Notifications from '@/pages/Notifications'
import JoinWorkspace from '@/pages/JoinWorkspace'
import Members from '@/pages/Members'
import MemberStats from '@/pages/MemberStats'
import TaskDetail from '@/pages/TaskDetail'
import TaskForm from '@/pages/TaskForm'
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
    return <Welcome />
  }

  return (
    <Routes>
      <Route path="/" element={<Workspaces />} />
      <Route path="/create" element={<CreateWorkspace />} />
      <Route path="/join" element={<JoinWorkspace />} />
      <Route path="/join/:code" element={<JoinWorkspace />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/w/:workspaceId" element={<WorkspaceDashboard />} />
      <Route path="/w/:workspaceId/members" element={<Members />} />
      <Route path="/w/:workspaceId/member/:userId" element={<MemberStats />} />
      <Route path="/w/:workspaceId/task/new" element={<TaskForm />} />
      <Route path="/w/:workspaceId/task/:taskId" element={<TaskDetail />} />
      <Route path="/w/:workspaceId/task/:taskId/edit" element={<TaskForm />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
