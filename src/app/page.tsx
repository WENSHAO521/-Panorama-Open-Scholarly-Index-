import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'
import { getStats } from '@/lib/data'
import { crossrefSearch } from '@/lib/api'

// Revalidate stats every hour so article counts stay current
export const revalidate = 3600

export const metadata = {
  title: 'Panorama Open Scholarly Index | POSI',
  description:
    'POSI is an open scholarly metadata platform that evaluates journal transparency, metadata quality, technical discoverability, and open citation visibility through publicly auditable evidence.',
}

export default async function HomePage() {
  // Fetch live article count from Crossref (PSG journals)
  let liveArticleCount: number | undefined
  try {
    const { total } = await crossrefSearch('', { scope: 'psg', rows: 1 })
    if (total > 0) liveArticleCount = total
  } catch {
    // fall back to static counts in data.ts
  }

  const stats = {
    ...getStats(liveArticleCount),
    last_updated: new Date().toISOString().slice(0, 10),
  }

  return (
    <div className="min-h-[100dvh]">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ background: 'var(--posi-primary)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-0">

          {/* Logotype + headline */}
          <div
            aria-hidden="true"
            className="leading-none font-bold select-none"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(5rem, 14vw, 11rem)',
              color: 'var(--posi-accent)',
              letterSpacing: '-0.01em',
            }}
          >
            POSI
          </div>

          <h1
            className="font-bold leading-tight mb-5"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.4rem, 3.5vw, 2.5rem)',
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '0.02em',
              marginTop: '-0.25rem',
            }}
          >
            Panorama Open Scholarly Index
          </h1>

          <p
            className="mb-8 leading-relaxed"
            style={{
              color: 'rgba(255,255,255,0.5)',
              maxWidth: '58ch',
              fontSize: '0.9375rem',
            }}
          >
            Open scholarly metadata platform for journal transparency, metadata quality,
            and citation visibility. All indicators use publicly auditable evidence.
          </p>

          <SearchBar />

          {/* Quick navigation links */}
          <nav className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2" aria-label="Quick links">
            {[
              { href: '/journals',      label: 'Journal Records' },
              { href: '/articles',      label: 'Metadata Records' },
              { href: '/doi-lookup',    label: 'DOI Lookup' },
              { href: '/pqf',           label: 'PQF Methodology' },
              { href: '/evidence',      label: 'Evidence Registry' },
            ].map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs uppercase tracking-[0.1em] transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}
              >
                {link.label} /
              </Link>
            ))}
          </nav>
        </div>

        {/* Stats strip */}
        <div
          className="mt-14"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {[
                { value: stats.psg_journals + stats.indexed_journals, label: 'Verified Records' },
                { value: stats.discovered_journals,                   label: 'Discovered Records' },
                { value: stats.total_doi_records,                     label: 'DOI Metadata Records' },
                { value: stats.total_articles,                        label: 'Article Records' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="py-7 pr-6"
                >
                  <p
                    className="text-3xl md:text-4xl font-bold text-white leading-none"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {s.value.toLocaleString()}
                  </p>
                  <p
                    className="text-[9px] uppercase tracking-[0.16em] mt-2"
                    style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)' }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            <p
              className="pb-4 text-[9px]"
              style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-mono)' }}
            >
              Updated {stats.last_updated}
            </p>
          </div>
        </div>
      </section>

      {/* ── CORE INDICATORS ──────────────────────────────────── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div
            className="grid md:grid-cols-4 divide-y md:divide-y-0 md:divide-x"
            style={{ divideColor: 'var(--posi-border)' } as React.CSSProperties}
          >
            {[
              {
                abbr: 'PQF',
                label: 'POSI Quality Factor',
                desc: 'Composite indicator (0-100) assessing journal transparency, metadata quality, editorial governance, technical discoverability, open citation visibility, and research integrity readiness.',
              },
              {
                abbr: 'MQS',
                label: 'Metadata Quality Score',
                desc: 'Article-level metadata score (0-100) based on DOI registration, abstract completeness, ORCID/ROR identifiers, reference lists, license URI, and open access status.',
              },
              {
                abbr: 'CVI',
                label: 'Citation Visibility Index',
                desc: 'Open citation visibility via OpenAlex, Crossref, and OpenCitations. No proprietary metrics - only open, attributed, machine-readable citation data.',
              },
              {
                abbr: 'IRS',
                label: 'Indexing Readiness Score',
                desc: 'Technical readiness assessment for common scholarly indexing: OAI-PMH, sitemap, DOI resolution, Schema.org, and Google Scholar discoverability.',
              },
            ].map(f => (
              <div
                key={f.abbr}
                className="p-7"
                style={{ borderRight: 'none', borderColor: 'var(--posi-border)' }}
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 leading-none shrink-0"
                    style={{
                      color: 'var(--posi-accent)',
                      border: '1px solid var(--posi-accent)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {f.abbr}
                  </span>
                  <h2
                    className="text-sm font-semibold leading-tight"
                    style={{ color: 'var(--posi-text)' }}
                  >
                    {f.label}
                  </h2>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PQF METHODOLOGY CTA ──────────────────────────────── */}
      <section style={{ background: 'var(--posi-surface)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pl-7"
            style={{ borderLeft: '4px solid var(--posi-accent)' }}
          >
            <div className="max-w-2xl">
              <h2
                className="font-bold mb-3 leading-tight"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  color: 'var(--posi-text)',
                  letterSpacing: '0.01em',
                }}
              >
                Evidence-based Quality Assessment
              </h2>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--posi-muted)', maxWidth: '60ch' }}>
                PQF evaluates journals across six dimensions with publicly auditable evidence.
                PQF is not an Impact Factor and must not be used for researcher evaluation,
                hiring, promotion, or funding decisions.
              </p>
              {/* Formula breakdown */}
              <div className="flex flex-wrap gap-2">
                {[
                  { code: 'JTF', pct: '25%', label: 'Transparency' },
                  { code: 'MQF', pct: '25%', label: 'Metadata' },
                  { code: 'EGF', pct: '20%', label: 'Governance' },
                  { code: 'TDF', pct: '15%', label: 'Discoverability' },
                  { code: 'CVF', pct: '10%', label: 'Citations' },
                  { code: 'RIF', pct: '5%',  label: 'Integrity' },
                ].map(d => (
                  <div
                    key={d.code}
                    className="flex items-center gap-1.5 px-2.5 py-1.5"
                    style={{ border: '1px solid var(--posi-border)' }}
                  >
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
                    >
                      {d.code}
                    </span>
                    <span
                      className="text-[9px] font-bold"
                      style={{ color: 'var(--posi-text)', fontFamily: 'var(--font-mono)' }}
                    >
                      {d.pct}
                    </span>
                    <span className="text-[9px]" style={{ color: 'var(--posi-muted)' }}>
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/pqf"
              className="shrink-0 px-7 py-3 text-sm font-semibold text-white transition-colors"
              style={{ background: 'var(--posi-accent)', fontFamily: 'var(--font-body)' }}
              onMouseEnter={undefined}
            >
              View Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* ── PLATFORM STATS ───────────────────────────────────── */}
      <section style={{ background: 'var(--posi-bg)', borderTop: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">

          <p
            className="text-[9px] font-bold uppercase tracking-[0.2em] mb-10"
            style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
          >
            Platform Coverage
          </p>

          <div className="grid sm:grid-cols-3 gap-0" style={{ border: '1px solid var(--posi-border)' }}>
            {[
              {
                title: 'Journal Records',
                items: [
                  { label: 'PSG Journals',       value: stats.psg_journals },
                  { label: 'Other Verified',     value: stats.indexed_journals },
                  { label: 'Extended Records',   value: stats.discovered_journals },
                ],
              },
              {
                title: 'Metadata Coverage',
                items: [
                  { label: 'DOI Records',       value: stats.total_doi_records },
                  { label: 'Crossref Verified', value: stats.crossref_verified },
                  { label: 'OpenAlex Matched',  value: stats.openalex_matched },
                ],
              },
              {
                title: 'Open Access',
                items: [
                  { label: 'DOAJ Listed',       value: stats.doaj_listed },
                  { label: 'Open Citations',    value: stats.open_citation_records },
                  { label: 'Avg. MQS',          value: `${stats.avg_metadata_quality}/100` },
                ],
              },
            ].map((group, gi) => (
              <div
                key={group.title}
                className="p-7"
                style={{
                  background: 'var(--posi-surface)',
                  borderRight: gi < 2 ? '1px solid var(--posi-border)' : undefined,
                }}
              >
                <p
                  className="text-[9px] font-bold uppercase tracking-[0.16em] mb-6"
                  style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
                >
                  {group.title}
                </p>
                <div className="space-y-5">
                  {group.items.map(item => (
                    <div key={item.label} className="flex justify-between items-baseline gap-4">
                      <span className="text-xs" style={{ color: 'var(--posi-muted)' }}>
                        {item.label}
                      </span>
                      <span
                        className="text-xl font-bold shrink-0"
                        style={{ color: 'var(--posi-text)', fontFamily: 'var(--font-mono)' }}
                      >
                        {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DATA SOURCES STRIP ───────────────────────────────── */}
      <section style={{ background: 'var(--posi-surface)', borderTop: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em] shrink-0"
              style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Data Sources
            </span>
            <div
              className="flex flex-wrap gap-x-5 gap-y-1"
              style={{ color: 'var(--posi-muted)' }}
            >
              {['Crossref', 'OpenAlex', 'OpenCitations', 'DOAJ', 'ROR', 'ORCID', 'OAI-PMH'].map(src => (
                <span
                  key={src}
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {src}
                </span>
              ))}
            </div>
            <Link
              href="/data-sources"
              className="sm:ml-auto shrink-0 text-xs hover:underline transition-colors"
              style={{ color: 'var(--posi-accent)', fontFamily: 'var(--font-mono)' }}
            >
              Data Sources &amp; Provenance →
            </Link>
          </div>
        </div>
      </section>

      {/* ── RESPONSIBLE USE NOTICE ───────────────────────────── */}
      <section style={{ background: 'var(--posi-bg)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="p-5 pl-6"
            style={{
              borderLeft: '3px solid var(--posi-accent)',
              background: 'var(--posi-surface)',
              border: '1px solid var(--posi-border)',
              borderLeftWidth: '3px',
              borderLeftColor: 'var(--posi-accent)',
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              <strong style={{ color: 'var(--posi-text)', fontWeight: 600 }}>Responsible Use Notice: </strong>
              POSI is an open scholarly metadata platform. PQF scores indicate metadata completeness,
              transparency, and technical discoverability only. POSI is not a replacement for Web of Science,
              Scopus, DOAJ, or any official indexing service. PQF must not be used for individual researcher
              evaluation, hiring, promotion, funding decisions, or institutional ranking. Some journals listed
              in POSI are published by Panorama Scholarly Group, which also operates this platform.{' '}
              <Link href="/about" style={{ color: 'var(--posi-accent)' }}>
                Read our conflict of interest disclosure.
              </Link>
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
