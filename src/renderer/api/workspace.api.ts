import { apiClient } from '@/lib/api-client'
import type { Workspace, WorkspaceMember, InviteMemberPayload } from '@shared/schemas/workspace.schema'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

function normalizeWorkspaceLogoUrl(workspace: Workspace): Workspace {
    if (!workspace.logoUrl) {
        return workspace
    }

    const isAbsolute = /^https?:\/\//i.test(workspace.logoUrl)
    if (isAbsolute || !BASE_URL) {
        return workspace
    }

    const normalizedBaseUrl = BASE_URL.endsWith('/') ? BASE_URL : `${BASE_URL}/`
    return {
        ...workspace,
        logoUrl: new URL(workspace.logoUrl, normalizedBaseUrl).toString(),
    }
}

export const workspaceApi = {
    getWorkspace: async () => {
        const { data } = await apiClient.get<Workspace>('/api/workspace')
        return normalizeWorkspaceLogoUrl(data)
    },

    updateWorkspace: async (payload: { name?: string; logo?: File }) => {
        const formData = new FormData()
        if (payload.name) formData.append('name', payload.name)
        if (payload.logo) formData.append('logo', payload.logo)

        const { data } = await apiClient.put<Workspace>('/api/workspace', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        return normalizeWorkspaceLogoUrl(data)
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
