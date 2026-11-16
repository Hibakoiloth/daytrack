import { z } from 'zod'

export const CreateEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  allDay: z.boolean().default(true),
  category: z.enum(['study', 'personal', 'work', 'assignment', 'deadline', 'reminder', 'general']).default('general'),
  subjectId: z.number().int().positive().optional(),
  topicId: z.number().int().positive().optional(),
})

export const UpdateEventSchema = CreateEventSchema.partial()
