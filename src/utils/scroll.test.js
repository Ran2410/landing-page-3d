import { describe, expect, it } from 'vitest'
import {
  buildTimelineRanges,
  clamp,
  mapTimeline,
  progressToTime,
  scrollProgress,
  sectionIndexAt,
} from './scroll'

const ranges = [
  { start: 0, end: 0.2 },
  { start: 0.2, end: 0.4 },
  { start: 0.4, end: 0.6 },
  { start: 0.6, end: 0.8 },
  { start: 0.8, end: 1 },
]

describe('scroll mapping', () => {
  it('clamps progress to the available journey', () => {
    expect(clamp(-0.5)).toBe(0)
    expect(clamp(1.5)).toBe(1)
  })

  it('maps sticky scroll distance to normalized progress', () => {
    expect(scrollProgress(0, 6000, 1000)).toBe(0)
    expect(scrollProgress(-2500, 6000, 1000)).toBe(0.5)
    expect(scrollProgress(-5000, 6000, 1000)).toBe(1)
  })

  it('selects deterministic section boundaries', () => {
    expect(sectionIndexAt(0, ranges)).toBe(0)
    expect(sectionIndexAt(0.2, ranges)).toBe(1)
    expect(sectionIndexAt(0.999, ranges)).toBe(4)
    expect(sectionIndexAt(1, ranges)).toBe(4)
  })

  it('keeps seeks inside the final decodable frame', () => {
    expect(progressToTime(0.5, 26)).toBe(12.98)
    expect(progressToTime(1, 26)).toBe(25.96)
    expect(progressToTime(0.5, Number.NaN)).toBe(0)
  })
})

describe('weighted experience timeline', () => {
  const chapters = [
    { id: 'panen', kind: 'film', routeId: 'panen', scrollWeight: 2, videoRange: [5, 10] },
    { id: 'seed', kind: 'specimen', routeId: 'museum', scrollWeight: 1, videoHold: 10 },
    { id: 'arabica', kind: 'specimen', routeId: 'museum', scrollWeight: 1, videoHold: 10 },
    { id: 'jemur', kind: 'film', routeId: 'jemur', scrollWeight: 2, videoRange: [10, 15] },
  ]
  const { ranges, totalWeight } = buildTimelineRanges(chapters)

  it('builds deterministic weighted chapter ranges', () => {
    expect(totalWeight).toBe(6)
    expect(ranges[0].start).toBe(0)
    expect(ranges[1].start).toBeCloseTo(1 / 3)
    expect(ranges.at(-1).end).toBe(1)
  })

  it('freezes video while the museum advances', () => {
    const firstSpecimen = mapTimeline(0.4, ranges)
    const secondSpecimen = mapTimeline(0.6, ranges)
    expect(firstSpecimen.videoTime).toBe(10)
    expect(secondSpecimen.videoTime).toBe(10)
    expect(secondSpecimen.educationProgress).toBeGreaterThan(firstSpecimen.educationProgress)
  })

  it('resumes film after the museum in both directions', () => {
    expect(mapTimeline(0.8, ranges).videoTime).toBeGreaterThan(10)
    expect(mapTimeline(0.2, ranges).videoTime).toBeLessThan(10)
  })

  it('maps every specimen chapter to one exact revolution', () => {
    const specimen = ranges[1]
    expect(mapTimeline(specimen.start, ranges).spinAngle).toBe(0)
    expect(mapTimeline(specimen.end - Number.EPSILON, ranges).spinAngle).toBeCloseTo(Math.PI * 2)
  })
})
