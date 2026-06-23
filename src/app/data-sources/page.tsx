import Link from 'next/link'
import { ArrowSquareOut, Database, CheckCircle, Clock } from '@phosphor-icons/react/dist/ssr'
import { getStats } from '@/lib/data'

export const metadata = {
  title: 'Data Sources',
  description: 'POSI integrates open scholarly infrastructure data from Crossref, OpenAlex, OpenCitations, DOAJ, ROR, and ORCID.',
}

const SOURCES = [
  {
    name: 'POSI Core',
    abbr: 'POSI',
    purpose: 'Primary editorial and journal-level metadata from Panorama Scholarly Group journals',
    dataTypes: ['Journal records', 'PQF evaluations', 'Technical discoverability assessments', 'Metadata quality scoring'],
    updateFrequency: 'Manual (editorial cycle)',
    license: 'CC BY 4.0',
    url: null,
    status: 'Primary',
  },
  {
    name: 'Crossref',
    abbr: 'Crossref',
    purpose: 'DOI registration, article-level metadata, reference lists, and publisher verification',
    dataTypes: ['DOI records', 'Article metadata', 'Reference lists', 'Publisher data', 'Journal ISSN registry'],
    updateFrequency: 'Real-time (API)',
    license: 'CC0 1.0',
    url: 'https://crossref.org',
    status: 'Live',
  },
  {
    name: 'OpenAlex',
    abbr: 'OA',
    purpose: 'Open scholarly knowledge graph for citation visibility, author disambiguation, and institution records',
    dataTypes: ['Citation counts', 'Author records', 'Institution affiliations', 'Concept tagging', 'Source IDs'],
    updateFrequency: 'Real-time (API)',
    license: 'CC0 1.0',
    url: 'https://openalex.org',
    status: 'Live',
  },
  {
    name: 'OpenCitations',
    abbr: 'OCI',
    purpose: 'Open citation dataset providing attributed citation links between scholarly works',
    dataTypes: ['Citation links', 'Cited-by counts', 'Reference resolution'],
    updateFrequency: 'Periodic (bulk)',
    license: 'CC0 1.0',
    url: 'https://opencitations.net',
    status: 'Planned',
  },
  {
    name: 'DOAJ',
    abbr: 'DOAJ',
    purpose: 'Directory of Open Access Journals for OA verification, license data, and journal indexing status',
    dataTypes: ['OA status', 'License type', 'Journal quality indicators', 'Article-level records'],
    updateFrequency: 'Periodic (API)',
    license: 'CC BY-SA',
    url: 'https://doaj.org',
    status: 'Integrated',
  },
  {
    name: 'OAI-PMH',
    abbr: 'OAI',
    purpose: 'Open Archives Initiative Protocol for metadata harvesting from OJS-based journal platforms',
    dataTypes: ['Article records', 'Title/author data', 'Abstract', 'Publication dates'],
    updateFrequency: 'Periodic (harvest)',
    license: 'Varies per journal',
    url: 'https://www.openarchives.org/pmh/',
    status: 'Integrated',
  },
  {
    name: 'ROR',
    abbr: 'ROR',
    purpose: 'Research Organization Registry for institutional identifier resolution and affiliation disambiguation',
    dataTypes: ['Institution identifiers', 'Country data', 'Organization names'],
    updateFrequency: 'Periodic (API)',
    license: 'CC0 1.0',
    url: 'https://ror.org',
    status: 'Integrated',
  },
  {
    name: 'ORCID',
    abbr: 'ORCID',
    purpose: 'Open Researcher and Contributor ID for author disambiguation and profile linking',
    dataTypes: ['Author identifiers', 'Public work records', 'Affiliation data'],
    updateFrequency: 'Real-time (API)',
    license: 'CC0 1.0',
    url: 'https://orcid.org',
    status: 'Integrated',
  },
]

const STATUS_STYLE: Record<string, React.CSSProperties> = {
  Primary:    { background: '#fef2f2', color: '#c41e3a' },
  Live:       { background: '#E8F5EE', color: '#1F7A4D' },
  Integrated: { background: '#f5f5f5', color: '#374151' },
  Planned:    { background: '#F6F8FA', color: '#6B7280' },
}

export default function DataSourcesPage() {
  const stats = getStats()
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <nav className="text-xs flex items-center gap-1.5 mb-5" style={{ color: 'var(--posi-muted)' }}>
          <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--posi-text)' }}>Data Sources</span>
        </nav>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--posi-text)' }}>Data Sources</h1>
        <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--posi-muted)' }}>
          POSI aggregates metadata from multiple open scholarly infrastructure providers.
          Source identifiers and provenance are preserved wherever available.
          Third-party metadata remains attributed to its original source.
        </p>
        <div
          className="mt-5 p-4 text-xs leading-relaxed max-w-2xl"
          style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)', borderLeft: '3px solid var(--posi-accent)' }}
        >
          <strong style={{ color: 'var(--posi-text)' }}>POSI's primary focus is journal-level metadata and policy evidence.</strong>{' '}
          <span style={{ color: 'var(--posi-muted)' }}>
            Article-level metadata is used as supporting evidence for DOI coverage checks, metadata completeness assessments,
            publication activity, and citation visibility analysis — not as an end in itself.
            External metadata records are automatically discovered from open scholarly infrastructure and are
            not equivalent to POSI Verified Journal Records.
          </span>
        </div>
      </div>

      {/* Record counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-200" style={{ border: '1px solid var(--posi-border)' }}>
        {[
          { label: 'Journal Records', value: stats.total_journals.toLocaleString() },
          { label: 'DOI Records',      value: stats.total_doi_records.toLocaleString() },
          { label: 'Author Records',   value: stats.total_authors.toLocaleString() },
          { label: 'Last Sync',        value: stats.last_updated },
        ].map(s => (
          <div key={s.label} className="bg-white px-5 py-4 text-center">
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Source status table */}
      <div className="bg-white overflow-x-auto" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)', background: 'var(--posi-bg)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Source Status Overview</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
              <th className="text-left px-5 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Source</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Type</th>
              <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Primary Use</th>
              <th className="text-center px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Status</th>
              <th className="text-right px-5 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Last Sync</th>
            </tr>
          </thead>
          <tbody>
            {[
              { src: 'POSI Core',       type: 'Internal',   use: 'Journal records, PQF assessments, policy evidence', status: 'Primary',    sync: stats.last_updated },
              { src: 'DOAJ',            type: 'External OA', use: 'Journal verification, OA status, license data',    status: 'Integrated', sync: stats.last_updated },
              { src: 'Crossref',        type: 'External',   use: 'DOI records, article metadata, reference lists',    status: 'Live',       sync: 'Real-time' },
              { src: 'OpenAlex',        type: 'External',   use: 'Citation visibility, source matching, author IDs',  status: 'Live',       sync: 'Real-time' },
              { src: 'OAI-PMH',         type: 'Harvest',    use: 'Article harvesting from OJS-based platforms',       status: 'Integrated', sync: stats.last_updated },
              { src: 'ROR',             type: 'External',   use: 'Institution identifier resolution',                 status: 'Integrated', sync: 'Periodic' },
              { src: 'ORCID',           type: 'External',   use: 'Author identifier linking',                         status: 'Integrated', sync: 'Real-time' },
              { src: 'OpenCitations',   type: 'External',   use: 'Open citation links and cited-by counts',           status: 'Planned',    sync: '—' },
            ].map(row => (
              <tr key={row.src} style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
                <td className="px-5 py-2.5 font-semibold" style={{ color: 'var(--posi-text)' }}>{row.src}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--posi-muted)' }}>{row.type}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--posi-muted)' }}>{row.use}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className="text-[10px] font-medium px-1.5 py-0.5" style={
                    row.status === 'Primary'    ? { background: '#fef2f2', color: '#c41e3a', border: '1px solid #fecaca' } :
                    row.status === 'Live'       ? { background: '#f0fdf4', color: '#1F7A4D', border: '1px solid #bbf7d0' } :
                    row.status === 'Integrated' ? { background: '#f5f5f5', color: '#374151', border: '1px solid #e5e7eb' } :
                    { background: '#f9fafb', color: '#6B7280', border: '1px solid #e5e7eb' }
                  }>
                    {row.status}
                  </span>
                </td>
                <td className="px-5 py-2.5 text-right font-mono text-[10px]" style={{ color: 'var(--posi-muted)' }}>{row.sync}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Principle */}
      <div className="p-5" style={{ background: 'var(--posi-soft-blue)', border: '1px solid var(--posi-border)' }}>
        <div className="flex items-start gap-3">
          <Database className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--posi-primary)' }} />
          <div>
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--posi-primary)' }}>Open Data Principle</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-text)' }}>
              POSI only aggregates data from openly licensed sources. All data displayed on this platform
              is attributed to its original source. No proprietary or paywalled data is used. Where
              data is sourced from multiple providers, conflicts are flagged and provenance is shown.
            </p>
          </div>
        </div>
      </div>

      {/* Source cards */}
      <div className="space-y-4">
        {SOURCES.map(src => (
          <div key={src.abbr} className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] font-mono font-bold px-1.5 py-0.5 leading-none"
                  style={{ color: 'var(--posi-primary)', border: '1px solid var(--posi-border)', background: 'var(--posi-soft-blue)' }}
                >
                  {src.abbr}
                </span>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--posi-text)' }}>{src.name}</h2>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-[11px] font-medium px-2 py-0.5"
                  style={STATUS_STYLE[src.status] ?? STATUS_STYLE.Planned}
                >
                  {src.status}
                </span>
                {src.url && (
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] flex items-center gap-0.5 hover:underline transition-colors"
                    style={{ color: 'var(--posi-accent)' }}
                  >
                    {src.url.replace('https://', '')} <ArrowSquareOut className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="px-5 py-4 grid md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <p className="text-xs leading-relaxed mb-3" style={{ color: 'var(--posi-muted)' }}>{src.purpose}</p>
                <div className="flex flex-wrap gap-1.5">
                  {src.dataTypes.map(dt => (
                    <span
                      key={dt}
                      className="text-[11px] px-2 py-0.5"
                      style={{ background: 'var(--posi-bg)', color: 'var(--posi-muted)', border: '1px solid var(--posi-border-light)' }}
                    >
                      {dt}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: 'var(--posi-muted)' }} />
                  <div>
                    <p className="font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>Update Frequency</p>
                    <p style={{ color: 'var(--posi-muted)' }}>{src.updateFrequency}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: '#1F7A4D' }} />
                  <div>
                    <p className="font-semibold mb-0.5" style={{ color: 'var(--posi-text)' }}>License / Terms</p>
                    <p style={{ color: 'var(--posi-muted)' }}>{src.license}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="p-5 text-xs leading-relaxed" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
        <p className="font-semibold mb-2" style={{ color: 'var(--posi-text)' }}>Data Provenance Disclaimer</p>
        <p style={{ color: 'var(--posi-muted)' }}>
          POSI preserves source identifiers and provenance information whenever available.
          Third-party metadata remains attributed to its original source. POSI does not claim
          ownership of external data and is not responsible for errors in third-party records.
          If you identify a data quality issue, contact the respective data provider.
        </p>
      </div>
    </div>
  )
}
