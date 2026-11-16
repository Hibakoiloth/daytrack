import { categoriesRepo, activityLogsRepo } from './repository'
import { NotFoundError } from '../../utils/errors'
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateActivityLogInput,
  UpdateActivityLogInput,
} from './schema'
import type { ActivityLogFilters } from './repository'

export class ActivityCategoriesService {
  async getAll() {
    return categoriesRepo.findAll()
  }

  async getById(id: number) {
    const cat = categoriesRepo.findById(id)
    if (!cat) throw new NotFoundError('ActivityCategory')
    return cat
  }

  async create(data: CreateCategoryInput) {
    return categoriesRepo.create(data)
  }

  async update(id: number, data: UpdateCategoryInput) {
    const cat = categoriesRepo.findById(id)
    if (!cat) throw new NotFoundError('ActivityCategory')
    return categoriesRepo.update(id, data)
  }

  async delete(id: number) {
    const cat = categoriesRepo.findById(id)
    if (!cat) throw new NotFoundError('ActivityCategory')
    categoriesRepo.delete(id)
  }
}

export class ActivityLogsService {
  async getLogs(filters: ActivityLogFilters = {}) {
    return activityLogsRepo.findAll(filters)
  }

  async getById(id: number) {
    const log = activityLogsRepo.findById(id)
    if (!log) throw new NotFoundError('ActivityLog')
    return log
  }

  async create(data: CreateActivityLogInput) {
    return activityLogsRepo.create(data)
  }

  async update(id: number, data: UpdateActivityLogInput) {
    const log = activityLogsRepo.findById(id)
    if (!log) throw new NotFoundError('ActivityLog')
    return activityLogsRepo.update(id, data)
  }

  async delete(id: number) {
    const log = activityLogsRepo.findById(id)
    if (!log) throw new NotFoundError('ActivityLog')
    activityLogsRepo.delete(id)
  }
}
