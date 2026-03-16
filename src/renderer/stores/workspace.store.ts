import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { workspaceApi } from '@/api/workspace.api'
import type { Workspace } from '@shared/schemas/workspace.schema'

interface WorkspaceState {
    workspace: Workspace | null
    loading: boolean
    error: string | null
    setWorkspace: (workspace: Workspace) => void
    fetchWorkspace: () => Promise<void>
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set) => ({
            workspace: null,
            loading: false,
            error: null,
            setWorkspace: (workspace) => set({ workspace }),
            fetchWorkspace: async () => {
                set({ loading: true, error: null })
                try {
                    const workspace = await workspaceApi.getWorkspace()
                    set({ workspace, loading: false })
                } catch (error: any) {
                    set({ error: error.message, loading: false })
                }
            },
        }),
        {
            name: 'owlyn_workspace_storage',
        }
    )
)
