export function success<T>(data: T, message?: string): { data: T; message?: string } {
  return message ? { data, message } : { data }
}
