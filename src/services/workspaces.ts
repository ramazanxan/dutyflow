import { supabase } from '@/lib/supabase'
import type { MemberRole, Profile, Workspace, WorkspaceCategory } from '@/types/database'

export type WorkspaceWithRole = Workspace & {
  role: MemberRole
  memberCount: number
}

export type MemberWithProfile = {
  id: string
  userId: string
  role: MemberRole
  joinedAt: string
  displayName: string
}

export type WorkspacePreview = {
  id: string
  name: string
  description: string | null
  category: WorkspaceCategory
  memberCount: number
}

export async function listMyWorkspaces(userId: string): Promise<WorkspaceWithRole[]> {
  const { data: memberships, error } = await supabase
    .from('workspace_members')
    .select('workspace_id, role')
    .eq('user_id', userId)

  if (error) throw error
  if (!memberships.length) return []

  const ids = memberships.map((m) => m.workspace_id)

  const [workspaces, allMembers] = await Promise.all([
    supabase.from('workspaces').select('*').in('id', ids),
    supabase.from('workspace_members').select('workspace_id').in('workspace_id', ids),
  ])

  if (workspaces.error) throw workspaces.error
  if (allMembers.error) throw allMembers.error

  const roleByWorkspace = new Map(memberships.map((m) => [m.workspace_id, m.role]))
  const countByWorkspace = new Map<string, number>()
  for (const member of allMembers.data) {
    countByWorkspace.set(member.workspace_id, (countByWorkspace.get(member.workspace_id) ?? 0) + 1)
  }

  return workspaces.data
    .map((workspace) => ({
      ...workspace,
      role: roleByWorkspace.get(workspace.id)!,
      memberCount: countByWorkspace.get(workspace.id) ?? 1,
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createWorkspace(input: {
  ownerId: string
  name: string
  description: string
  category: WorkspaceCategory
}): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .insert({
      owner_id: input.ownerId,
      name: input.name.trim(),
      description: input.description.trim() || null,
      category: input.category,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function previewWorkspace(code: string): Promise<WorkspacePreview | null> {
  const { data, error } = await supabase.rpc('preview_workspace', { _code: code })

  if (error) throw error
  const found = data?.[0]
  if (!found) return null

  return {
    id: found.id,
    name: found.name,
    description: found.description,
    category: found.category,
    memberCount: Number(found.member_count),
  }
}

export async function joinWorkspace(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_workspace', { _code: code })

  if (error) throw error
  return data
}

export async function listMembers(workspaceId: string): Promise<MemberWithProfile[]> {
  const { data: members, error } = await supabase
    .from('workspace_members')
    .select('id, user_id, role, joined_at')
    .eq('workspace_id', workspaceId)

  if (error) throw error
  if (!members.length) return []

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in(
      'id',
      members.map((m) => m.user_id),
    )

  if (profilesError) throw profilesError

  const nameById = new Map(profiles.map((p: Pick<Profile, 'id' | 'display_name'>) => [p.id, p.display_name]))
  const roleOrder: Record<MemberRole, number> = { owner: 0, admin: 1, member: 2 }

  return members
    .map((member) => ({
      id: member.id,
      userId: member.user_id,
      role: member.role,
      joinedAt: member.joined_at,
      displayName: nameById.get(member.user_id) ?? 'Участник',
    }))
    .sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.joinedAt.localeCompare(b.joinedAt))
}

export async function changeMemberRole(memberId: string, role: MemberRole): Promise<void> {
  const { error } = await supabase.from('workspace_members').update({ role }).eq('id', memberId)
  if (error) throw error
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase.from('workspace_members').delete().eq('id', memberId)
  if (error) throw error
}
