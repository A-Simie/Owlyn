import { apiClient } from '@/lib/api-client'
import type { Workspace, WorkspaceMember, InviteMemberPayload } from '@shared/schemas/workspace.schema'

export const workspaceApi = {
    getWorkspace: async () => {
        const { data } = await apiClient.get<Workspace>('/api/workspace')
        return data
    },

    updateWorkspace: async (payload: Partial<Pick<Workspace, 'name' | 'logoUrl'>>) => {
        const { data } = await apiClient.put<Workspace>('/api/workspace', payload)
        return data
    },

    getMembers: async () => {
        const { data } = await apiClient.get<WorkspaceMember[]>('/api/workspace/members')
        return data
    },

    inviteMember: async (payload: InviteMemberPayload) => {
        const { data } = await apiClient.post<{ message: string }>('/api/workspace/invite', payload)
        return data
    },

    removeMember: async (userId: string) => {
        await apiClient.delete(`/api/workspace/members/${userId}`)
    },
}
