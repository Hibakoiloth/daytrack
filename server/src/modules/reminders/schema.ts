import { z } from 'zod'

export const CreateReminderSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  reminderDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/),
  taskId: z.number().int().positive().optional(),
})

export const UpdateReminderSchema = CreateReminderSchema.partial().extend({
  isDismissed: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
})
