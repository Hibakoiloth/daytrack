import { remindersRepo, Reminder } from './repository'
import { NotFoundError } from '../../utils/errors'
import { CreateReminderSchema, UpdateReminderSchema } from './schema'
import { z } from 'zod'

type CreateReminderInput = z.infer<typeof CreateReminderSchema>
type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>

export class RemindersService {
  findAll(filters: {
    upcoming?: boolean
    date?: string
    showDismissed?: boolean
  }): Reminder[] {
    return remindersRepo.findAll(filters)
  }

  findById(id: number): Reminder {
    const reminder = remindersRepo.findById(id)
    if (!reminder) throw new NotFoundError(`Reminder ${id} not found`)
    return reminder
  }

  create(data: CreateReminderInput): Reminder {
    return remindersRepo.create(data)
  }

  update(id: number, data: UpdateReminderInput): Reminder {
    const existing = remindersRepo.findById(id)
    if (!existing) throw new NotFoundError(`Reminder ${id} not found`)
    return remindersRepo.update(id, data)!
  }

  delete(id: number): void {
    const existing = remindersRepo.findById(id)
    if (!existing) throw new NotFoundError(`Reminder ${id} not found`)
    remindersRepo.delete(id)
  }

  findDue(): Reminder[] {
    // Use current local datetime in YYYY-MM-DD HH:MM format
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const nowStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
    return remindersRepo.findDue(nowStr)
  }
}

export const remindersService = new RemindersService()
