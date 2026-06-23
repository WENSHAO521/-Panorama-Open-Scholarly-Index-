'use client'

import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState, FormEvent, Suspense } from 'react'
import { MagnifyingGlass, List, X } from '@phosphor-icons/react/dist/ssr'

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

  const links = [
    { href: '/',               label: 'Home' },
    { href: '/search',         label: 'Search' },
    { href: '/journals',       label: 'Journal Records' },
    { href: '/doi-lookup',     label: 'DOI Lookup' },
    { href: '/pqf',            label: 'PQF' },
    { href: '/policies',       label: 'Policies' },
    { href: '/evidence',       label: 'Evidence' },
    { href: '/data-sources',   label: 'Data' },
    { href: '/api',            label: 'API' },
    { href: '/submit-journal', label: 'Submit Record' },
  ]

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
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

          {/* Vertical divider */}
          <div className="hidden md:block h-5 w-px shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center flex-1">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] whitespace-nowrap transition-colors"
                style={
                  isActive(link.href)
                    ? {
                        color: '#ffffff',
                        fontFamily: 'var(--font-mono)',
                        borderBottom: '2px solid var(--posi-accent)',
                        paddingBottom: '2px',
                      }
                    : {
                        color: 'rgba(255,255,255,0.45)',
                        fontFamily: 'var(--font-mono)',
                        borderBottom: '2px solid transparent',
                        paddingBottom: '2px',
                      }
                }
              >
                {link.label}
              </Link>
            ))}
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
          className="md:hidden px-4 py-3 space-y-0.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#1a1a1a' }}
        >
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-3 py-2.5 text-xs uppercase tracking-[0.1em] transition-colors"
              style={
                isActive(link.href)
                  ? { color: 'var(--posi-accent)', fontWeight: 700, fontFamily: 'var(--font-mono)' }
                  : { color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }
              }
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
