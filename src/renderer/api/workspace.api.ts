import { apiClient } from '@/lib/api-client'
import type { Workspace, WorkspaceMember, InviteMemberPayload } from '@shared/schemas/workspace.schema'

export const workspaceApi = {
    getWorkspace: async () => {
        const { data } = await apiClient.get<Workspace>('/api/workspace')
        return data
    },

    updateWorkspace: async (payload: { name?: string; logo?: File }) => {
        const formData = new FormData()
        if (payload.name) formData.append('name', payload.name)
        if (payload.logo) formData.append('logo', payload.logo)

        const { data } = await apiClient.put<Workspace>('/api/workspace', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
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
