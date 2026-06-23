import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API & Export | POSI',
  description: 'POSI provides selected public metadata endpoints for transparency, reuse, and verification. All API records preserve source attribution and provenance.',
}

const ENDPOINTS = [
  { method: 'GET', path: '/api/stats',              desc: 'Platform statistics: total journals, articles, DOI records, sync status' },
  { method: 'GET', path: '/api/journals',           desc: 'List journal records with available metadata, verification status, and PQF status' },
  { method: 'GET', path: '/api/journals/{slug}',    desc: 'Single journal record including PQF breakdown and evidence status' },
  { method: 'GET', path: '/api/articles',           desc: 'List articles with filters: journal, year, DOI status, license, MQS range' },
  { method: 'GET', path: '/api/articles/{doi}',     desc: 'Single article record with full metadata, MQS, and CVI' },
  { method: 'GET', path: '/api/search',             desc: 'Full-text search across articles, journals, and authors' },
  { method: 'GET', path: '/api/doi/{doi}',          desc: 'DOI lookup: Crossref status, OpenAlex match, citation visibility, MQS' },
  { method: 'GET', path: '/api/pqf/{slug}',         desc: 'PQF score and subfactor breakdown for a specific journal' },
  { method: 'GET', path: '/api/evidence/{slug}',    desc: 'Evidence records for a specific journal' },
  { method: 'GET', path: '/api/sources/status',     desc: 'Data source sync status: last sync date, record counts per source' },
]

const EXPORT_FORMATS = [
  { format: 'JSON',   desc: 'Machine-readable structured data with full provenance fields' },
  { format: 'CSV',    desc: 'Tabular export for spreadsheet analysis' },
  { format: 'BibTeX', desc: 'Citation export for reference managers (Zotero, Mendeley, JabRef)' },
  { format: 'RIS',    desc: 'Standardized citation format for all major reference managers' },
]

const QUERY_PARAMS = [
  { param: 'q',        desc: 'Full-text search query' },
  { param: 'journal',  desc: 'Filter by journal slug (e.g. grhas, afs)' },
  { param: 'year',     desc: 'Filter by publication year (e.g. 2025)' },
  { param: 'doi',      desc: 'Filter by exact DOI' },
  { param: 'license',  desc: 'Filter by license (e.g. CC BY 4.0)' },
  { param: 'scope',    desc: '"psg" for PSG journals only, "all" for full Crossref scope' },
  { param: 'page',     desc: 'Page number (default: 1)' },
  { param: 'rows',     desc: 'Results per page (default: 20, max: 100)' },
  { param: 'format',   desc: 'Export format: json, csv, bibtex, ris' },
]

export default function ApiPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5 mb-6" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>API & Export</span>
      </nav>

      {/* Header */}
      <div className="border-l-4 border-[#c41e3a] pl-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">API</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">Public Endpoints</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">API & Export</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          POSI provides selected public metadata endpoints for transparency, reuse, and verification.
          All API records preserve source attribution and provenance where available.
        </p>
      </div>

      {/* Status notice */}
      <div className="p-4 mb-6" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: '#1d4ed8' }}>
          <strong>API Status:</strong> The POSI public API is currently in planning phase.
          Endpoints listed below represent the intended specification. Currently, data can be accessed
          through the DOI Lookup tool, journal pages, and article pages on this site.
          API availability will be announced on this page.
        </p>
      </div>

      {/* Base URL */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Base URL</h2>
        </div>
        <div className="p-5">
          <div className="font-mono text-sm bg-gray-50 border border-gray-200 px-4 py-3 text-gray-800">
            https://posi.panorama-sg.com/api/
          </div>
          <p className="text-xs text-gray-500 mt-3">
            All endpoints return JSON by default. Append <code className="font-mono text-[11px] bg-gray-100 px-1 py-0.5">?format=csv</code> or{' '}
            <code className="font-mono text-[11px] bg-gray-100 px-1 py-0.5">?format=bibtex</code> for alternative formats.
          </p>
        </div>
      </section>

      {/* Endpoints */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Endpoints</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {ENDPOINTS.map(ep => (
            <div key={ep.path} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5" style={{ background: '#f0fdf4', color: '#1F7A4D', border: '1px solid #bbf7d0' }}>
                  {ep.method}
                </span>
                <code className="text-[11px] font-mono text-gray-700">{ep.path}</code>
              </div>
              <p className="text-[11px] text-gray-500 sm:ml-2">{ep.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Query parameters */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Query Parameters</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2 font-semibold text-gray-500 w-32">Parameter</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {QUERY_PARAMS.map(p => (
                <tr key={p.param} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5 font-mono text-gray-700">{p.param}</td>
                  <td className="px-4 py-2.5 text-gray-600">{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Export formats */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Export Formats</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {EXPORT_FORMATS.map(f => (
            <div key={f.format} className="px-5 py-3 flex items-center gap-4">
              <span className="text-[10px] font-mono font-bold w-16 shrink-0" style={{ color: 'var(--posi-accent)' }}>{f.format}</span>
              <p className="text-[11px] text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Usage & attribution */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Data Reuse & Attribution</h2>
        </div>
        <div className="p-5 space-y-3 text-xs text-gray-600 leading-relaxed">
          <p>
            POSI metadata is available for open reuse. All records include source attribution indicating
            whether data originates from Crossref, OpenAlex, OAI-PMH, DOAJ, ROR, or ORCID.
          </p>
          <p>
            When citing or reusing POSI data, please attribute the original data sources (Crossref, OpenAlex, etc.)
            as indicated in each record's provenance fields. POSI does not claim ownership of metadata
            sourced from third-party registries.
          </p>
          <p>
            PQF scores are produced by POSI under{' '}
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--posi-accent)' }}>
              CC BY 4.0
            </a>.
            Attribution: "POSI Quality Factor (PQF), Panorama Open Scholarly Index, panorama-sg.com".
          </p>
        </div>
      </section>

      {/* Rate limiting */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Rate Limits & Access</h2>
        </div>
        <div className="p-5 text-xs text-gray-600 space-y-2 leading-relaxed">
          <p>Public endpoints: 60 requests/minute per IP (planned).</p>
          <p>Bulk data exports: Contact the POSI team for institutional data agreements.</p>
          <p>
            Current data access: Use the{' '}
            <Link href="/doi-lookup" className="underline" style={{ color: 'var(--posi-accent)' }}>DOI Lookup</Link>,{' '}
            <Link href="/search" className="underline" style={{ color: 'var(--posi-accent)' }}>Search</Link>, and{' '}
            <Link href="/journals" className="underline" style={{ color: 'var(--posi-accent)' }}>Journal pages</Link>{' '}
            while the public API is in development.
          </p>
        </div>
      </section>

      <div className="flex gap-4 text-xs">
        <Link href="/data-sources" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Data Sources & Provenance →</Link>
        <Link href="/evidence" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Evidence Registry →</Link>
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About & Governance →</Link>
      </div>
    </div>
  )
}
