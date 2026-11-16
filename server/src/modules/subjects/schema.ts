import { z } from 'zod'

export const CreateSubjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6976CC'),
})

export const UpdateSubjectSchema = CreateSubjectSchema.partial()

export type CreateSubjectInput = z.infer<typeof CreateSubjectSchema>
export type UpdateSubjectInput = z.infer<typeof UpdateSubjectSchema>
