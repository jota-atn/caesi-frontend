export function notBlank(value: unknown): boolean {
  return !!(value ?? '').toString().trim()
}

export function minLength(value: unknown, n: number): boolean {
  return (value ?? '').toString().trim().length >= n
}

export function isEmail(value: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? '').toString().trim())
}

export function isUrl(value: unknown): boolean {
  try {
    new URL((value ?? '').toString().trim())
    return true
  } catch {
    return false
  }
}

export function isPositiveNumber(value: unknown): boolean {
  const n = Number(value)
  return Number.isFinite(n) && n > 0
}

export function isValidImageFile(file: File, maxSizeMB = 8): boolean {
  return file.type.startsWith('image/') && file.size <= maxSizeMB * 1024 * 1024
}

export function isTodayOrFuture(dateStr: string | null | undefined): boolean {
  if (!dateStr) return true
  const data = new Date(dateStr + 'T23:59:59')
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return data >= hoje
}

export function validarNome(nome: string, min = 2): string {
  return nome.trim().length < min ? `Nome obrigatório (mínimo ${min} caracteres).` : ''
}

export function validarEmailOpcional(email: string): string {
  return email.trim() && !isEmail(email) ? 'Informe um e-mail válido.' : ''
}

export function validarUrlOpcional(url: string): string {
  return url.trim() && !isUrl(url) ? 'Informe um link válido.' : ''
}
