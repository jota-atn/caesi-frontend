export function notBlank(value) {
  return !!(value ?? '').toString().trim()
}

export function minLength(value, n) {
  return (value ?? '').toString().trim().length >= n
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? '').toString().trim())
}

export function isUrl(value) {
  try {
    new URL((value ?? '').toString().trim())
    return true
  } catch {
    return false
  }
}

export function isPositiveNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0
}

export function isValidImageFile(file, maxSizeMB = 8) {
  return file.type.startsWith('image/') && file.size <= maxSizeMB * 1024 * 1024
}

export function isTodayOrFuture(dateStr) {
  if (!dateStr) return true
  const data = new Date(dateStr + 'T23:59:59')
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return data >= hoje
}
