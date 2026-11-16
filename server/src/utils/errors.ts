export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string) {
    super(message)
    this.name = 'AppError'
  }
}
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NotFound', `${resource} not found`)
  }
}
export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, 'ValidationError', message)
  }
}
