import he from 'he'

export function sanitizeText(value: string): string {
  return he.encode(value)
}

export function sanitizeTextOrNull(value: string | null | undefined): string | null {
  if (value == null) return null
  return he.encode(value)
}
