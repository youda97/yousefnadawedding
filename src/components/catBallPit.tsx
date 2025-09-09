// ../components/catBallPit.tsx
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Engine, Runner, World, Bodies, Body } from 'matter-js'

/**
 * Props:
 *  - images: string[] of 15 cat image URLs
 *  - diameter?: optional circle size in px (auto-resizes by container width/height if not provided)
 *  - gravity?: optional gravity (default 1)
 *  - fadeMs?: fade-out duration before restart (default 800ms)
 */
export type CatBallPitProps = {
  images: string[]
  diameter?: number
  gravity?: number
  fadeMs?: number
  repeatLimit?: number
}

type Ball = {
  body: Body
  img: string
}

export const CatBallPit: React.FC<CatBallPitProps> = ({
  images,
  diameter,
  gravity = 1,
  fadeMs = 800,
  repeatLimit = 3,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // keep engine objects in refs so React re-renders don't recreate physics
  const engineRef = useRef<Engine | null>(null)
  const runnerRef = useRef<Runner | null>(null)

  // managed “view” of balls for DOM positioning
  const [balls, setBalls] = useState<Ball[]>([])
  const ballsRef = useRef<Ball[]>([])
  const [bounds, setBounds] = useState({ w: 0, h: 0 })
  const [phase, setPhase] = useState<
    'dropping' | 'settling' | 'fading' | 'idle'
  >('idle')
  const [fadeOut, setFadeOut] = useState(false)

  // pick a sensible diameter based on container size
  const computedDiameter =
    diameter ??
    Math.max(
      96,
      Math.min(160, Math.floor(Math.min(bounds.w / 5, bounds.h / 5)))
    )

  function buildDropOrder(imgs: string[], limit: number) {
    const order: string[] = []
    for (let r = 0; r < limit; r++) {
      for (const src of imgs) order.push(src)
    }
    return order
  }

  // measure container (and re-measure on resize)
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect()
      setBounds({ w: Math.max(0, rect.width), h: Math.max(0, rect.height) })
    })
    ro.observe(el)
    // first measure immediately
    const rect = el.getBoundingClientRect()
    setBounds({ w: Math.max(0, rect.width), h: Math.max(0, rect.height) })

    return () => ro.disconnect()
  }, [])

  // initialize matter world when we have dimensions
  useEffect(() => {
    if (!bounds.w || !bounds.h) return
    // clean up previous engine if any
    cleanupWorld()

    const engine = Engine.create()
    engine.gravity.y = gravity
    engineRef.current = engine

    // world bounds (invisible walls + floor)
    const wallThickness = 2000 // big so nothing escapes on resize jitter
    const floor = Bodies.rectangle(
      bounds.w / 2,
      bounds.h + wallThickness / 2,
      bounds.w + wallThickness * 2,
      wallThickness,
      {
        isStatic: true,
        restitution: 0.2,
        friction: 0.45,
        frictionStatic: 0.8,
        label: 'floor',
      }
    )
    const leftWall = Bodies.rectangle(
      -wallThickness / 2,
      bounds.h / 2,
      wallThickness,
      bounds.h * 3,
      {
        isStatic: true,
        label: 'left-wall',
      }
    )
    const rightWall = Bodies.rectangle(
      bounds.w + wallThickness / 2,
      bounds.h / 2,
      wallThickness,
      bounds.h * 3,
      {
        isStatic: true,
        label: 'right-wall',
      }
    )
    World.add(engine.world, [floor, leftWall, rightWall])

    // runner (we don't use Matter.Render; we do our own DOM render)
    const runner = Runner.create()
    runnerRef.current = runner
    Runner.run(runner, engine)

    // build capped sequence
    const dropOrder = buildDropOrder(images, repeatLimit)

    // tick: update DOM positions
    const rafId = { id: 0 }
    const tick = () => {
      const currentBalls = ballsRef.current
      // cause one lightweight state bump so React repositions
      if (currentBalls.length) {
        setBalls([...currentBalls])
      }
      rafId.id = requestAnimationFrame(tick)
    }
    rafId.id = requestAnimationFrame(tick)

    // start dropping using the capped sequence
    setPhase('dropping')
    startSequentialDrop(engine, dropOrder, computedDiameter, bounds, () => {
      setPhase('settling')
      waitUntilSettled(engine, currentAllBalls, bounds.h, () => {
        setPhase('fading')
        setFadeOut(true)
        setTimeout(() => {
          setFadeOut(false)
          resetWorld(engine)
          // restart the whole capped cycle again
          setPhase('dropping')
          startSequentialDrop(
            engine,
            dropOrder,
            computedDiameter,
            bounds,
            () => {
              setPhase('settling')
              waitUntilSettled(engine, currentAllBalls, bounds.h, () => {
                setPhase('fading')
                setFadeOut(true)
                setTimeout(() => {
                  setFadeOut(false)
                  resetWorld(engine)
                  setPhase('dropping')
                  startSequentialDrop(
                    engine,
                    dropOrder,
                    computedDiameter,
                    bounds,
                    () => {}
                  )
                }, fadeMs)
              })
            }
          )
        }, fadeMs)
      })
    })

    // helper to snapshot all balls (no-op here; we use ballsRef)
    function currentAllBalls() {
      return ballsRef.current.map((b) => b.body)
    }

    return () => {
      cancelAnimationFrame(rafId.id)
      cleanupWorld()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bounds.w,
    bounds.h,
    gravity,
    fadeMs,
    computedDiameter,
    images.join('|'),
    repeatLimit,
  ])

  // ---------- helpers ----------
  function cleanupWorld() {
    const engine = engineRef.current
    const runner = runnerRef.current
    if (runner) {
      Runner.stop(runner)
      runnerRef.current = null
    }
    if (engine) {
      World.clear(engine.world, false)
      Engine.clear(engine)
      engineRef.current = null
    }
    ballsRef.current = []
    setBalls([])
  }

  function resetWorld(engine: Engine) {
    // remove only balls; keep walls
    const toRemove: Body[] = []
    for (const body of engine.world.bodies) {
      if (body.label === 'cat-ball') toRemove.push(body)
    }
    toRemove.forEach((b) => World.remove(engine.world, b))
    ballsRef.current = []
    setBalls([])
  }

  /**
   * Drop cats sequentially:
   *  - spawn first at random X near top
   *  - wait until LAST dropped is near the bottom & nearly stopped
   *  - then spawn next
   *  - after all spawned, call onComplete
   */
  function startSequentialDrop(
    engine: Engine,
    imgs: string[],
    d: number,
    b: { w: number; h: number },
    onComplete?: () => void
  ) {
    let index = 0
    let checkId: number

    const dropNext = () => {
      if (index >= imgs.length) {
        onComplete && onComplete()
        return
      }
      const x = Math.max(d / 2, Math.min(b.w - d / 2, rand(d, b.w - d)))
      const y = -d // start above top
      const ball = Bodies.circle(x, y, d / 2, {
        label: 'cat-ball',
        restitution: 0.25, // ↑ bounce
        friction: 0.02, // ↓ surface drag
        frictionStatic: 0.1,
        frictionAir: 0.02, // ↓ air drag for livelier arc
        density: 0.005, // a tad lighter
        render: { visible: false },
      })
      // small random spin and nudge for variety
      Body.setAngularVelocity(ball, (Math.random() - 0.5) * 0.18)
      Body.setVelocity(ball, { x: (Math.random() - 0.5) * 0.7, y: 1.2 })

      World.add(engine.world, ball)
      const item: Ball = { body: ball, img: imgs[index] }
      ballsRef.current = [...ballsRef.current, item]
      index++

      // when THIS ball reaches near-bottom and is slow, drop next
      const started = performance.now()
      const maxWait = 1500

      const waitForRest = () => {
        const posY = ball.position.y
        const speed = ball.speed

        const nearBottom = posY >= b.h - d * 1.05
        const slowEnough = speed < 0.8
        const timedOut = performance.now() - started > maxWait

        if ((nearBottom && slowEnough) || timedOut) {
          cancelAnimationFrame(checkId)
          setTimeout(() => dropNext(), 80) // tiny pause for rhythm
        } else {
          checkId = requestAnimationFrame(waitForRest)
        }
      }
      checkId = requestAnimationFrame(waitForRest)
    }

    dropNext()
  }

  /**
   * Wait until all balls are essentially “sleeping”.
   * We consider settled if:
   *  - each ball is below half the container (formed the pit), and
   *  - average speed is extremely low for a short consecutive window.
   */
  function waitUntilSettled(
    engine: Engine,
    getBodies: () => Body[],
    height: number,
    onSettled: () => void
  ) {
    let stableFrames = 0
    const neededStable = 35 // ~0.5s at 60fps

    const loop = () => {
      const bodies = getBodies()
      if (!bodies.length) {
        requestAnimationFrame(loop)
        return
      }
      const allBelowHalf = bodies.every((b) => b.position.y > height * 0.5)
      const avgSpeed =
        bodies.reduce((sum, b) => sum + b.speed, 0) / Math.max(1, bodies.length)

      if (allBelowHalf && avgSpeed < 0.12) {
        stableFrames++
      } else {
        stableFrames = 0
      }

      if (stableFrames >= neededStable) {
        onSettled()
      } else {
        requestAnimationFrame(loop)
      }
    }
    requestAnimationFrame(loop)
  }

  function rand(min: number, max: number) {
    return Math.random() * (max - min) + min
  }

  // ---------- render ----------
  return (
    <div
      ref={containerRef}
      className={`pointer-events-none absolute inset-0 overflow-hidden z-[40] ${
        fadeOut ? 'opacity-0 transition-opacity' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${fadeMs}ms` }}
      aria-hidden
    >
      {/* absolutely-positioned cat circles */}
      {balls.map(({ body, img }, i) => {
        const size = computedDiameter
        const x = body.position.x - size / 2
        const y = body.position.y - size / 2

        return (
          <div
            key={i}
            className="absolute rounded-full shadow-lg will-change-transform"
            style={{
              width: size,
              height: size,
              transform: `translate(${x}px, ${y}px) rotate(${body.angle}rad)`,
              backgroundImage: `url(${img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              // subtle outline so they look like discrete balls
              boxShadow:
                '0 4px 10px rgba(0,0,0,0.25), inset 0 0 0 2px rgba(255,255,255,0.75)',
            }}
          />
        )
      })}
    </div>
  )
}
