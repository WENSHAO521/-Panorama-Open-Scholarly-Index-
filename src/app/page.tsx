import Link from 'next/link'
import { SearchBar } from '@/components/SearchBar'
import { getStats } from '@/lib/data'

export const revalidate = 3600

export const metadata = {
  title: 'Panorama Open Scholarly Index | POSI',
  description:
    'POSI is an open scholarly metadata platform that evaluates journal transparency, metadata quality, technical discoverability, and open citation visibility through publicly auditable evidence.',
}

export default async function HomePage() {
  const stats = {
    ...getStats(),
    last_updated: new Date().toISOString().slice(0, 10),
  }

  return (
    <div className="min-h-[100dvh]">

      {/* ── HERO ── */}
      <section style={{ background: 'var(--posi-primary)' }}>
        <div className="max-w-[1400px] mx-auto">

          {/* Asymmetric split: POSI pillar (left) | content (right) */}
          <div className="flex flex-col md:flex-row">

            {/* Left: POSI brand pillar */}
            <div
              className="px-6 sm:px-8 pt-12 pb-6 md:pt-16 md:pb-16 shrink-0 md:w-[280px] lg:w-[320px] xl:w-[360px]"
            >
              <div aria-hidden="true" className="select-none">
                <div
                  className="font-bold leading-none"
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(4.5rem, 12vw, 7.5rem)',
                    color: 'var(--posi-accent)',
                    letterSpacing: '-0.02em',
                    fontWeight: 800,
                  }}
                >
                  POSI
                </div>

                {/* Structural rule stack — Bauhaus horizontal rhythm */}
                <div className="mt-5 space-y-2">
                  <div style={{ height: '1px', width: '100%', background: 'rgba(255,255,255,0.12)' }} />
                  <div style={{ height: '1px', width: '62%',  background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ height: '1px', width: '30%',  background: 'rgba(255,255,255,0.03)' }} />
                </div>

                <p
                  className="mt-5 text-[9px] uppercase"
                  style={{
                    color: 'rgba(255,255,255,0.2)',
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.24em',
                  }}
                >
                  Open Access
                </p>
              </div>
            </div>

            {/* Vertical divider — desktop only */}
            <div
              className="hidden md:block w-px shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            />

            {/* Right: Platform content */}
            <div className="px-6 sm:px-8 lg:px-12 pt-2 md:pt-16 pb-12 flex-1 flex flex-col justify-center">
              <h1
                className="font-bold leading-tight mb-4"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.5rem, 3.2vw, 2.75rem)',
                  color: 'rgba(255,255,255,0.92)',
                  letterSpacing: '0.01em',
                }}
              >
                Panorama Open Scholarly Index
              </h1>
              <p
                className="mb-8 leading-relaxed"
                style={{
                  color: 'rgba(255,255,255,0.45)',
                  maxWidth: '56ch',
                  fontSize: '0.9375rem',
                }}
              >
                Open journal metadata and policy evidence platform. Evaluate journal transparency,
                metadata quality, technical discoverability, and policy compliance through
                publicly auditable evidence.
              </p>
              <SearchBar />
              <nav
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
                aria-label="Quick links"
              >
                {[
                  { href: '/journals',   label: 'Journals' },
                  { href: '/articles',   label: 'Articles' },
                  { href: '/doi-lookup', label: 'DOI Lookup' },
                  { href: '/pqf',        label: 'PQF Methodology' },
                  { href: '/evidence',   label: 'Evidence Registry' },
                ].map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-xs uppercase tracking-[0.1em] transition-colors hover:text-white"
                    style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}
                  >
                    {link.label} /
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {[
                { value: (stats.psg_journals + stats.indexed_journals).toLocaleString(), label: 'POSI Verified Journal Records',   note: 'Manually reviewed & evidence-checked' },
                { value: stats.discovered_journals.toLocaleString(),                     label: 'Auto-discovered Journal Records', note: 'From DOAJ, Crossref & OpenAlex' },
                { value: stats.total_doi_records.toLocaleString(),                       label: 'DOI Metadata Records',            note: 'DOI-registered articles via Crossref' },
                { value: '250M+',                                                         label: 'External Searchable Records',     note: 'Search scope via OpenAlex' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className="py-7 px-6"
                  style={{
                    borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : undefined,
                  }}
                >
                  <p
                    className="text-3xl md:text-4xl font-bold text-white leading-none"
                    style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {s.value}
                  </p>
                  <p
                    className="text-[9px] uppercase tracking-[0.16em] mt-2.5"
                    style={{ color: 'rgba(255,255,255,0.28)', fontFamily: 'var(--font-mono)' }}
                  >
                    {s.label}
                  </p>
                  <p
                    className="text-[8px] mt-1"
                    style={{ color: 'rgba(255,255,255,0.14)', fontFamily: 'var(--font-mono)' }}
                  >
                    {s.note}
                  </p>
                </div>
              ))}
            </div>
            <p
              className="pb-2 px-6 text-[9px]"
              style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'var(--font-mono)' }}
            >
              Updated {stats.last_updated}
            </p>
            <p
              className="pb-4 px-6 text-[9px] leading-relaxed max-w-3xl"
              style={{ color: 'rgba(255,255,255,0.12)', fontFamily: 'var(--font-mono)' }}
            >
              POSI Verified and Auto-discovered records are maintained by POSI. DOI Metadata Records are
              DOI-registered articles indexed via Crossref. External Searchable Records represent the
              search scope via OpenAlex and are not equivalent to POSI-reviewed records.
            </p>
          </div>
        </div>
      </section>

      {/* ── CORE INDICATORS ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-4">
            {[
              {
                abbr: 'PQF',
                label: 'POSI Quality Framework',
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
                desc: 'Open citation visibility currently derived from Crossref and OpenAlex. OpenCitations integration is planned. Only open, attributed, machine-readable citation data.',
              },
              {
                abbr: 'IRS',
                label: 'Indexing Readiness Score',
                desc: 'Technical readiness assessment for common scholarly indexing: OAI-PMH, sitemap, DOI resolution, Schema.org, and Google Scholar discoverability.',
              },
            ].map((f, i) => (
              <div
                key={f.abbr}
                className="p-7"
                style={{
                  borderRight: i < 3 ? '1px solid var(--posi-border)' : undefined,
                }}
              >
                {/* DIN-style: mono abbreviation + rule divider */}
                <div className="mb-5">
                  <span
                    className="block font-bold leading-none"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--posi-accent)',
                      fontSize: '1.5rem',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {f.abbr}
                  </span>
                  <div
                    className="mt-3"
                    style={{ height: '1px', width: '2rem', background: 'var(--posi-border)' }}
                  />
                </div>
                <h2
                  className="text-sm font-semibold mb-3 leading-tight"
                  style={{ color: 'var(--posi-text)' }}
                >
                  {f.label}
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PQF METHODOLOGY CTA ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pl-7"
            style={{ borderLeft: '3px solid var(--posi-accent)' }}
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
                Evidence-based Journal Quality Assessment
              </h2>
              <p
                className="text-sm leading-relaxed mb-5"
                style={{ color: 'var(--posi-muted)', maxWidth: '60ch' }}
              >
                PQF evaluates journal transparency, metadata quality, editorial governance,
                technical discoverability, open citation visibility, and research integrity
                readiness through publicly auditable evidence.
                PQF is not an Impact Factor and must not be used for researcher evaluation,
                hiring, promotion, or funding decisions.
              </p>
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
              className="shrink-0 px-7 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--posi-accent)', fontFamily: 'var(--font-body)' }}
            >
              View Methodology
            </Link>
          </div>
        </div>
      </section>

      {/* ── PLATFORM COVERAGE ── */}
      <section style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid sm:grid-cols-3 gap-0" style={{ border: '1px solid var(--posi-border)' }}>
            {[
              {
                title: 'Journal Records',
                items: [
                  { label: 'PSG Verified',   value: stats.psg_journals },
                  { label: 'Other Verified', value: stats.indexed_journals },
                  { label: 'Auto-discovered', value: stats.discovered_journals },
                ],
              },
              {
                title: 'External Metadata',
                items: [
                  { label: 'DOI Metadata Records', value: stats.total_doi_records },
                  { label: 'Crossref Verified',     value: stats.crossref_verified },
                  { label: 'OpenAlex Matched',      value: stats.openalex_matched },
                ],
              },
              {
                title: 'Open Access & Citations',
                items: [
                  { label: 'DOAJ-listed Records',         value: stats.doaj_listed },
                  { label: 'Citation Visibility Signals', value: stats.open_citation_records },
                  { label: 'Avg. MQS',                    value: `${stats.avg_metadata_quality}/100` },
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
                  className="text-[9px] font-bold uppercase tracking-[0.18em] mb-6"
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
                        style={{ color: 'var(--posi-text)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}
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

      {/* ── DATA SOURCES STRIP ── */}
      <section style={{ background: 'var(--posi-surface)', borderBottom: '1px solid var(--posi-border)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span
              className="text-[9px] font-bold uppercase tracking-[0.18em] shrink-0"
              style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
            >
              Data Sources
            </span>
            <div className="flex flex-wrap gap-x-5 gap-y-1">
              {['Crossref', 'OpenAlex', 'DOAJ', 'ROR', 'ORCID', 'OAI-PMH'].map(src => (
                <span
                  key={src}
                  className="text-xs"
                  style={{ color: 'var(--posi-muted)', fontFamily: 'var(--font-mono)' }}
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
              Data Sources & Provenance →
            </Link>
          </div>
        </div>
      </section>

      {/* ── RESPONSIBLE USE NOTICE ── */}
      <section style={{ background: 'var(--posi-bg)' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div
            className="p-5 pl-6"
            style={{
              background: 'var(--posi-surface)',
              border: '1px solid var(--posi-border)',
              borderLeftWidth: '3px',
              borderLeftColor: 'var(--posi-accent)',
            }}
          >
            <p className="text-xs leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
              <strong style={{ color: 'var(--posi-text)', fontWeight: 600 }}>
                Responsible Use Notice:{' '}
              </strong>
              POSI is an open scholarly metadata platform. PQF scores indicate metadata completeness,
              transparency, and technical discoverability only. POSI is not a replacement for Web of
              Science, Scopus, DOAJ, or any official indexing service. PQF must not be used for
              individual researcher evaluation, hiring, promotion, funding decisions, or institutional
              ranking. Some journals in POSI are published by Panorama Scholarly Group, which also
              operates this platform.{' '}
              <Link href="/coi" style={{ color: 'var(--posi-accent)' }}>
                Read our conflict of interest disclosure.
              </Link>
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
