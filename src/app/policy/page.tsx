import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Journal Inclusion and Verification Policy | POSI',
  description:
    'POSI uses a hybrid inclusion model combining automatic metadata discovery, journal-initiated submission, and evidence-based manual verification. This policy defines how records are discovered, verified, and assessed.',
}

function SectionHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="px-5 py-3 border-b border-gray-100">
      <div className="flex items-center gap-2.5">
        <span className="text-[9px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5 leading-none shrink-0">{num}</span>
        <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">{title}</h2>
      </div>
    </div>
  )
}

const RECORD_STATUSES = [
  { status: 'discovered',    en: 'The record was found from public metadata sources but has not yet been imported.' },
  { status: 'imported',      en: 'The record has been imported into POSI as a metadata record.' },
  { status: 'unverified',    en: 'The record exists in POSI but has not passed manual verification.' },
  { status: 'submitted',     en: 'The journal has submitted information for POSI review.' },
  { status: 'under_review',  en: 'POSI is reviewing the record against public evidence criteria.' },
  { status: 'verified',      en: 'The record has passed POSI evidence-based verification.' },
  { status: 'pqf_evaluated', en: 'The journal has received a POSI Quality Framework (PQF) assessment.' },
  { status: 'excluded',      en: 'The record does not meet POSI inclusion or evidence criteria.' },
  { status: 'removed',       en: 'The record has been removed from public display or active indexing.' },
]

const PQF_RULES = [
  { type: 'Extended record',                    display: 'No full PQF' },
  { type: 'Imported but unverified record',    display: 'No full PQF' },
  { type: 'Submitted record',                  display: 'Preliminary review only' },
  { type: 'Under review record',               display: 'PQF pending' },
  { type: 'Verified record',                   display: 'Eligible for full PQF' },
  { type: 'Verified with sufficient evidence', display: 'Full PQF displayed' },
  { type: 'Publisher-owned journal',           display: 'Full PQF + COI notice required' },
]

const WORKFLOW_STEPS = [
  {
    step: 1, title: 'Automatic Discovery',
    en: 'POSI automatically discovers journal and article metadata from public sources.',
    statuses: ['discovered', 'imported', 'unverified'],
  },
  {
    step: 2, title: 'Metadata Import',
    en: 'Basic metadata is imported into POSI. No verification claim. No full PQF.',
    statuses: [],
  },
  {
    step: 3, title: 'Journal Submission',
    en: 'A journal may submit additional information and evidence for review.',
    statuses: ['submitted', 'under_review'],
  },
  {
    step: 4, title: 'Evidence Review',
    en: 'POSI checks public evidence and verifies record accuracy.',
    statuses: ['verified', 'excluded'],
  },
  {
    step: 5, title: 'PQF Assessment',
    en: 'Verified journals with sufficient evidence may receive PQF evaluation.',
    statuses: ['pqf_evaluated'],
  },
  {
    step: 6, title: 'Public Display',
    en: 'The record is displayed with status labels, evidence links, and responsible use notices.',
    statuses: [],
  },
]

export default function PolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5 mb-6" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Journal Inclusion Policy</span>
      </nav>

      {/* Header */}
      <div className="border-l-4 border-[#c41e3a] pl-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">POLICY</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">2026</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Journal Inclusion and Verification Policy</h1>
        <p className="text-sm text-gray-500 mt-3 max-w-2xl leading-relaxed">
          POSI uses a hybrid journal inclusion model combining automatic metadata discovery,
          journal-initiated submission, and evidence-based manual verification.
        </p>
      </div>

      {/* Section 1: Overview */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="1" title="Overview" />
        <div className="p-5 text-xs leading-relaxed text-gray-600 space-y-2">
          <p>
            POSI does not treat every automatically discovered record as a POSI Verified Journal Record.
            Automatically discovered records are clearly marked as unverified metadata records until they pass
            POSI's public evidence review.
          </p>
        </div>
      </section>

      {/* Section 2: Inclusion Model */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="2" title="Inclusion Model" />
        <div className="divide-y divide-gray-50">
          <div className="p-5">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2">2.1 — Extended Metadata Record</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              An extended metadata record is identified through open scholarly metadata sources such as
              Crossref, OpenAlex, DOAJ, OAI-PMH, or other public metadata infrastructures.
              These records do <strong>not</strong> imply POSI verification, endorsement, accreditation, or quality recognition.
            </p>
            <div className="mt-3 px-3 py-2 text-[11px] font-mono" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
              <div style={{ color: 'var(--posi-muted)' }}>Status: <span className="text-gray-700">Extended metadata record</span></div>
              <div style={{ color: 'var(--posi-muted)' }}>Verified: <span className="text-gray-700">Not yet verified by POSI</span></div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2">2.2 — Submitted Journal Record</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              Created when a journal, publisher, editor, or authorized representative submits journal information to POSI for review.
              Submitted records enter a review queue and are checked against POSI's public evidence criteria.
            </p>
            <div className="mt-3 px-3 py-2 text-[11px] font-mono" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
              <div style={{ color: 'var(--posi-muted)' }}>Status: <span className="text-gray-700">Submitted for POSI review</span></div>
              <div style={{ color: 'var(--posi-muted)' }}>Review: <span className="text-gray-700">Under evidence review</span></div>
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-2">2.3 — POSI Verified Journal Record</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-2">
              A journal record that has passed POSI's evidence-based verification process.
              Verified records may become eligible for full PQF assessment, provided sufficient public evidence is available.
            </p>
            <div className="mt-3 px-3 py-2 text-[11px] font-mono" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)' }}>
              <div style={{ color: 'var(--posi-muted)' }}>Status: <span style={{ color: '#1F7A4D' }}>POSI Verified Journal Record</span></div>
              <div style={{ color: 'var(--posi-muted)' }}>Evidence: <span className="text-gray-700">Available</span></div>
              <div style={{ color: 'var(--posi-muted)' }}>PQF: <span className="text-gray-700">Eligible for assessment</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Record Status System */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="3" title="Record Status System" />
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2 font-semibold text-gray-500 w-36">Status</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {RECORD_STATUSES.map(s => (
                <tr key={s.status} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5 font-mono text-[11px]" style={{ color: 'var(--posi-accent)' }}>{s.status}</td>
                  <td className="px-4 py-2.5 text-gray-600">{s.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Data Sources */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="4" title="Data Sources" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">POSI may discover or enrich records using the following sources. Source attribution and metadata provenance are preserved wherever possible.</p>
          <div className="mt-3 grid sm:grid-cols-2 gap-1">
            {['Crossref', 'OpenAlex', 'OpenCitations', 'DOAJ', 'OAI-PMH', 'ROR', 'ORCID', 'Publisher websites', 'Journal websites', 'Public policy pages'].map(src => (
              <div key={src} className="text-[11px] font-mono px-2 py-1" style={{ background: 'var(--posi-bg)', color: 'var(--posi-text)' }}>{src}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Automatic Metadata Discovery */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="5" title="Automatic Metadata Discovery" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">Automatic discovery may include the following metadata fields:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[11px] text-gray-600">
            {[
              'Journal title', 'ISSN / eISSN', 'Publisher', 'Country', 'Website URL', 'DOI prefix',
              'Article title', 'Authors', 'Abstract', 'Keywords', 'Publication date', 'Volume / issue / pages',
              'DOI', 'License', 'References', 'PDF / HTML links', 'OpenAlex match', 'Citation visibility data',
            ].map(f => (
              <div key={f} className="px-2 py-1" style={{ background: 'var(--posi-bg)' }}>{f}</div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-4 italic">
            Automatic discovery does not substitute for manual verification. Records must be clearly marked as unverified unless reviewed.
          </p>
        </div>
      </section>

      {/* Section 6: Journal Submission Requirements */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="6" title="Journal Submission Requirements" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">A journal submitted to POSI should provide the following:</p>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-0.5 text-[11px] text-gray-600">
            {[
              'Journal title', 'Journal abbreviation', 'ISSN / eISSN', 'Publisher name',
              'Publisher country', 'Journal website', 'Submission website', 'Open access policy',
              'Peer review policy', 'APC policy', 'Waiver policy', 'Copyright policy',
              'License policy', 'Publication ethics policy', 'Retraction and correction policy',
              'Editorial board page', 'Reviewer guidelines', 'Author guidelines',
              'Data availability policy', 'AI use policy',
              'OAI-PMH endpoint (if available)', 'Crossref DOI prefix (if available)',
              'DOAJ status (if available)', 'Contact email',
            ].map(item => (
              <div key={item} className="py-1 border-b border-gray-50">{item}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 7: Verification Criteria */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="7" title="Verification Criteria" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">A journal may be marked verified only after evidence review. Checks may include:</p>
          <ul className="space-y-1.5 text-[11px] text-gray-600">
            {[
              'Journal website is accessible',
              'Journal title and ISSN are consistent',
              'Publisher information is clear',
              'Editorial board is publicly available',
              'Peer review policy is publicly available',
              'Open access policy is publicly available',
              'APC or fee policy is publicly available',
              'Copyright and license information is clear',
              'Publication ethics policy is available',
              'Retraction and correction policy is available',
              'DOI records are resolvable, where applicable',
              'Metadata is available through Crossref, OAI-PMH, or public pages',
              'No obvious false indexing claims are found',
              'No severe transparency gaps are found',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-0.5 text-[#1F7A4D] shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Section 8: PQF Eligibility */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="8" title="POSI Quality Framework (PQF) Eligibility" />
        <div className="p-5 pb-0">
          <p className="text-xs text-gray-600 mb-4">Not every POSI record automatically receives a PQF. Eligibility depends on verification status and evidence completeness.</p>
        </div>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2 font-semibold text-gray-500">Record Type</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">PQF Display Rule</th>
              </tr>
            </thead>
            <tbody>
              {PQF_RULES.map(r => (
                <tr key={r.type} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5 text-gray-700">{r.type}</td>
                  <td className="px-4 py-2.5 text-gray-600">{r.display}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 9: Frontend Display Rules */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="9" title="Frontend Display Rules" />
        <div className="divide-y divide-gray-50">
          {[
            {
              label: '9.1 Extended Record',
              items: [['Status', 'Extended metadata record'], ['Verification', 'Not yet verified by POSI'], ['PQF', 'Not evaluated'], ['Evidence', 'Not reviewed']],
            },
            {
              label: '9.2 Submitted',
              items: [['Status', 'Submitted for POSI review'], ['Verification', 'Under review'], ['PQF', 'Pending'], ['Evidence', 'Under review']],
            },
            {
              label: '9.3 Verified',
              items: [['Status', 'POSI Verified Journal Record'], ['Verification', 'Verified'], ['PQF', 'Available'], ['Evidence', 'Publicly auditable']],
            },
          ].map(section => (
            <div key={section.label} className="p-5">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.1em] mb-3">{section.label}</h3>
              <div className="font-mono text-[11px] divide-y divide-gray-100 border border-gray-100">
                {section.items.map(([key, val]) => (
                  <div key={key} className="flex gap-3 px-3 py-1.5" style={{ background: 'var(--posi-bg)' }}>
                    <span className="w-24 shrink-0" style={{ color: 'var(--posi-muted)' }}>{key}</span>
                    <span className="text-gray-700">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 10: Evidence Registry */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="10" title="Evidence Registry" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">Every verified record and every PQF assessment should be connected to evidence. Evidence may include:</p>
          <div className="grid sm:grid-cols-2 gap-1 text-[11px] text-gray-600">
            {['Journal website', 'Editorial board page', 'Peer review policy page', 'APC policy page', 'Open access policy page', 'Copyright and license page', 'Publication ethics page', 'Retraction policy page', 'Crossref DOI metadata', 'OAI-PMH endpoint', 'DOAJ record', 'OpenAlex source record', 'Sitemap', 'Robots.txt', 'Schema.org metadata', 'Google Scholar citation tags'].map(e => (
              <div key={e} className="px-2 py-1" style={{ background: 'var(--posi-bg)' }}>{e}</div>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/evidence" className="text-xs hover:underline transition-colors" style={{ color: 'var(--posi-accent)' }}>
              View Evidence Registry →
            </Link>
          </div>
        </div>
      </section>

      {/* Section 11: Correction and Removal */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="11" title="Correction and Removal Policy" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">POSI accepts correction requests from journals, publishers, editors, authors, and readers. Requests may concern:</p>
          <ul className="space-y-1 text-[11px] text-gray-600">
            {['Incorrect journal title', 'Incorrect ISSN', 'Incorrect publisher information', 'Broken links', 'Incorrect DOI metadata', 'Incorrect article metadata', 'Outdated policy links', 'Incorrect verification status', 'Incorrect PQF evidence', 'Request for record removal'].map(item => (
              <li key={item} className="flex gap-2"><span className="text-gray-300">—</span>{item}</li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-4">POSI may update, correct, flag, exclude, or remove records where appropriate.</p>
        </div>
      </section>

      {/* Section 12: Responsible Use */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="12" title="Responsible Use Statement" />
        <div className="p-5">
          <p className="text-xs text-gray-600 mb-3">POSI indicators should <strong>not</strong> be used as the sole basis for:</p>
          <div className="grid sm:grid-cols-2 gap-1 text-[11px]">
            {['Researcher evaluation', 'Hiring', 'Promotion', 'Funding decisions', 'Institutional ranking', 'Academic degree evaluation', 'Journal blacklisting'].map(item => (
              <div key={item} className="flex gap-2 px-2 py-1" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                <span className="text-orange-400 shrink-0">✕</span>
                <span className="text-orange-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 13: Conflict of Interest */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="13" title="Conflict of Interest Statement" />
        <div className="p-5">
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            POSI is operated by Panorama Scholarly Group. Some journals listed in POSI may be published by Panorama Scholarly Group.
            Publisher-owned journals are evaluated using the same public criteria as all other records.
            When a journal is published by Panorama Scholarly Group, this relationship must be clearly disclosed on the journal record page.
          </p>
          <div className="mt-4 p-3 text-[11px] leading-relaxed" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' }}>
            <strong>Required disclosure:</strong> This journal is published by Panorama Scholarly Group, the operator of POSI.
            The record is evaluated using the same public evidence criteria as all other POSI records.
          </div>
        </div>
      </section>

      {/* Section 14: Recommended Workflow */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="14" title="Recommended Workflow" />
        <div className="divide-y divide-gray-50">
          {WORKFLOW_STEPS.map(s => (
            <div key={s.step} className="p-4 flex gap-4 items-start">
              <div className="shrink-0 w-7 h-7 flex items-center justify-center font-mono font-bold text-xs text-white" style={{ background: 'var(--posi-accent)' }}>{s.step}</div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800 mb-0.5">{s.title}</div>
                <p className="text-[11px] text-gray-600">{s.en}</p>
                {s.statuses.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {s.statuses.map(st => (
                      <span key={st} className="text-[9px] font-mono px-1.5 py-0.5" style={{ background: 'var(--posi-bg)', color: 'var(--posi-accent)', border: '1px solid var(--posi-border)' }}>
                        {st}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 15: Public Labels */}
      <section className="bg-white border border-gray-200 mb-4">
        <SectionHeader num="15" title="Recommended Public Labels" />
        <div className="p-5">
          <div className="grid sm:grid-cols-2 gap-1.5">
            {[
              'Extended metadata record',
              'Imported metadata record',
              'Unverified record',
              'Submitted for POSI review',
              'Under evidence review',
              'POSI verified journal record',
              'PQF evaluated',
              'Evidence available',
              'Correction requested',
              'Record excluded',
              'Record removed',
            ].map(label => (
              <div key={label} className="text-[11px] font-mono px-3 py-1.5" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)', color: 'var(--posi-text)' }}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 16: Final Summary */}
      <section className="bg-white border border-gray-200 mb-6">
        <SectionHeader num="16" title="Final Policy Summary" />
        <div className="p-5">
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            POSI uses automatic discovery to build open scholarly metadata coverage, journal submissions to improve record accuracy,
            and manual evidence review to establish trust.
          </p>
          <div className="space-y-2">
            {[
              'Automatic discovery ≠ verification',
              'Submission ≠ guaranteed inclusion',
              'Verification ≠ endorsement',
              'PQF = evidence-based transparency indicator, not an Impact Factor or journal ranking',
            ].map(item => (
              <div key={item} className="text-xs p-3 border-l-2 border-[#c41e3a] pl-3 font-medium text-gray-800" style={{ background: 'var(--posi-bg)' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/evidence" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Evidence Registry →</Link>
        <Link href="/submit-journal" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Submit a Journal →</Link>
        <Link href="/about" style={{ color: 'var(--posi-accent)' }} className="hover:underline">About & Governance →</Link>
      </div>
    </div>
  )
}
