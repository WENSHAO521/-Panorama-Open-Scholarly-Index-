'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { MagnifyingGlass, Books, ArrowSquareOut, CaretDown } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'
import { fetchBookByIsbn, openLibrarySearch } from '@/lib/api'
import { extractIsbn } from '@/lib/utils'
import type { BookInfo, BookSearchResult } from '@/lib/api'

const SEARCH_MODES = [
  { value: 'isbn',   label: 'ISBN' },
  { value: 'title',  label: 'Title' },
  { value: 'author', label: 'Author' },
]

function BookDetail({ book }: { book: BookInfo }) {
  return (
    <div className="bg-white p-6" style={{ border: '1px solid var(--posi-border)' }}>
      <div className="flex gap-4">
        <div className="shrink-0">
          <div
            className="w-16 h-20 flex items-center justify-center"
            style={{ background: 'var(--posi-soft-blue)', border: '1px solid var(--posi-border-light)' }}
          >
            <Books className="h-7 w-7" style={{ color: 'var(--posi-primary)' }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold leading-snug mb-0.5" style={{ color: 'var(--posi-text)' }}>
            {book.title}
          </h2>
          {book.subtitle && (
            <p className="text-sm mb-1" style={{ color: 'var(--posi-muted)' }}>{book.subtitle}</p>
          )}
          <p className="text-sm mb-3" style={{ color: 'var(--posi-muted)' }}>
            {book.authors.join('; ')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {book.year && (
              <div>
                <span className="block font-semibold uppercase tracking-[0.06em] mb-0.5" style={{ color: 'var(--posi-muted)' }}>Year</span>
                <span style={{ color: 'var(--posi-text)' }}>{book.year}</span>
              </div>
            )}
            {book.publisher && (
              <div>
                <span className="block font-semibold uppercase tracking-[0.06em] mb-0.5" style={{ color: 'var(--posi-muted)' }}>Publisher</span>
                <span style={{ color: 'var(--posi-text)' }}>{book.publisher}</span>
              </div>
            )}
            {book.place && (
              <div>
                <span className="block font-semibold uppercase tracking-[0.06em] mb-0.5" style={{ color: 'var(--posi-muted)' }}>Place</span>
                <span style={{ color: 'var(--posi-text)' }}>{book.place}</span>
              </div>
            )}
            <div>
              <span className="block font-semibold uppercase tracking-[0.06em] mb-0.5" style={{ color: 'var(--posi-muted)' }}>ISBN</span>
              <span className="font-mono" style={{ color: 'var(--posi-text)' }}>{book.isbn}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            <a
              href={`https://openlibrary.org/isbn/${book.isbn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:underline flex items-center gap-1"
              style={{ color: 'var(--posi-accent)' }}
            >
              Open Library <ArrowSquareOut className="h-3 w-3" />
            </a>
            <a
              href={`https://www.worldcat.org/isbn/${book.isbn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:underline flex items-center gap-1"
              style={{ color: 'var(--posi-accent)' }}
            >
              WorldCat <ArrowSquareOut className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Citation block */}
      <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--posi-border-light)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: 'var(--posi-muted)' }}>
          APA Citation
        </p>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-text)' }}>
          {book.authors.length > 0
            ? book.authors.map(a => {
                const parts = a.split(' ')
                const last = parts[parts.length - 1]
                const initials = parts.slice(0, -1).map(p => p[0] + '.').join(' ')
                return initials ? `${last}, ${initials}` : last
              }).join(', ')
            : 'Unknown Author'
          }
          {book.year ? ` (${book.year}). ` : '. '}
          <em>{book.title}{book.subtitle ? `: ${book.subtitle}` : ''}</em>.
          {book.publisher ? ` ${book.publisher}.` : ''}
        </p>
      </div>
    </div>
  )
}

function BookResultCard({ result }: { result: BookSearchResult }) {
  const isbn = result.isbn[0] ?? null
  return (
    <div
      className="bg-white p-4 flex gap-3 hover:bg-gray-50 transition-colors"
      style={{ border: '1px solid var(--posi-border)' }}
    >
      {result.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.cover_url}
          alt={result.title}
          className="w-12 h-16 object-cover shrink-0"
          style={{ border: '1px solid var(--posi-border-light)' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div
          className="w-12 h-16 shrink-0 flex items-center justify-center"
          style={{ background: 'var(--posi-soft-blue)', border: '1px solid var(--posi-border-light)' }}
        >
          <Books className="h-5 w-5" style={{ color: 'var(--posi-primary)' }} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold leading-snug mb-0.5" style={{ color: 'var(--posi-text)' }}>
          {isbn ? (
            <Link href={`/isbn-lookup?isbn=${isbn}`} className="hover:underline">
              {result.title}
            </Link>
          ) : result.title}
        </h3>
        {result.authors.length > 0 && (
          <p className="text-xs mb-1" style={{ color: 'var(--posi-muted)' }}>
            {result.authors.slice(0, 3).join(', ')}{result.authors.length > 3 ? ' et al.' : ''}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: 'var(--posi-muted)' }}>
          {result.year && <span>{result.year}</span>}
          {result.publisher && <span className="truncate max-w-[160px]">{result.publisher}</span>}
          {result.edition_count > 1 && <span>{result.edition_count} editions</span>}
          {isbn && (
            <span className="font-mono" style={{ color: 'var(--posi-border)' }}>{isbn}</span>
          )}
        </div>
        <div className="flex gap-3 mt-2">
          {isbn && (
            <Link
              href={`/isbn-lookup?isbn=${isbn}`}
              className="text-[11px] hover:underline"
              style={{ color: 'var(--posi-accent)' }}
            >
              ISBN Lookup →
            </Link>
          )}
          {result.key && (
            <a
              href={`https://openlibrary.org${result.key}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] hover:underline flex items-center gap-0.5"
              style={{ color: 'var(--posi-muted)' }}
            >
              Open Library <ArrowSquareOut className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

function IsbnLookupForm() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'isbn' | 'title' | 'author'>('isbn')
  const lookupRef = useRef(0)

  const [bookDetail, setBookDetail] = useState<BookInfo | null>(null)
  const [searchResults, setSearchResults] = useState<BookSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Read initial values from URL after hydration
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const urlIsbn = p.get('isbn')
    const urlQ = p.get('q')
    const urlMode = (p.get('mode') as 'title' | 'author') ?? null

    if (urlIsbn) {
      setMode('isbn')
      setQuery(urlIsbn)
      performIsbnLookup(urlIsbn)
    } else if (urlQ) {
      const m = urlMode ?? 'title'
      setMode(m)
      setQuery(urlQ)
      performSearch(urlQ, m)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function performIsbnLookup(isbn: string) {
    const myId = ++lookupRef.current
    setLoading(true)
    setError(null)
    setBookDetail(null)
    setSearchResults([])
    setSearched(true)
    try {
      const result = await fetchBookByIsbn(isbn)
      if (myId !== lookupRef.current) return
      if (result) {
        setBookDetail(result)
      } else {
        setError(`No book found for ISBN ${isbn}. Try searching by title instead.`)
      }
    } catch {
      if (myId !== lookupRef.current) return
      setError('Book lookup is temporarily unavailable. Please try again.')
    } finally {
      if (myId === lookupRef.current) setLoading(false)
    }
  }

  async function performSearch(q: string, m: 'title' | 'author') {
    const myId = ++lookupRef.current
    setLoading(true)
    setError(null)
    setBookDetail(null)
    setSearchResults([])
    setSearched(true)
    try {
      const { total: t, items } = await openLibrarySearch(q, { field: m })
      if (myId !== lookupRef.current) return
      setTotal(t)
      setSearchResults(items)
      if (items.length === 0) setError(`No books found for "${q}".`)
    } catch {
      if (myId !== lookupRef.current) return
      setError('Book search is temporarily unavailable. Please try again.')
    } finally {
      if (myId === lookupRef.current) setLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return

    if (mode === 'isbn') {
      const clean = extractIsbn(trimmed) ?? trimmed.replace(/[-\s]/g, '')
      router.replace(`/isbn-lookup?isbn=${encodeURIComponent(clean)}`, { scroll: false })
      await performIsbnLookup(clean)
    } else {
      router.replace(`/isbn-lookup?q=${encodeURIComponent(trimmed)}&mode=${mode}`, { scroll: false })
      await performSearch(trimmed, mode)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <nav className="text-xs flex items-center gap-1.5 mb-4" style={{ color: 'var(--posi-muted)' }}>
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-gray-700 transition-colors">Search</Link>
          <span>/</span>
          <span style={{ color: 'var(--posi-text)' }}>Book Search</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--posi-text)' }}>Book Search &amp; ISBN Lookup</h1>
        <p className="text-sm" style={{ color: 'var(--posi-muted)' }}>
          Look up book metadata by ISBN, or search by title and author via Open Library.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-5" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="flex gap-0 mb-3">
          {/* Mode selector */}
          <div className="relative shrink-0">
            <select
              value={mode}
              onChange={e => setMode(e.target.value as 'isbn' | 'title' | 'author')}
              className="appearance-none pl-3 pr-7 py-2.5 h-full focus:outline-none"
              style={{
                border: '1px solid var(--posi-border)', borderRight: 'none',
                color: 'var(--posi-text)', background: 'var(--posi-bg)',
                fontFamily: 'var(--font-mono)', fontSize: '16px',
                WebkitAppearance: 'none', width: '108px',
              }}
            >
              {SEARCH_MODES.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <CaretDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--posi-muted)' }} weight="bold" />
          </div>

          {/* Input */}
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={
              mode === 'isbn'   ? 'e.g. 978-0-262-03384-8 or 9780262033848' :
              mode === 'title'  ? 'Enter book title…' :
              'Enter author name…'
            }
            className="flex-1 px-4 py-2.5 focus:outline-none"
            style={{ border: '1px solid var(--posi-border)', borderRight: 'none', color: 'var(--posi-text)', fontSize: '16px' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
          />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold disabled:opacity-50 transition-colors shrink-0"
            style={{ background: 'var(--posi-accent)' }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
          >
            <MagnifyingGlass className="h-4 w-4" />
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>
          ISBN lookup uses Open Library, Google Books, and Korean NLK in sequence.
          Title/author search uses Open Library&apos;s full-text index.
        </p>
      </form>

      {/* Try-these chips */}
      {!searched && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: '9780262033848 (SICP)', isbn: '9780262033848' },
            { label: '9780143127550 (Sapiens)', isbn: '9780143127550' },
            { label: '9780385490818 (The Name of the Rose)', isbn: '9780385490818' },
          ].map(chip => (
            <button
              key={chip.isbn}
              onClick={() => { setMode('isbn'); setQuery(chip.isbn); performIsbnLookup(chip.isbn); router.replace(`/isbn-lookup?isbn=${chip.isbn}`, { scroll: false }) }}
              className="text-xs px-3 py-1.5 bg-white hover:bg-gray-50 transition-colors"
              style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white p-8 text-center animate-pulse" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="h-4 rounded w-1/2 mx-auto mb-2" style={{ background: 'var(--posi-bg)' }} />
          <div className="h-3 rounded w-1/3 mx-auto" style={{ background: 'var(--posi-bg)' }} />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="p-5 bg-white" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="flex items-start gap-3">
            <Books className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--posi-muted)' }} />
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--posi-text)' }}>Not Found</p>
              <p className="text-xs" style={{ color: 'var(--posi-muted)' }}>{error}</p>
              {mode === 'isbn' && (
                <button
                  onClick={() => setMode('title')}
                  className="text-xs mt-2 hover:underline"
                  style={{ color: 'var(--posi-accent)' }}
                >
                  Switch to title search →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ISBN lookup result */}
      {!loading && !error && bookDetail && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em] px-2 py-0.5"
              style={{ background: 'var(--posi-accent)', color: '#fff', fontFamily: 'var(--font-mono)' }}
            >
              ISBN Found
            </span>
            <span className="text-[10px]" style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}>
              via Open Library / Google Books
            </span>
          </div>
          <BookDetail book={bookDetail} />
        </div>
      )}

      {/* Search results */}
      {!loading && !error && searchResults.length > 0 && (
        <div>
          <div className="mb-3 pb-1" style={{ borderBottom: '1px solid var(--posi-border)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--posi-text)' }}>
              {total.toLocaleString()} books found
            </span>
            <span className="text-xs ml-2" style={{ color: 'var(--posi-muted)' }}>via Open Library</span>
          </div>
          <div className="space-y-2.5">
            {searchResults.map(r => (
              <BookResultCard key={r.key} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Data sources note */}
      <div className="text-xs pt-4" style={{ borderTop: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
        Book data sourced from{' '}
        <a href="https://openlibrary.org" target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>Open Library</a>,{' '}
        Google Books, and the Korean National Library (NLK).
        For article DOI lookup, use{' '}
        <Link href="/doi-lookup" className="hover:underline" style={{ color: 'var(--posi-accent)' }}>DOI Lookup</Link>.
      </div>
    </div>
  )
}

export default function IsbnLookupPage() {
  return <IsbnLookupForm />
}
