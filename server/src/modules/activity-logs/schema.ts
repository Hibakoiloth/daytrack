import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  classification: z.enum(['productive', 'neutral', 'distracting']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

export const CreateActivityLogSchema = z.object({
  activityName: z.string().min(1).max(200),
  categoryId: z.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().min(1).max(1440),
  notes: z.string().optional(),
})

export const UpdateActivityLogSchema = CreateActivityLogSchema.partial()

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>
export type CreateActivityLogInput = z.infer<typeof CreateActivityLogSchema>
export type UpdateActivityLogInput = z.infer<typeof UpdateActivityLogSchema>
