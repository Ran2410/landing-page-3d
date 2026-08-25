export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export function scrollProgress(rectTop, scrollHeight, viewportHeight) {
  const distance = Math.max(1, scrollHeight - viewportHeight)
  return clamp(-rectTop / distance)
}

export function sectionIndexAt(progress, sections) {
  const value = clamp(progress)
  const index = sections.findIndex((section) => value >= section.start && value < section.end)
  return index === -1 ? sections.length - 1 : index
}

export function progressToTime(progress, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return 0
  return clamp(progress) * Math.max(0, duration - 0.04)
}
