import { describe, expect, it } from 'vitest'
import { CONE_PROFILE, MEAT, STEP_COUNT, coneFaces, faceBackground, plateLayers, seeded, shavings } from '@/lib/shawarma3d'

describe('seeded random', () => {
  it('repeats the same sequence for the same seed, inside [0, 1)', () => {
    const a = seeded(7)
    const b = seeded(7)
    const xs = Array.from({ length: 50 }, () => a())
    expect(xs).toEqual(Array.from({ length: 50 }, () => b()))
    for (const x of xs) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('differs between seeds and survives a zero or negative seed', () => {
    expect(seeded(1)()).not.toBe(seeded(2)())
    expect(Number.isFinite(seeded(0)())).toBe(true)
    expect(seeded(-7)()).toBe(seeded(7)())
  })
})

describe('the spit cone', () => {
  it('has one face per side on every ring, the same on every call (server and browser agree)', () => {
    const faces = coneFaces({ sides: 18 })
    expect(faces).toHaveLength(CONE_PROFILE.length * 18)
    expect(coneFaces({ sides: 18 })).toEqual(faces)
    expect(coneFaces({ sides: 14 })).toHaveLength(CONE_PROFILE.length * 14)
  })

  it('pushes each face out to about its ring radius and covers the ring', () => {
    const faces = coneFaces()
    for (const f of faces) {
      const r = Number(/translateZ\(([\d.]+)px\)/.exec(f.transform)?.[1])
      expect(r).toBeGreaterThan(55)
      expect(r).toBeLessThan(106)
      expect(f.left).toBeCloseTo(-f.width / 2, 1)
      expect(MEAT).toContain(f.c1)
    }
    // Faces are wider than the gap they cover, so no light shows between them.
    const r0 = CONE_PROFILE[0] - 2
    expect(Math.min(...faces.slice(0, 18).map((f) => f.width))).toBeGreaterThan(2 * r0 * Math.tan(Math.PI / 18))
  })

  it('draws charred spots and fat on some faces only', () => {
    const faces = coneFaces()
    const charred = faces.filter((f) => f.char).length
    expect(charred).toBeGreaterThan(0)
    expect(charred).toBeLessThan(faces.length)
    const withAll = faces.find((f) => f.char && f.fat)
    const plain = faces.find((f) => !f.char && !f.fat)
    expect(withAll && faceBackground(withAll).split('radial-gradient').length).toBe(3)
    expect(plain && faceBackground(plain)).toMatch(/^repeating-linear-gradient/)
  })
})

describe('carving', () => {
  it('drops every slice into the tray', () => {
    const s = shavings({ count: 9, trayTop: 516 })
    expect(s).toHaveLength(9)
    for (const x of s) {
      expect(x.top + x.dy).toBeGreaterThanOrEqual(516)
      expect(x.dx).toBeLessThan(0)
    }
    expect(shavings()).toEqual(s)
  })
})

describe('the plate', () => {
  it('fills up step by step and empties again', () => {
    expect(STEP_COUNT).toBe(5)
    expect(plateLayers(0)).toEqual([])
    expect(plateLayers(1)).toEqual([])
    const wrap = plateLayers(2)
    expect(wrap).toHaveLength(4)
    const cut = plateLayers(3)
    expect(cut).toHaveLength(24)
    expect(cut.some((l) => l.fill.includes('repeating-linear-gradient'))).toBe(true)
    const full = plateLayers(4)
    expect(full.length).toBeGreaterThan(cut.length)
    expect(full.some((l) => l.radius === '50%' && l.fill.includes('#FFFFFF'))).toBe(true)
  })

  it('keeps every piece on the plate', () => {
    for (const l of plateLayers(4)) {
      expect(l.left).toBeGreaterThanOrEqual(0)
      expect(l.top).toBeGreaterThanOrEqual(0)
      expect(l.left + l.width).toBeLessThanOrEqual(280)
      expect(l.top + l.height).toBeLessThanOrEqual(280)
    }
  })
})
