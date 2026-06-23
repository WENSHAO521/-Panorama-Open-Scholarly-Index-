'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, CaretDown } from '@phosphor-icons/react/dist/ssr'

// Map field selector values to the field codes used by parseFieldQuery / api.ts
const FIELD_CODE: Record<string, string> = {
  title:    'TI',
  author:   'AU',
  journal:  'SO',
  keyword:  'KW',
  abstract: 'AB',
}

const FIELDS = [
  { value: 'all',      label: 'All Fields' },
  { value: 'title',    label: 'Title (TI)' },
  { value: 'author',   label: 'Author (AU)' },
  { value: 'journal',  label: 'Source (SO)' },
  { value: 'keyword',  label: 'Keyword' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'doi',      label: 'DOI' },
]

export function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [field, setField] = useState('all')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    // DOI field → go straight to the DOI lookup page
    if (field === 'doi') {
      router.push(`/doi-lookup?doi=${encodeURIComponent(trimmed)}`)
      return
    }

    // Build a field-coded query (e.g. "TI=(machine learning)") if a specific
    // field is selected; otherwise pass the raw term for full-text search.
    const code = FIELD_CODE[field]
    const q = code ? `${code}=(${trimmed})` : trimmed
    router.push(`/search?q=${encodeURIComponent(q)}&scope=all`)
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="flex gap-0">
        {/* Field selector */}
        <div className="relative shrink-0">
          <select
            value={field}
            onChange={e => setField(e.target.value)}
            className="appearance-none pl-2 sm:pl-3 pr-6 sm:pr-7 py-3 focus:outline-none h-full w-[72px] sm:w-auto"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRight: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontFamily: 'var(--font-mono)',
              /* iOS Safari: font-size must be ≥16px to prevent auto-zoom on tap */
              fontSize: '16px',
              WebkitAppearance: 'none',
            }}
          >
            {FIELDS.map(f => (
              <option key={f.value} value={f.value} className="text-gray-900 bg-white">
                {f.label}
              </option>
            ))}
          </select>
          <CaretDown
            className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.3)' }}
            weight="bold"
          />
        </div>

        {/* Text input */}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search articles, journals, authors, DOI..."
          className="flex-1 px-4 py-3 focus:outline-none"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRight: 'none',
            color: '#ffffff',
            /* iOS Safari: font-size ≥16px prevents auto-zoom */
            fontSize: '16px',
          }}
          onFocus={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
          }}
          onBlur={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          }}
        />

        {/* Submit */}
        <button
          type="submit"
          className="flex items-center gap-2 px-3 sm:px-6 py-3 text-white text-sm font-semibold shrink-0 active:scale-[0.98] transition-transform"
          style={{ background: 'var(--posi-accent)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
        >
          <MagnifyingGlass className="h-4 w-4" weight="bold" />
          <span className="hidden sm:inline">Search</span>
        </button>
      </form>

      {/* Suggestions */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className="text-[10px] uppercase tracking-[0.1em]"
          style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)' }}
        >
          Try:
        </span>
        {['artificial intelligence', 'digital humanities', '10.63802/afs.2024.008'].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="text-[11px] transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.38)', fontFamily: 'var(--font-mono)' }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
