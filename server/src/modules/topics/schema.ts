import { z } from 'zod'

export const CreateTopicSchema = z.object({
  subjectId: z.number().int().positive(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']).default('not_started'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  deadline: z.string().optional(), // YYYY-MM-DD
  targetHours: z.number().positive().optional(),
})

export const UpdateTopicSchema = CreateTopicSchema.omit({ subjectId: true }).partial()

export type CreateTopicInput = z.infer<typeof CreateTopicSchema>
export type UpdateTopicInput = z.infer<typeof UpdateTopicSchema>
