'use client'

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { coneFaces, faceBackground, plateLayers, shavings, STEP_COUNT } from '@/lib/shawarma3d'
import { useStageScale, useWhenVisible } from './stage3d'

type Labels = {
  /** Accessible name of the spit. */
  spit: string
  hint: string
  /** The four steps, shown over the plate. */
  steps: string[]
  /** The action button for each step (STEP_COUNT entries). */
  actions: string[]
  /** What the plate holds after each step (STEP_COUNT entries), announced politely. */
  notes: string[]
}

/** The stage is drawn at 520×680 px (styles/batch5.css) and scaled down to fit. */
const STAGE_W = 520

/**
 * The home page's shawarma spit in CSS 3D (batch 5): drag it to turn it, press it to carve,
 * and build the plate step by step. The cone's ~220 faces are made in the browser once the
 * section scrolls into view, so they add nothing to the page's HTML.
 */
export function Shawarma3D({ labels }: { labels: Labels }) {
  const [step, setStep] = useState(0)
  const [carve, setCarve] = useState(0)
  const [box, visible] = useWhenVisible<HTMLDivElement>()
  const [stageBox, scale] = useStageScale<HTMLDivElement>(STAGE_W)
  const turn = useRef<HTMLSpanElement>(null)
  const drag = useRef({ on: false, x: 0, moved: 0, angle: 0 })
  const hintId = useId()

  const faces = useMemo(() => (visible ? coneFaces() : []), [visible])
  const slices = useMemo(() => shavings(), [])
  const plate = useMemo(() => plateLayers(step), [step])

  useEffect(() => {
    if (turn.current) turn.current.style.transform = `rotateY(${drag.current.angle}deg)`
  })

  const rotateBy = (deg: number) => {
    drag.current.angle += deg
    if (turn.current) turn.current.style.transform = `rotateY(${drag.current.angle}deg)`
  }
  const cut = () => {
    setCarve((c) => c + 1)
    if (step === 0) setStep(1)
  }
  // A press without a drag carves; a drag only turns the spit. Keyboard: arrows turn, Enter/Space carve.
  const down = (e: PointerEvent<HTMLButtonElement>) => {
    drag.current = { ...drag.current, on: true, x: e.clientX, moved: 0 }
    e.currentTarget.dataset.dragging = 'true'
  }
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current.on) return
    const dx = e.clientX - drag.current.x
    drag.current.x = e.clientX
    drag.current.moved += Math.abs(dx)
    rotateBy(dx * 0.7)
  }
  const end = (e: PointerEvent<HTMLButtonElement>) => {
    drag.current.on = false
    delete e.currentTarget.dataset.dragging
  }
  const click = () => {
    if (drag.current.moved >= 6) {
      drag.current.moved = 0
      return
    }
    cut()
  }
  const key = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      rotateBy(e.key === 'ArrowRight' ? 15 : -15)
    }
  }

  return (
    <div className="shw3" ref={box}>
      <div className="shw3-plate-side">
        <ol className="shw3-steps">
          {labels.steps.map((s, i) => (
            <li key={s} className={step > i ? 'is-done' : undefined}>
              {s}
            </li>
          ))}
        </ol>
        <div className="shw3-plate" aria-hidden="true">
          <div className="tilt">
            <div className="spin">
              <div className="dish" />
              {plate.map((l, i) => (
                <div
                  key={`${step}-${i}`}
                  className="bite"
                  style={{ left: l.left, top: l.top, width: l.width, height: l.height, borderRadius: l.radius, background: l.fill, transform: `translateZ(${l.z}px) rotate(${l.turn}deg)` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="shw3-actions">
          <button type="button" className="btn-pill" onClick={() => setStep((s) => (s + 1) % STEP_COUNT)}>
            {labels.actions[step]}
          </button>
          <span className="shw-hint" aria-live="polite">
            {labels.notes[step]}
          </span>
        </div>
      </div>

      <div className="shw3-stage" ref={stageBox}>
        <button
          type="button"
          className="stage"
          aria-label={labels.spit}
          aria-describedby={hintId}
          style={{ transform: `scale(${scale})` }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
          onClick={click}
          onKeyDown={key}
        >
          <span className="arch-wall" aria-hidden="true" />
          <span className="grill" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="base" aria-hidden="true" />
          <span className="tray" aria-hidden="true" />
          <span className="rod" aria-hidden="true" />
          {!faces.length && <span className="ghost" aria-hidden="true" />}
          <span className={step >= 1 ? 'cone-tilt carved' : 'cone-tilt'} aria-hidden="true">
            <span className="turn" ref={turn}>
              <span className="spin">
                <span className="cap" />
                {faces.map((f, i) => (
                  <span key={i} className="face" style={{ top: f.top, left: f.left, width: f.width, transform: f.transform, background: faceBackground(f) }} />
                ))}
              </span>
            </span>
          </span>
          <span className="shade" aria-hidden="true" />
          <span className="crown" aria-hidden="true">
            <span className="onion" />
            <span className="tomato" />
          </span>
          {carve > 0 && (
            <span key={carve} className="carving" aria-hidden="true">
              <span className="knife" />
              {slices.map((s, i) => (
                <span
                  key={i}
                  className="slice"
                  style={{ marginLeft: s.left, top: s.top, width: s.width, background: s.color, animationDelay: `${s.delay}s`, '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, '--r': `${s.turn}deg` } as CSSProperties}
                />
              ))}
            </span>
          )}
        </button>
      </div>
      <p className="shw3-hint" id={hintId}>
        {labels.hint}
      </p>
    </div>
  )
}
