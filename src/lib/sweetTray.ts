// Geometry for the city pages' 3D sweet tray (batch 5, owner request 2026-11-17): a copper tray
// with the city's sweets on it, one sector per kind. Every piece is a stack of flat layers lifted
// along Z, so it has real thickness when the tray tilts. Pure data; the client component draws it.

export const SWEET_MODELS = [
  'baklava',
  'mabrumeh',
  'barazek',
  'maamoul',
  'halawet',
  'booza',
  'karabij',
  'kleicha',
  'maarouk',
  'dibs',
  'jazariyeh',
  'tallaj',
  'shaibiyat',
  'jidq',
  'raha',
  'lazzaqi',
  'siyala',
] as const
export type SweetModel = (typeof SWEET_MODELS)[number]

/** How one piece is built: its footprint, outline, layer spacing, and the fill of each layer from bottom to top. */
type Piece = {
  w: number
  h: number
  radius: string
  clip?: string
  /** Z distance between layers (px). */
  dz: number
  /** Narrowing towards the top: a dome (maamoul, scoops), a roll (halawet el-jibn) or straight sides. */
  shape?: 'dome' | 'roll' | 'bowl'
  layers: string[]
}

const DIAMOND = 'polygon(50% 0,100% 50%,50% 100%,0 50%)'
const TRIANGLE = 'polygon(50% 4%,100% 96%,0 96%)'
const PISTACHIO = '#7FA23E'
const sesame = (base: string) => `radial-gradient(#F6E4B2 1.5px,transparent 2px) 0 0/7px 7px,radial-gradient(#F6E4B2 1.5px,transparent 2px) 3.5px 3.5px/7px 7px,${base}`
const pastry = (a: string, b: string, n: number) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a))

export const PIECES: Record<SweetModel, Piece> = {
  baklava: {
    w: 46,
    h: 30,
    radius: '0',
    clip: DIAMOND,
    dz: 2.5,
    layers: [...pastry('#D9A24A', '#EBC87E', 4), PISTACHIO, '#6B8E32', ...pastry('#EBC87E', '#D9A24A', 2), `radial-gradient(ellipse at 50% 50%,#6F9A3A 0 4px,#8FB04A 5px,transparent 7px),linear-gradient(135deg,#F3D48C,#D69A3C 60%,#B9782A)`],
  },
  mabrumeh: {
    w: 32,
    h: 32,
    radius: '50%',
    dz: 2.5,
    layers: [...pastry('#B87A2E', '#C98A3A', 7), `radial-gradient(circle,#8FB04A 0 30%,#5E7F2A 36%,transparent 40%),repeating-conic-gradient(#E0AC55 0 9deg,#B9782A 9deg 18deg)`],
  },
  barazek: { w: 36, h: 36, radius: '50%', dz: 2.5, layers: [PISTACHIO, '#C98F4B', sesame('#C48A45')] },
  maamoul: { w: 34, h: 34, radius: '50%', dz: 2.6, shape: 'dome', layers: [...Array(8).fill('repeating-conic-gradient(#F8EEDA 0 10deg,#E2CFA8 10deg 20deg)'), '#FBF4E4'] },
  halawet: {
    w: 46,
    h: 24,
    radius: '12px',
    dz: 2.6,
    shape: 'roll',
    layers: [...pastry('#EFE7D6', '#F6F1E4', 4), '#FBF7EE', `radial-gradient(circle at 50% 50%,#B8324A 0 3px,transparent 4px),radial-gradient(ellipse at 50% 50%,${PISTACHIO} 0 30%,transparent 34%),#FDFAF2`],
  },
  booza: { w: 34, h: 34, radius: '50%', dz: 3, shape: 'dome', layers: [...Array(7).fill('#F7F2E6'), `radial-gradient(#7FA23E 2px,transparent 3px) 0 0/8px 8px,#F2EEDF`] },
  karabij: { w: 40, h: 26, radius: '50%', dz: 2.6, layers: [...pastry('#D9B27A', '#E6C590', 4), '#F2D9A8', 'radial-gradient(ellipse at 50% 45%,#FFFFFF 0 40%,#F2EEE6 52%,transparent 56%),#EED3A0'] },
  kleicha: { w: 36, h: 36, radius: '50%', dz: 2.5, layers: ['#B8803C', '#5A3018', '#C8904A', 'radial-gradient(circle,transparent 0 30%,#A06A2C 31% 34%,transparent 35%),repeating-conic-gradient(#D8A35A 0 15deg,#C38A42 15deg 30deg)'] },
  maarouk: { w: 52, h: 34, radius: '50%', dz: 3, layers: ['#A8662C', '#BC7A3A', `radial-gradient(#1C1915 1.2px,transparent 1.8px) 2px 3px/9px 8px,${sesame('#C48443')}`] },
  dibs: {
    w: 46,
    h: 46,
    radius: '50%',
    dz: 3,
    shape: 'bowl',
    layers: ['#C9B49A', '#D8C4A6', '#E2D0B3', '#EADCC2', 'radial-gradient(circle at 38% 32%,#9A4A2A 0 8%,#4A1A0E 30%,#2B0E06 100%)'],
  },
  jazariyeh: { w: 26, h: 26, radius: '50%', dz: 2.8, shape: 'dome', layers: [...Array(6).fill('#E07A2A'), 'radial-gradient(#FFF6E8 1.4px,transparent 2px) 0 0/6px 6px,#E58A38'] },
  tallaj: { w: 40, h: 40, radius: '3px', dz: 1.6, layers: [...pastry('#F1E1BC', '#E7D2A4', 5), 'linear-gradient(135deg,rgba(255,255,255,.5),transparent 40%),#EAD39C'] },
  shaibiyat: { w: 42, h: 38, radius: '0', clip: TRIANGLE, dz: 2.4, layers: [...pastry('#E2B66A', '#F2D69C', 3), '#FFFDF5', '#FAF4E4', 'linear-gradient(160deg,#F7DA9A,#D99C46)'] },
  jidq: { w: 58, h: 16, radius: '8px', dz: 3, shape: 'roll', layers: ['#5A2A18', '#6E321C', '#7E3B20', 'repeating-linear-gradient(90deg,#8A4426 0 8px,#6A2E18 8px 10px)'] },
  raha: { w: 22, h: 22, radius: '3px', dz: 3.2, layers: [...Array(5).fill('#F2C4C8'), 'radial-gradient(#FFFFFF 1px,transparent 1.6px) 0 0/4px 4px,#F7DCDD'] },
  lazzaqi: { w: 44, h: 40, radius: '0', clip: TRIANGLE, dz: 1.6, layers: [...pastry('#E8CF98', '#D9B676', 5), 'radial-gradient(#1C1915 1px,transparent 1.6px) 0 0/8px 7px,linear-gradient(160deg,#EFD9A4,#CFA45E)'] },
  siyala: { w: 46, h: 46, radius: '50%', dz: 1.6, layers: [...pastry('#E6CE9A', '#D4B07A', 4), 'radial-gradient(circle at 40% 40%,rgba(90,40,15,.55) 0 30%,transparent 60%),#DDBD84'] },
}

export type TrayLayer = { kind: number; left: number; top: number; width: number; height: number; radius: string; clip: string; fill: string; z: number; turn: number; scale: number }

export const TRAY = 460
const RINGS = [76, 122, 170]

/** Scale of layer `i` of `n` for the piece's shape. */
export function layerScale(shape: Piece['shape'], i: number, n: number): number {
  if (shape === 'dome') return round(Math.sqrt(Math.max(0.12, 1 - (i / (n + 0.3)) ** 2)))
  if (shape === 'roll') return round(Math.sin(((i + 1) / (n + 1)) * Math.PI * 0.5 + Math.PI * 0.5) * 0.3 + 0.72)
  if (shape === 'bowl') return round(0.72 + (0.28 * i) / Math.max(1, n - 1))
  return 1
}

/**
 * Lays the kinds out on the tray: each kind gets an equal sector, filled ring by ring with as many
 * pieces as fit along each arc. Returns every layer of every piece, ready to draw.
 */
export function trayLayers(models: SweetModel[]): TrayLayer[] {
  const out: TrayLayer[] = []
  const n = models.length
  if (!n) return out
  const sector = 360 / n
  models.forEach((m, kind) => {
    const p = PIECES[m]
    const size = Math.max(p.w, p.h)
    const start = kind * sector - 90
    for (const r of RINGS) {
      const arc = (Math.PI * 2 * r * sector) / 360
      const count = Math.max(1, Math.floor(arc / (size * 1.3)))
      for (let k = 0; k < count; k++) {
        const deg = start + (sector * (k + 0.5)) / count
        const th = (deg * Math.PI) / 180
        const cx = TRAY / 2 + r * Math.cos(th)
        const cy = TRAY / 2 + r * Math.sin(th)
        p.layers.forEach((fill, i) => {
          out.push({
            kind,
            left: Math.round(cx - p.w / 2),
            top: Math.round(cy - p.h / 2),
            width: p.w,
            height: p.h,
            radius: p.radius,
            clip: p.clip ?? 'none',
            fill,
            z: round(3 + i * p.dz),
            turn: Math.round(deg + 90),
            scale: layerScale(p.shape, i, p.layers.length),
          })
        })
      }
    }
  })
  return out
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}
