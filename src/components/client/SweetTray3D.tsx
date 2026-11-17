'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { TRAY, trayLayers, type SweetModel } from '@/lib/sweetTray'
import { useStageScale, useWhenVisible } from './stage3d'

type Kind = { name: string; note: string; model: SweetModel }

/**
 * A city's sweets on a 3D copper tray (batch 5): drag to turn it, press a piece (or a name) to lift
 * that kind and read about it. The names are real buttons, so the tray works from the keyboard too.
 */
export function SweetTray3D({ kinds, labels }: { kinds: Kind[]; labels: { tray: string; pick: string; hint: string } }) {
  const [sel, setSel] = useState(0)
  const [box, visible] = useWhenVisible<HTMLDivElement>()
  const [stageBox, scale] = useStageScale<HTMLDivElement>(TRAY + 60)
  const turn = useRef<HTMLSpanElement>(null)
  const drag = useRef({ on: false, x: 0, moved: 0, angle: 0 })
  const layers = useMemo(() => (visible ? trayLayers(kinds.map((k) => k.model)) : []), [visible, kinds])

  useEffect(() => {
    if (turn.current) turn.current.style.transform = `rotateZ(${drag.current.angle}deg)`
  })

  const rotateBy = (deg: number) => {
    drag.current.angle += deg
    if (turn.current) turn.current.style.transform = `rotateZ(${drag.current.angle}deg)`
  }
  const down = (e: PointerEvent<HTMLDivElement>) => {
    drag.current = { ...drag.current, on: true, x: e.clientX, moved: 0 }
    e.currentTarget.dataset.dragging = 'true'
  }
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current.on) return
    const dx = e.clientX - drag.current.x
    drag.current.x = e.clientX
    drag.current.moved += Math.abs(dx)
    rotateBy(-dx * 0.5)
  }
  const end = (e: PointerEvent<HTMLDivElement>) => {
    drag.current.on = false
    delete e.currentTarget.dataset.dragging
  }
  // A press on a piece picks its kind; the end of a drag does not.
  const press = (e: MouseEvent<HTMLDivElement>) => {
    const kind = (e.target as HTMLElement).dataset.kind
    if (kind !== undefined && drag.current.moved < 6) setSel(Number(kind))
  }
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') rotateBy(e.key === 'ArrowRight' ? 15 : -15)
  }
  const current = kinds[sel] ?? kinds[0]
  if (!current) return null

  return (
    <div className="swt3" ref={box}>
      <div className="swt3-stage" ref={stageBox} onPointerDown={down} onPointerMove={move} onPointerUp={end} onPointerLeave={end} onPointerCancel={end} onClick={press}>
        <div className="stage" style={{ transform: `scale(${scale})` }} role="img" aria-label={labels.tray}>
          <span className="floor" aria-hidden="true" />
          <span className="tilt" aria-hidden="true">
            <span className="metal" />
            {[0, 1, 2, 3, 4, 5, 6].map((k) => (
              <span key={k} className="rim" style={{ transform: `translateZ(${k * 3}px)` }} data-light={k === 6 ? 'true' : undefined} />
            ))}
            <span className="turn" ref={turn}>
              <span className="spin">
                <span className="etch" />
                {layers.map((l, i) => (
                  <span
                    key={i}
                    className="bit"
                    data-kind={l.kind}
                    style={{
                      left: l.left,
                      top: l.top,
                      width: l.width,
                      height: l.height,
                      borderRadius: l.radius,
                      clipPath: l.clip,
                      background: l.fill,
                      transform: `translateZ(${l.z + (l.kind === sel ? 30 : 0)}px) rotate(${l.turn}deg) scale(${l.scale})`,
                    }}
                  />
                ))}
              </span>
            </span>
          </span>
        </div>
      </div>
      <div className="swt3-side">
        {kinds.length > 1 && (
          <div className="swt3-kinds" role="group" aria-label={labels.pick} onKeyDown={keys}>
            {kinds.map((k, i) => (
              <button key={k.name} type="button" className="pill" aria-pressed={i === sel} onClick={() => setSel(i)}>
                {k.name}
              </button>
            ))}
          </div>
        )}
        <div className="swt3-card" aria-live="polite">
          <h3>{current.name}</h3>
          <p>{current.note}</p>
        </div>
        <p className="shw-hint">{labels.hint}</p>
      </div>
    </div>
  )
}
