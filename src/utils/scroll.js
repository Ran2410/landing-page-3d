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

export function buildTimelineRanges(chapters, compact = false) {
  const weights = chapters.map((chapter) => (
    compact ? chapter.mobileScrollWeight ?? chapter.scrollWeight : chapter.scrollWeight
  ))
  const totalWeight = weights.reduce((total, weight) => total + weight, 0)
  let cursor = 0

  const ranges = chapters.map((chapter, index) => {
    const start = cursor / totalWeight
    cursor += weights[index]
    return { ...chapter, index, start, end: cursor / totalWeight }
  })

  return { ranges, totalWeight }
}

export function mapTimeline(progress, ranges) {
  const value = clamp(progress)
  const index = sectionIndexAt(value, ranges)
  const chapter = ranges[index]
  const span = Math.max(Number.EPSILON, chapter.end - chapter.start)
  const localProgress = clamp((value - chapter.start) / span)
  const specimenRanges = ranges.filter((item) => item.kind === 'specimen')
  const specimenIndex = chapter.kind === 'specimen'
    ? specimenRanges.findIndex((item) => item.id === chapter.id)
    : -1
  const videoTime = chapter.kind === 'film'
    ? chapter.videoRange[0] + (chapter.videoRange[1] - chapter.videoRange[0]) * localProgress
    : chapter.videoHold

  return {
    activeIndex: index,
    chapter,
    localProgress,
    routeId: chapter.routeId,
    routeProgress: value,
    videoTime,
    educationProgress: specimenIndex < 0
      ? (index < specimenRanges[0].index ? 0 : 1)
      : (specimenIndex + localProgress) / specimenRanges.length,
    specimenIndex,
    spinAngle: chapter.kind === 'specimen' ? localProgress * Math.PI * 2 : 0,
  }
}
