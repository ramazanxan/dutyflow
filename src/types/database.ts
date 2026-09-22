export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type MemberRole = 'owner' | 'admin' | 'member'
export type WorkspaceCategory = 'home' | 'work' | 'study' | 'other'
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type RecurrenceType =
  | 'none'
  | 'daily'
  | 'weekdays'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'custom_weekdays'
export type NotificationType =
  | 'task_assigned'
  | 'task_completed'
  | 'task_overdue'
  | 'task_reminder'
  | 'task_comment'
  | 'member_joined'

export type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Workspace = {
  id: string
  name: string
  description: string | null
  category: WorkspaceCategory
  owner_id: string
  invite_code: string
  created_at: string
  updated_at: string
}

export type WorkspaceMember = {
  id: string
  workspace_id: string
  user_id: string
  role: MemberRole
  joined_at: string
}

export type Category = {
  id: string
  workspace_id: string
  name: string
  icon: string | null
  created_at: string
}

export type Task = {
  id: string
  workspace_id: string
  title: string
  description: string | null
  created_by: string | null
  assigned_to: string | null
  category_id: string | null
  priority: TaskPriority
  status: TaskStatus
  due_at: string | null
  recurrence_type: RecurrenceType
  recurrence_config: Json
  reminder_minutes: number | null
  penalty_points: number
  rotation_user_ids: string[]
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskComment = {
  id: string
  task_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export type TaskHistoryEntry = {
  id: string
  workspace_id: string
  task_id: string | null
  actor_id: string | null
  action: string
  meta: Json
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  workspace_id: string | null
  task_id: string | null
  type: NotificationType
  title: string
  message: string | null
  is_read: boolean
  created_at: string
}

export type TaskTemplate = {
  id: string
  workspace_id: string
  name: string
  icon: string | null
  created_by: string | null
  created_at: string
}

export type TemplateTask = {
  id: string
  template_id: string
  title: string
  category_id: string | null
  priority: TaskPriority
  position: number
  created_at: string
}

export type PointsTransaction = {
  id: string
  workspace_id: string
  user_id: string
  task_id: string | null
  amount: number
  reason: string
  created_at: string
}

type Insertable<T, Required extends keyof T, Generated extends keyof T> = Pick<T, Required> &
  Partial<Omit<T, Required | Generated>>

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Insertable<Profile, 'id' | 'display_name', 'created_at' | 'updated_at'>
        Update: Partial<Profile>
        Relationships: []
      }
      workspaces: {
        Row: Workspace
        Insert: Insertable<
          Workspace,
          'name' | 'owner_id',
          'id' | 'invite_code' | 'created_at' | 'updated_at'
        >
        Update: Partial<Workspace>
        Relationships: []
      }
      workspace_members: {
        Row: WorkspaceMember
        Insert: Insertable<WorkspaceMember, 'workspace_id' | 'user_id', 'id' | 'joined_at'>
        Update: Partial<WorkspaceMember>
        Relationships: []
      }
      categories: {
        Row: Category
        Insert: Insertable<Category, 'workspace_id' | 'name', 'id' | 'created_at'>
        Update: Partial<Category>
        Relationships: []
      }
      tasks: {
        Row: Task
        Insert: Insertable<Task, 'workspace_id' | 'title', 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Task>
        Relationships: []
      }
      task_comments: {
        Row: TaskComment
        Insert: Insertable<
          TaskComment,
          'task_id' | 'user_id' | 'content',
          'id' | 'created_at' | 'updated_at'
        >
        Update: Partial<TaskComment>
        Relationships: []
      }
      task_history: {
        Row: TaskHistoryEntry
        Insert: Insertable<TaskHistoryEntry, 'workspace_id' | 'action', 'id' | 'created_at'>
        Update: Partial<TaskHistoryEntry>
        Relationships: []
      }
      notifications: {
        Row: Notification
        Insert: Insertable<Notification, 'user_id' | 'type' | 'title', 'id' | 'created_at'>
        Update: Partial<Notification>
        Relationships: []
      }
      task_templates: {
        Row: TaskTemplate
        Insert: Insertable<TaskTemplate, 'workspace_id' | 'name', 'id' | 'created_at'>
        Update: Partial<TaskTemplate>
        Relationships: []
      }
      template_tasks: {
        Row: TemplateTask
        Insert: Insertable<TemplateTask, 'template_id' | 'title', 'id' | 'created_at'>
        Update: Partial<TemplateTask>
        Relationships: []
      }
      points_transactions: {
        Row: PointsTransaction
        Insert: Insertable<
          PointsTransaction,
          'workspace_id' | 'user_id' | 'amount' | 'reason',
          'id' | 'created_at'
        >
        Update: Partial<PointsTransaction>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      join_workspace: {
        Args: { _code: string }
        Returns: string
      }
      preview_workspace: {
        Args: { _code: string }
        Returns: {
          id: string
          name: string
          description: string | null
          category: WorkspaceCategory
          member_count: number
        }[]
      }
      apply_overdue_penalties: {
        Args: { _workspace_id: string }
        Returns: number
      }
      sync_task_notifications: {
        Args: { _workspace_id: string }
        Returns: number
      }
    }
    Enums: {
      member_role: MemberRole
      workspace_category: WorkspaceCategory
      task_status: TaskStatus
      task_priority: TaskPriority
      recurrence_type: RecurrenceType
      notification_type: NotificationType
    }
    CompositeTypes: Record<never, never>
  }
}
