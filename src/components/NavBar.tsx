// src/components/NavBar.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

type Item = { label: string; to?: string; href?: string }

const items: Item[] = [
  { label: 'Home', href: '#home' },
  { label: 'Countdown', href: '#countdown' },
  { label: 'RSVP', href: '#rsvp' },
  { label: 'When & Where', href: '#details' },
  { label: 'Gifts', href: '#gifts' },
  { label: 'Invitation', href: '#invitation' }, // opens modal
]

const INVITE_SRC = '/invitation.jpeg'

/** Extra pixels to add per section (on top of measured header height). */
const EXTRA_OFFSETS: Record<string, number> = {
  home: 0,
  countdown: 60,
  rsvp: 10,
  details: 40,
  gifts: 40,
  invitation: 0, // modal, not used
}

/* Smooth scroll to a hash with an absolute offset (header + per-section extra). */
function smoothScrollTo(hash: string, absoluteOffset: number) {
  const el = document.querySelector(hash) as HTMLElement | null
  if (!el) return
  const y = el.getBoundingClientRect().top + window.pageYOffset - absoluteOffset
  window.scrollTo({ top: y, behavior: 'smooth' })
}

/* Stable scroll-spy (no IO jitter). Picks the last section whose top <= anchor. */
function useScrollSpy(
  ids: string[],
  baseOffset: number,
  getExtra?: (id: string) => number
) {
  const [active, setActive] = useState('')
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
      .sort((a, b) => a.offsetTop - b.offsetTop)

    if (!sections.length) return

    const HYST = 8 // px buffer to prevent bouncing on boundaries

    const compute = () => {
      const anchorBase = window.pageYOffset + baseOffset + HYST
      let current = sections[0].id
      for (const el of sections) {
        const extra = getExtra?.(el.id) ?? 0
        if (el.offsetTop <= anchorBase + extra) current = el.id
        else break
      }
      setActive((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      if (raf.current != null) return
      raf.current = requestAnimationFrame(() => {
        raf.current = null
        compute()
      })
    }

    compute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [ids, baseOffset, getExtra])

  return active
}

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  // Lock page scroll when modal is open
  useEffect(() => {
    const root = document.documentElement
    if (inviteOpen) {
      const prev = root.style.overflow
      root.style.overflow = 'hidden'
      return () => {
        root.style.overflow = prev
      }
    }
  }, [inviteOpen])

  // ESC closes modal
  useEffect(() => {
    if (!inviteOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInviteOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inviteOpen])

  // Measure header height → base offset (header + 20px)
  const [baseOffset, setBaseOffset] = useState(100)
  useEffect(() => {
    const update = () => {
      const h = headerRef.current?.offsetHeight ?? 80
      setBaseOffset(h)
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    return () => window.removeEventListener('resize', update)
  }, [])

  // Color change on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // IDs for scroll spy (exclude Invitation since it opens a modal)
  const sectionIds = useMemo(
    () =>
      items
        .filter((i) => i.label !== 'Invitation')
        .map((i) => (i.href?.startsWith('#') ? i.href.slice(1) : null))
        .filter((x): x is string => !!x),
    []
  )
  const activeId = useScrollSpy(
    sectionIds,
    baseOffset,
    (id) => EXTRA_OFFSETS[id] ?? 0
  )

  const headerShell =
    'fixed top-0 left-0 w-full transition-colors duration-500 ease-in-out z-[99] border-b'
  const headerTone = scrolled
    ? 'bg-[#8a6957] text-white border-black/10'
    : 'bg-white/5 text-white border-white/15'

  const linkBase =
    'font-nav px-3 py-2 rounded-lg text-base font-medium transition'
  const linkHover = scrolled ? 'hover:bg-black/5' : 'hover:bg-white/10'

  // Special button style for Invitation
  const inviteBtn =
    'font-nav rounded-full px-4 py-2 text-base font-semibold ' +
    'bg-[#e4c9b8] text-[#8a6957] shadow-sm hover:bg-[#e4c9b8]/90 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60'

  const onInvitationClick = () => {
    setInviteOpen(true)
    setMobileOpen(false)
  }

  return (
    <>
      <header ref={headerRef} className="sticky-header">
        <div className={`${headerShell} ${headerTone}`}>
          <div className="container">
            <div className="flex items-center">
              {/* Logo */}
              <div className="logo-container py-4">
                <h1 className="leading-none">
                  <Link
                    to="/"
                    className="logo inline-flex font-logo text-4xl items-center gap-2"
                  >
                    <span>Yousef</span>
                    <span className="pl-1" aria-hidden="true">
                      <img src="/hearticon.png" className="w-9" />
                    </span>
                    <span>Nada</span>
                  </Link>
                </h1>
              </div>

              {/* Right side */}
              <div className="ml-auto flex items-center">
                {/* Desktop menu */}
                <nav aria-label="Main" className="hidden lg:block">
                  <ul className="flex items-center gap-2">
                    {items.map((it) => {
                      const isInvite = it.label === 'Invitation'
                      return (
                        <li key={it.label}>
                          <TopLink
                            item={it}
                            className={
                              isInvite ? inviteBtn : `${linkBase} ${linkHover}`
                            }
                            activeHash={activeId}
                            baseOffset={baseOffset}
                            onInvitation={onInvitationClick}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </nav>

                {/* Mobile button */}
                <button
                  onClick={() => setMobileOpen((s) => !s)}
                  aria-expanded={mobileOpen}
                  aria-controls="mobile_menu"
                  className="ml-3 inline-flex items-center justify-center rounded-md bg-transparent p-2 text-current hover:opacity-80 lg:hidden"
                >
                  <span className="sr-only">Toggle navigation</span>
                  <i className="fa-solid fa-bars text-xl" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            id="mobile_menu"
            className={`
              lg:hidden absolute left-0 right-0 top-full z-[98]
              ${
                mobileOpen
                  ? 'pointer-events-auto opacity-100 translate-y-0'
                  : 'pointer-events-none opacity-0 -translate-y-2'
              }
              transition duration-200 ease-out transform-gpu
            `}
          >
            <div className="bg-[#4c4c4c] text-white shadow-md">
              <nav
                className="container"
                role="menu"
                aria-hidden={mobileOpen ? 'false' : 'true'}
              >
                <ul className="py-2">
                  {items.map((it) => {
                    const isInvite = it.label === 'Invitation'
                    return (
                      <li key={it.label} className={isInvite ? 'my-4' : 'px-0'}>
                        <TopLink
                          item={it}
                          onNavigate={() => setMobileOpen(false)}
                          className={
                            isInvite
                              ? `${inviteBtn} w-full justify-center text-center`
                              : 'font-nav block rounded-md px-3 py-2 text-base hover:bg-white/10'
                          }
                          activeHash={activeId}
                          baseOffset={baseOffset}
                          onInvitation={onInvitationClick}
                        />
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Invitation Modal */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        src={INVITE_SRC}
      />
    </>
  )
}

function TopLink({
  item,
  className = '',
  onNavigate,
  activeHash,
  baseOffset = 10,
  onInvitation,
}: {
  item: Item
  className?: string
  onNavigate?: () => void
  activeHash?: string
  baseOffset?: number
  onInvitation?: () => void
}) {
  if (item.to) {
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `${className} ${isActive ? 'underline' : ''}`
        }
        onClick={onNavigate}
      >
        {item.label}
      </NavLink>
    )
  }

  const isHash = !!item.href && item.href.startsWith('#')
  const id = isHash ? item.href!.slice(1) : ''
  const isInvite = item.label === 'Invitation'
  const isActive = isHash && !isInvite && activeHash === id

  const handleClick = (e: React.MouseEvent) => {
    if (!isHash) return
    e.preventDefault()
    if (isInvite) {
      onInvitation?.()
    } else {
      const extra = EXTRA_OFFSETS[id] ?? 0
      smoothScrollTo(item.href!, baseOffset + extra)
      onNavigate?.()
    }
  }

  return (
    <a
      href={item.href || '#'}
      data-active={isActive}
      className={`${className} ${
        isInvite
          ? ''
          : 'data-[active=true]:underline data-[active=true]:bg-white/10'
      }`}
      onClick={handleClick}
    >
      {item.label}
    </a>
  )
}

/* ---------- Modal ---------- */
function InviteModal({
  open,
  onClose,
  src,
}: {
  open: boolean
  onClose: () => void
  src: string
}) {
  return (
    <div
      aria-hidden={!open}
      className={`
        fixed inset-0 z-[120]
        ${
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }
        transition-opacity duration-200
      `}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-0 flex items-center justify-center p-4"
      >
        <div
          className={`${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          } relative transform transition-all duration-200`}
        >
          <button
            onClick={onClose}
            className="absolute -right-3 -top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow"
            aria-label="Close invitation"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <img
            src={src}
            alt="Wedding invitation"
            className="max-h-[85vh] max-w-[92vw] rounded-xl shadow-2xl object-contain"
            draggable={false}
          />
        </div>
      </div>
    </div>
  )
}
