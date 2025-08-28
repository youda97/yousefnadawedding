import { useEffect, useState } from 'react'

export default function Preloader({
  minDelayMs = 500,
}: {
  minDelayMs?: number
}) {
  const [loaded, setLoaded] = useState(false)
  const [delayDone, setDelayDone] = useState(false)

  useEffect(() => {
    const onLoad = () => setLoaded(true)
    if (document.readyState === 'complete') {
      setLoaded(true)
    } else {
      window.addEventListener('load', onLoad, { once: true })
    }
    const t = setTimeout(() => setDelayDone(true), minDelayMs)

    // safety: if load never fires, hide after 6s
    const safety = setTimeout(() => setLoaded(true), 6000)

    return () => {
      window.removeEventListener('load', onLoad)
      clearTimeout(t)
      clearTimeout(safety)
    }
  }, [minDelayMs])

  const open = !(loaded && delayDone)

  return (
    <div
      id="preloader"
      className={`fixed inset-0 z-[99999] ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-[#f4ebe2]/90 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="spinner relative">
            {/* Heart (Font Awesome) */}
            <i
              className="fa-solid fa-heart text-[40px] animate-bouncedelay"
              style={{ color: 'rgba(159,121,100,1)' }}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
