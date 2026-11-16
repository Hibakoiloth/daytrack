import { z } from 'zod'

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  subjectId: z.number().int().positive().optional(),
  topicId: z.number().int().positive().optional(),
})

export const UpdateTaskSchema = CreateTaskSchema.partial()
