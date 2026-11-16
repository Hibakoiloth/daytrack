import { subjectsRepo } from './repository'
import { NotFoundError } from '../../utils/errors'
import type { CreateSubjectInput, UpdateSubjectInput } from './schema'

export class SubjectsService {
  async getAll() {
    return subjectsRepo.findAll()
  }

  async getById(id: number) {
    const subject = subjectsRepo.findById(id)
    if (!subject) throw new NotFoundError('Subject')
    return subject
  }

  async create(data: CreateSubjectInput) {
    return subjectsRepo.create(data)
  }

  async update(id: number, data: UpdateSubjectInput) {
    const subject = subjectsRepo.findById(id)
    if (!subject) throw new NotFoundError('Subject')
    return subjectsRepo.update(id, data)
  }

  async delete(id: number) {
    const subject = subjectsRepo.findById(id)
    if (!subject) throw new NotFoundError('Subject')
    subjectsRepo.delete(id)
  }
}
