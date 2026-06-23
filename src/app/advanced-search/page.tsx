'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash, MagnifyingGlass } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

const FIELDS = [
  { code: 'TS', label: 'Topic (TS)' },
  { code: 'TI', label: 'Title (TI)' },
  { code: 'AU', label: 'Author (AU)' },
  { code: 'SO', label: 'Source Journal (SO)' },
  { code: 'DOI', label: 'DOI' },
  { code: 'PY', label: 'Publication Year (PY)' },
  { code: 'OG', label: 'Organization (OG)' },
  { code: 'LA', label: 'Language (LA)' },
  { code: 'DT', label: 'Document Type (DT)' },
  { code: 'AB', label: 'Abstract (AB)' },
  { code: 'KW', label: 'Keyword (KW)' },
  { code: 'PU', label: 'Publisher (PU)' },
]

const OPERATORS = ['AND', 'OR', 'NOT']

interface Row {
  id: number
  field: string
  value: string
  op: string
}

let nextId = 2

export default function AdvancedSearchPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([{ id: 1, field: 'TS', value: '', op: 'AND' }])

  function addRow() {
    setRows(prev => [...prev, { id: nextId++, field: 'TS', value: '', op: 'AND' }])
  }

  function removeRow(id: number) {
    setRows(prev => prev.filter(r => r.id !== id))
  }

  function updateRow(id: number, key: keyof Row, val: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: val } : r))
  }

  function buildQuery(): string {
    return rows
      .filter(r => r.value.trim())
      .map((r, i) => {
        const term = `${r.field}=(${r.value.trim()})`
        return i === 0 ? term : `${r.op} ${term}`
      })
      .join(' ')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = buildQuery()
    if (!q) return
    router.push(`/search?q=${encodeURIComponent(q)}&scope=all`)
  }

  const queryString = buildQuery()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <nav className="text-xs flex items-center gap-1.5 mb-6" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-gray-700 transition-colors">Search</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Advanced Search</span>
      </nav>

      <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--posi-text)' }}>Advanced Search</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--posi-muted)' }}>
        Build precise queries using field codes, Boolean operators, and date ranges.
      </p>

      <form onSubmit={handleSearch}>
        {/* Query builder */}
        <div className="bg-white mb-5" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--posi-muted)' }}>Query Builder</p>
          </div>

          <div className="p-5 space-y-3">
            {rows.map((row, idx) => (
              <div key={row.id} className="flex items-center gap-2">
                {idx > 0 ? (
                  <select
                    value={row.op}
                    onChange={e => updateRow(row.id, 'op', e.target.value)}
                    className="font-semibold py-2 px-2 focus:outline-none w-16 shrink-0"
                    style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-primary)', background: 'var(--posi-soft-blue)', fontSize: '16px', WebkitAppearance: 'none' }}
                  >
                    {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                  </select>
                ) : (
                  <div className="w-16 shrink-0" />
                )}

                <select
                  value={row.field}
                  onChange={e => updateRow(row.id, 'field', e.target.value)}
                  className="py-2 px-2 focus:outline-none shrink-0"
                  style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', width: '180px', fontSize: '16px', WebkitAppearance: 'none' }}
                >
                  {FIELDS.map(f => <option key={f.code} value={f.code}>{f.label}</option>)}
                </select>

                <input
                  value={row.value}
                  onChange={e => updateRow(row.id, 'value', e.target.value)}
                  placeholder={`Enter ${FIELDS.find(f => f.code === row.field)?.label ?? 'value'}...`}
                  className="flex-1 py-2 px-3 focus:outline-none transition-colors"
                  style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-text)', fontSize: '16px' }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--posi-primary)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--posi-border)')}
                />

                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="p-2 transition-colors"
                    style={{ color: 'var(--posi-muted)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--posi-danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--posi-muted)')}
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-1.5 text-xs py-1.5 transition-colors"
              style={{ color: 'var(--posi-accent)' }}
            >
              <Plus className="h-3.5 w-3.5" /> Add Row
            </button>
          </div>
        </div>

        {/* Query string preview */}
        {queryString && (
          <div className="mb-5 px-4 py-3" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1" style={{ color: 'var(--posi-muted)' }}>
              Search Expression
            </p>
            <code className="text-xs font-mono" style={{ color: 'var(--posi-primary)' }}>{queryString}</code>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ background: 'var(--posi-accent)' }}
            disabled={!queryString}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--posi-accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--posi-accent)')}
          >
            <MagnifyingGlass className="h-4 w-4" weight="bold" />
            Search
          </button>
          <button
            type="button"
            onClick={() => setRows([{ id: nextId++, field: 'TS', value: '', op: 'AND' }])}
            className="px-4 py-2.5 text-sm transition-colors"
            style={{ border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--posi-primary)'; e.currentTarget.style.color = 'var(--posi-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--posi-border)'; e.currentTarget.style.color = 'var(--posi-muted)' }}
          >
            Clear
          </button>
          <Link
            href="/search"
            className="text-sm transition-colors"
            style={{ color: 'var(--posi-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--posi-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--posi-muted)')}
          >
            ← Basic Search
          </Link>
        </div>
      </form>

      {/* Field code reference */}
      <div className="mt-10" style={{ borderTop: '1px solid var(--posi-border)' }}>
        <h2 className="text-sm font-bold mt-6 mb-4" style={{ color: 'var(--posi-text)' }}>Field Code Reference</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
          {FIELDS.map(f => (
            <div key={f.code} className="flex items-baseline gap-2 text-xs" style={{ color: 'var(--posi-muted)' }}>
              <span className="font-mono font-bold shrink-0 w-10" style={{ color: 'var(--posi-primary)' }}>{f.code}</span>
              <span>{f.label.replace(` (${f.code})`, '')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
