import { z } from 'zod'

export const CreateStudyLogSchema = z.object({
  subjectId: z.number().int().positive(),
  topicId: z.number().int().positive().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationMinutes: z.number().int().min(1).max(1440),
  notes: z.string().optional(),
})

export const UpdateStudyLogSchema = CreateStudyLogSchema.partial()

export type CreateStudyLogInput = z.infer<typeof CreateStudyLogSchema>
export type UpdateStudyLogInput = z.infer<typeof UpdateStudyLogSchema>
