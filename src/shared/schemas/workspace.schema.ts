import { z } from 'zod'

export const WorkspaceSchema = z.object({
    workspaceId: z.string().uuid(),
    name: z.string().min(2, 'Workspace name must be at least 2 characters'),
    logoUrl: z.string().url().optional().or(z.literal('')),
    memberCount: z.number().int().nonnegative(),
})

export const WorkspaceMemberSchema = z.object({
    userId: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
    role: z.enum(['ADMIN', 'RECRUITER']),
})

export const InviteMemberPayloadSchema = z.object({
    email: z.string().email('Invalid email address'),
    fullName: z.string().min(1, 'Full name is required'),
})

export type Workspace = z.infer<typeof WorkspaceSchema>
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>
export type InviteMemberPayload = z.infer<typeof InviteMemberPayloadSchema>
