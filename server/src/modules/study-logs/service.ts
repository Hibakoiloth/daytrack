import { studyLogsRepo } from './repository'
import { NotFoundError } from '../../utils/errors'
import type { CreateStudyLogInput, UpdateStudyLogInput } from './schema'
import type { StudyLogFilters } from './repository'

export class StudyLogsService {
  async getLogs(filters: StudyLogFilters = {}) {
    return studyLogsRepo.findAll(filters)
  }

  async getById(id: number) {
    const log = studyLogsRepo.findById(id)
    if (!log) throw new NotFoundError('StudyLog')
    return log
  }

  async create(data: CreateStudyLogInput) {
    return studyLogsRepo.create(data)
  }

  async update(id: number, data: UpdateStudyLogInput) {
    const log = studyLogsRepo.findById(id)
    if (!log) throw new NotFoundError('StudyLog')
    return studyLogsRepo.update(id, data)
  }

  async delete(id: number) {
    const log = studyLogsRepo.findById(id)
    if (!log) throw new NotFoundError('StudyLog')
    studyLogsRepo.delete(id)
  }
}
