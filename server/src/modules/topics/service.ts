import { topicsRepo } from './repository'
import { NotFoundError } from '../../utils/errors'
import type { CreateTopicInput, UpdateTopicInput } from './schema'
import type { TopicFilters } from './repository'

export class TopicsService {
  async getAll(filters: TopicFilters = {}) {
    return topicsRepo.findAll(filters)
  }

  async getById(id: number) {
    const topic = topicsRepo.findById(id)
    if (!topic) throw new NotFoundError('Topic')
    return topic
  }

  async create(data: CreateTopicInput) {
    return topicsRepo.create(data)
  }

  async update(id: number, data: UpdateTopicInput) {
    const topic = topicsRepo.findById(id)
    if (!topic) throw new NotFoundError('Topic')
    return topicsRepo.update(id, data)
  }

  async delete(id: number) {
    const topic = topicsRepo.findById(id)
    if (!topic) throw new NotFoundError('Topic')
    topicsRepo.delete(id)
  }
}
