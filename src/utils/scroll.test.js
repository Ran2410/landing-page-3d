import { describe, expect, it } from 'vitest'
import { clamp, progressToTime, scrollProgress, sectionIndexAt } from './scroll'

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
