import { describe, expect, it } from 'vitest'
import { SWEETS } from '@/content/sweets'
import { PIECES, SWEET_MODELS, TRAY, layerScale, trayLayers } from '@/lib/sweetTray'

describe('sweet models', () => {
  it('every model has a piece with at least two layers', () => {
    for (const m of SWEET_MODELS) {
      expect(PIECES[m].layers.length).toBeGreaterThanOrEqual(2)
      expect(PIECES[m].w).toBeGreaterThan(0)
    }
  })

  it('every sweet on the site names a model, so every city with sweets gets a tray', () => {
    for (const [city, list] of Object.entries(SWEETS)) {
      for (const s of list) expect(SWEET_MODELS, `${city}: ${s.name.en}`).toContain(s.model)
    }
  })
})

describe('layer shapes', () => {
  it('a dome narrows to the top, a bowl widens, a roll rounds, a flat piece stays put', () => {
    const dome = [0, 4, 8].map((i) => layerScale('dome', i, 9))
    expect(dome[0]).toBe(1)
    expect(dome[1]!).toBeLessThan(1)
    expect(dome[2]!).toBeLessThan(dome[1]!)
    expect(layerScale('bowl', 0, 5)).toBeLessThan(layerScale('bowl', 4, 5))
    expect(layerScale('bowl', 0, 1)).toBeCloseTo(0.72)
    const roll = [0, 5].map((i) => layerScale('roll', i, 6))
    expect(roll[0]!).toBeGreaterThan(roll[1]!)
    expect(layerScale(undefined, 3, 6)).toBe(1)
  })
})

describe('tray layout', () => {
  it('draws nothing without sweets', () => {
    expect(trayLayers([])).toEqual([])
  })

  it('gives each kind its own sector and keeps every piece on the tray', () => {
    const layers = trayLayers(['booza', 'barazek', 'mabrumeh'])
    expect(new Set(layers.map((l) => l.kind))).toEqual(new Set([0, 1, 2]))
    for (const l of layers) {
      const cx = l.left + l.width / 2 - TRAY / 2
      const cy = l.top + l.height / 2 - TRAY / 2
      expect(Math.hypot(cx, cy)).toBeLessThan(TRAY / 2 - 20)
    }
    // Layers of one piece stack upwards.
    const first = layers.filter((l) => l.left === layers[0]!.left && l.top === layers[0]!.top && l.kind === 0)
    expect(first.map((l) => l.z)).toEqual([...first.map((l) => l.z)].sort((a, b) => a - b))
  })

  it('fills the whole tray when a city has one sweet', () => {
    const layers = trayLayers(['halawet'])
    const pieces = layers.length / PIECES.halawet.layers.length
    expect(pieces).toBeGreaterThan(20)
    expect(layers.every((l) => l.kind === 0)).toBe(true)
  })

  it('builds every city’s tray', () => {
    for (const list of Object.values(SWEETS)) expect(trayLayers(list.map((s) => s.model)).length).toBeGreaterThan(0)
  })
})
