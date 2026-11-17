// Geometry for the home page's 3D shawarma spit (batch 5, owner request 2026-11-17).
// Pure functions: the client component turns these into CSS-3D divs. A fixed seed keeps
// the cone identical on every render, so nothing shifts between visits.

/** Park–Miller generator: the same seed always gives the same sequence in [0, 1). */
export function seeded(seed: number): () => number {
  let s = Math.floor(Math.abs(seed)) % 2147483647 || 1
  return () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
}

/** Radius of each ring of meat, top to bottom (px): widest near the top, tapering down like a real spit. */
export const CONE_PROFILE = [80, 93, 99, 101, 99, 95, 91, 86, 81, 75, 68, 60] as const
export const RING_HEIGHT = 31

/** Browned meat, from deep char to golden fat. */
export const MEAT = ['#C8772E', '#D08A3C', '#B9651F', '#A5561B', '#D99A4A', '#8E4416', '#C27028'] as const

export type ConeFace = { top: number; left: number; width: number; transform: string; c1: string; c2: string; char: string; fat: string; grain: number }

/** The flat faces that make the cone: `sides` per ring, each turned around the spit and pushed out to the ring's radius. */
export function coneFaces({ sides = 18, seed = 7 }: { sides?: number; seed?: number } = {}): ConeFace[] {
  const rnd = seeded(seed)
  const pick = (): string => MEAT[Math.floor(rnd() * MEAT.length)] ?? MEAT[0]
  const faces: ConeFace[] = []
  CONE_PROFILE.forEach((radius, ring) => {
    for (let j = 0; j < sides; j++) {
      const r = radius + rnd() * 4 - 2
      const width = 2 * r * Math.tan(Math.PI / sides) + 3
      const angle = (j * 360) / sides + (ring % 2) * (180 / sides)
      const at = () => `${Math.round(rnd() * 100)}% ${Math.round(rnd() * 100)}%`
      faces.push({
        top: ring * RING_HEIGHT + Math.round(rnd() * 2),
        left: round(-width / 2),
        width: round(width),
        transform: `rotateY(${round(angle)}deg) translateZ(${round(r)}px)`,
        c1: pick(),
        c2: pick(),
        char: rnd() < 0.3 ? at() : '',
        fat: rnd() < 0.3 ? at() : '',
        grain: Math.round(174 + rnd() * 12),
      })
    }
  })
  return faces
}

export type Shaving = { left: number; top: number; width: number; color: string; dx: number; dy: number; turn: number; delay: number }

/** Slices that fall from the knife into the tray (`trayTop` is the tray's y on the stage). */
export function shavings({ count = 9, seed = 11, trayTop = 516 }: { count?: number; seed?: number; trayTop?: number } = {}): Shaving[] {
  const rnd = seeded(seed)
  return Array.from({ length: count }, (_, k) => {
    const top = 190 + Math.round(rnd() * 220)
    return {
      left: 66 + Math.round(rnd() * 14),
      top,
      width: 16 + Math.round(rnd() * 14),
      color: MEAT[k % MEAT.length] ?? MEAT[0],
      dx: -(40 + Math.round(rnd() * 110)),
      dy: trayTop - top + Math.round(rnd() * 14),
      turn: Math.round(rnd() * 300 - 150),
      delay: round(0.25 + k * 0.07),
    }
  })
}

/** One flat layer on the plate; stacked layers (`z`) give each piece its thickness. */
export type PlateLayer = { left: number; top: number; width: number; height: number; radius: string; fill: string; z: number; turn: number }

const BREAD = 'radial-gradient(circle at 20% 40%,#C99A5B 0 3px,transparent 4px),radial-gradient(circle at 60% 62%,#C99A5B 0 4px,transparent 5px),radial-gradient(circle at 84% 34%,#B98545 0 3px,transparent 4px),linear-gradient(180deg,#F3E2BD,#E6CD9C)'
const TOAST = 'repeating-linear-gradient(90deg,rgba(90,45,15,.78) 0 3px,transparent 3px 12px),linear-gradient(180deg,#E9C98F,#D2A561)'
const GARLIC = 'radial-gradient(circle,#FFFFFF 0 58%,#F1ECE0 60%,#D9D0BD 100%)'
const PLATE = 280

/** The steps the reader walks through: 0 empty plate, 1 cutting, 2 wrapped, 3 toasted and cut, 4 with garlic, pickles and fries. */
export const STEP_COUNT = 5

/** What sits on the plate after `step`. */
export function plateLayers(step: number, seed = 5): PlateLayer[] {
  const rnd = seeded(seed)
  const out: PlateLayer[] = []
  if (step === 2) {
    for (let z = 0; z < 4; z++) out.push({ left: 40, top: 116, width: 200, height: 48, radius: '24px', fill: z === 3 ? BREAD : '#D9BC86', z: z * 6, turn: 0 })
  }
  if (step >= 3) {
    // Six pieces of the toasted wrap in an arc, the way it is served (arabi).
    for (let p = 0; p < 6; p++) {
      const deg = 200 + p * 28
      const th = (deg * Math.PI) / 180
      const cx = PLATE / 2 + 82 * Math.cos(th)
      const cy = PLATE / 2 + 82 * Math.sin(th)
      for (let z = 0; z < 4; z++) {
        out.push({ left: Math.round(cx - 29), top: Math.round(cy - 15), width: 58, height: 30, radius: '10px', fill: z === 3 ? TOAST : z === 1 ? '#A5561B' : '#D9B67C', z: z * 5, turn: deg + 90 })
      }
    }
  }
  if (step >= 4) {
    for (let z = 0; z < 5; z++) out.push({ left: 108, top: 132, width: 64, height: 64, radius: '50%', fill: z === 4 ? GARLIC : '#E3DAC8', z: z * 4, turn: 0 })
    for (let f = 0; f < 8; f++) {
      const left = 44 + Math.round(rnd() * 34)
      const top = 178 + Math.round(rnd() * 40)
      const turn = Math.round(rnd() * 150 - 75)
      for (let z = 0; z < 2; z++) out.push({ left, top, width: 44, height: 8, radius: '2px', fill: z ? '#F0BE55' : '#C9922E', z: 2 + f * 2 + z * 4, turn })
    }
    for (let q = 0; q < 5; q++) {
      const left = 178 + Math.round(rnd() * 30)
      const top = 176 + Math.round(rnd() * 36)
      const turn = Math.round(rnd() * 120 - 60)
      for (let z = 0; z < 2; z++) out.push({ left, top, width: 40, height: 9, radius: '3px', fill: z ? '#E77FA3' : '#C2436F', z: 2 + q * 2 + z * 4, turn })
    }
    for (let g = 0; g < 3; g++) {
      for (let z = 0; z < 2; z++) {
        out.push({ left: 186 + g * 14, top: 218 + (g % 2) * 10, width: 22, height: 22, radius: '50%', fill: z ? 'radial-gradient(circle,#CFE0A3 0 45%,#6E9A3A 50%,#4F7426 100%)' : '#4F7426', z: 2 + z * 4, turn: 0 })
      }
    }
  }
  return out
}

/** Background of one cone face: fibres, a charred spot or a fat gleam, over two meat tones. */
export function faceBackground(f: ConeFace): string {
  const parts: string[] = []
  if (f.char) parts.push(`radial-gradient(ellipse 60% 45% at ${f.char},rgba(70,26,6,.55),transparent 70%)`)
  if (f.fat) parts.push(`radial-gradient(ellipse 40% 30% at ${f.fat},rgba(255,214,150,.5),transparent 70%)`)
  parts.push(`repeating-linear-gradient(${f.grain}deg,rgba(60,24,8,.4) 0 1px,transparent 1px 7px)`, `linear-gradient(180deg,${f.c1},${f.c2})`)
  return parts.join(',')
}

function round(n: number): number {
  return Math.round(n * 100) / 100
}
