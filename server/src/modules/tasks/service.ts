import { tasksRepo, Task } from './repository'
import { NotFoundError } from '../../utils/errors'
import { CreateTaskSchema, UpdateTaskSchema } from './schema'
import { z } from 'zod'

type CreateTaskInput = z.infer<typeof CreateTaskSchema>
type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>

export class TasksService {
  findAll(filters: {
    status?: string
    priority?: string
    subjectId?: number
    search?: string
  }): Task[] {
    return tasksRepo.findAll(filters)
  }

  findById(id: number): Task {
    const task = tasksRepo.findById(id)
    if (!task) throw new NotFoundError(`Task ${id} not found`)
    return task
  }

  create(data: CreateTaskInput): Task {
    return tasksRepo.create(data)
  }

  update(id: number, data: UpdateTaskInput): Task {
    const existing = tasksRepo.findById(id)
    if (!existing) throw new NotFoundError(`Task ${id} not found`)
    return tasksRepo.update(id, data)!
  }

  delete(id: number): void {
    const existing = tasksRepo.findById(id)
    if (!existing) throw new NotFoundError(`Task ${id} not found`)
    tasksRepo.delete(id)
  }
}

export const tasksService = new TasksService()
