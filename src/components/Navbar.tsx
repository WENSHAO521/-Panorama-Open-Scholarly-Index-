'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, FormEvent, Suspense } from 'react'
import { MagnifyingGlass, List, X, CaretDown } from '@phosphor-icons/react/dist/ssr'

type SubItem = { label: string; href: string }
type NavItem = { label: string; href?: string; children?: SubItem[] }

const navItems: NavItem[] = [
  { href: '/', label: 'Home' },
  {
    label: 'Search',
    children: [
      { label: 'Search',          href: '/search' },
      { label: 'Advanced Search', href: '/advanced-search' },
      { label: 'DOI Lookup',      href: '/doi-lookup' },
    ],
  },
  {
    label: 'Records',
    children: [
      { label: 'Journal Records', href: '/journals' },
      { label: 'Article Records', href: '/articles' },
    ],
  },
  {
    label: 'Methodology',
    children: [
      { label: 'PQF Methodology', href: '/pqf' },
      { label: 'OJQF',            href: '/ojqf' },
    ],
  },
  {
    label: 'Evidence',
    children: [
      { label: 'Evidence Registry', href: '/evidence' },
      { label: 'Policy Evidence',   href: '/policies' },
      { label: 'Platform Policy',   href: '/policy' },
    ],
  },
  {
    label: 'Resources',
    children: [
      { label: 'Data Sources', href: '/data-sources' },
      { label: 'API & Export',  href: '/api' },
    ],
  },
  { href: '/submit-journal', label: 'Submit' },
  { href: '/about',          label: 'About' },
]

function NavSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="hidden lg:flex items-center relative">
      <MagnifyingGlass
        className="absolute left-2.5 h-3.5 w-3.5 pointer-events-none"
        style={{ color: 'rgba(255,255,255,0.3)' }}
      />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Quick search..."
        className="pl-8 pr-3 py-1.5 text-xs w-40 focus:w-52 focus:outline-none transition-all duration-200"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#ffffff',
          fontFamily: 'var(--font-mono)',
        }}
      />
    </form>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)

  function isItemActive(item: NavItem): boolean {
    if (item.href) {
      if (item.href === '/') return pathname === '/'
      return pathname.startsWith(item.href)
    }
    return item.children?.some(c => pathname.startsWith(c.href)) ?? false
  }

  function isChildActive(href: string): boolean {
    return pathname.startsWith(href)
  }

  const activeStyle = {
    color: '#ffffff',
    fontFamily: 'var(--font-mono)',
    borderBottom: '2px solid var(--posi-accent)',
    paddingBottom: '2px',
  }
  const inactiveStyle = {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'var(--font-mono)',
    borderBottom: '2px solid transparent',
    paddingBottom: '2px',
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{ background: 'var(--posi-primary)', borderTop: '3px solid var(--posi-accent)' }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-[60px] gap-5">

          {/* Brand */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/posi-logo-white.svg"
              alt="POSI - Panorama Scholarly Index"
              style={{ height: '38px', width: 'auto' }}
            />
          </Link>

          <div className="hidden md:block h-5 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center flex-1">
            {navItems.map(item => {
              const active = isItemActive(item)

              if (!item.children) {
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] whitespace-nowrap transition-colors"
                    style={active ? activeStyle : inactiveStyle}
                  >
                    {item.label}
                  </Link>
                )
              }

              const isOpen = openDropdown === item.label

              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    className="flex items-center gap-0.5 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] whitespace-nowrap transition-colors"
                    style={
                      active || isOpen
                        ? { ...activeStyle, cursor: 'default', background: 'transparent' }
                        : { ...inactiveStyle, cursor: 'default', background: 'transparent' }
                    }
                  >
                    {item.label}
                    <CaretDown
                      className="h-2.5 w-2.5 mt-px transition-transform duration-150"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        opacity: active || isOpen ? 0.7 : 0.35,
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="absolute top-full left-0 min-w-[176px] py-1.5 z-50"
                      style={{
                        background: '#111111',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderTop: '2px solid var(--posi-accent)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                      }}
                    >
                      {item.children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="block px-4 py-2 text-[10px] uppercase tracking-[0.1em] whitespace-nowrap transition-colors hover:text-white"
                          style={
                            isChildActive(child.href)
                              ? {
                                  color: 'var(--posi-accent)',
                                  fontFamily: 'var(--font-mono)',
                                  background: 'rgba(255,255,255,0.04)',
                                }
                              : { color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }
                          }
                          onClick={() => setOpenDropdown(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          <Suspense>
            <NavSearch />
          </Suspense>

          {/* Mobile toggle */}
          <button
            className="md:hidden ml-auto p-1.5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.6)' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <List className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden px-4 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1a' }}
        >
          {navItems.map(item => {
            const active = isItemActive(item)

            if (!item.children) {
              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className="block px-3 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors"
                  style={
                    active
                      ? { color: 'var(--posi-accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }
                      : { color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              )
            }

            const expanded = mobileExpanded === item.label

            return (
              <div key={item.label}>
                <button
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors"
                  style={{
                    color: active || expanded ? '#ffffff' : 'rgba(255,255,255,0.5)',
                    fontFamily: 'var(--font-mono)',
                    background: 'transparent',
                  }}
                  onClick={() => setMobileExpanded(expanded ? null : item.label)}
                >
                  {item.label}
                  <CaretDown
                    className="h-3 w-3 transition-transform duration-150"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {expanded && (
                  <div className="ml-3 mb-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)' }}>
                    {item.children.map(child => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2 text-[11px] uppercase tracking-[0.08em] transition-colors"
                        style={
                          isChildActive(child.href)
                            ? { color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }
                            : { color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }
                        }
                        onClick={() => setMobileOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </header>
  )
}
