import { calendarRepo, CalendarEvent } from './repository'
import { NotFoundError } from '../../utils/errors'
import { CreateEventSchema, UpdateEventSchema } from './schema'
import { z } from 'zod'

type CreateEventInput = z.infer<typeof CreateEventSchema>
type UpdateEventInput = z.infer<typeof UpdateEventSchema>

export class CalendarService {
  findAll(filters: {
    startDate?: string
    endDate?: string
    category?: string
    year?: number
    month?: number
  }): CalendarEvent[] {
    return calendarRepo.findAll(filters)
  }

  findById(id: number): CalendarEvent {
    const event = calendarRepo.findById(id)
    if (!event) throw new NotFoundError(`Calendar event ${id} not found`)
    return event
  }

  create(data: CreateEventInput): CalendarEvent {
    return calendarRepo.create(data)
  }

  update(id: number, data: UpdateEventInput): CalendarEvent {
    const existing = calendarRepo.findById(id)
    if (!existing) throw new NotFoundError(`Calendar event ${id} not found`)
    return calendarRepo.update(id, data)!
  }

  delete(id: number): void {
    const existing = calendarRepo.findById(id)
    if (!existing) throw new NotFoundError(`Calendar event ${id} not found`)
    calendarRepo.delete(id)
  }
}

export const calendarService = new CalendarService()
