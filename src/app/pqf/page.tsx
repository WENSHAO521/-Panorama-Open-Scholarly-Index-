import Link from 'next/link'
import type { Metadata } from 'next'
import { PSG_JOURNALS, ALL_JOURNALS } from '@/lib/data'

export const metadata: Metadata = {
  title: 'POSI Quality Factor Methodology | POSI',
  description: 'PQF is a composite, evidence-based indicator for journal transparency, metadata quality, editorial governance, technical discoverability, open citation visibility, and research integrity readiness.',
}

const SUBFACTORS = [
  {
    abbr: 'JTF', name: 'Journal Transparency Factor', weight: '25', max: 25,
    desc: 'Assesses the openness of a journal\'s governance, editorial policies, author charges, and reviewer guidelines.',
    items: [
      { label: 'Aim & Scope publicly accessible', pts: 3 },
      { label: 'Peer Review Process clearly stated', pts: 4 },
      { label: 'Editorial Board publicly listed', pts: 3 },
      { label: 'APC policy clearly disclosed', pts: 3 },
      { label: 'APC waiver / discount policy published', pts: 2 },
      { label: 'Open Access policy clearly stated', pts: 3 },
      { label: 'Copyright & License clearly stated per article', pts: 3 },
      { label: 'Publication Ethics policy (COPE or equivalent)', pts: 2 },
      { label: 'Corrections / Retractions policy stated', pts: 2 },
    ],
  },
  {
    abbr: 'MQF', name: 'Metadata Quality Factor', weight: '25', max: 25,
    desc: 'Evaluates article-level metadata completeness including identifiers, abstracts, keywords, and reference lists.',
    items: [
      { label: 'DOI registered with Crossref for all articles', pts: 4 },
      { label: 'Crossref metadata complete (title, author, date)', pts: 4 },
      { label: 'Author names structured (given + family)', pts: 3 },
      { label: 'ORCID supplied for at least one author per article', pts: 3 },
      { label: 'Abstract and keywords in metadata record', pts: 3 },
      { label: 'Reference list deposited and parseable', pts: 3 },
      { label: 'License URI in Crossref metadata', pts: 2 },
      { label: 'PDF / HTML full-text link stable and accessible', pts: 2 },
      { label: 'Article type clearly identified', pts: 1 },
    ],
  },
  {
    abbr: 'EGF', name: 'Editorial Governance Factor', weight: '20', max: 20,
    desc: 'Measures editorial board transparency, geographic diversity, and reviewer independence.',
    items: [
      { label: 'Editor-in-Chief named with institutional affiliation', pts: 3 },
      { label: 'Editorial board listed publicly with affiliations', pts: 3 },
      { label: 'Editorial board institutional affiliations disclosed', pts: 3 },
      { label: 'Editorial board spans at least 3 countries/regions', pts: 2 },
      { label: 'Reviewer guidelines publicly available', pts: 2 },
      { label: 'Author contribution policy stated', pts: 2 },
      { label: 'Conflict of interest disclosure required from authors', pts: 2 },
      { label: 'AI use policy in editorial workflow stated', pts: 1 },
      { label: 'Complaints and appeals policy published', pts: 2 },
    ],
  },
  {
    abbr: 'TDF', name: 'Technical Discoverability Factor', weight: '15', max: 15,
    desc: 'Assesses how well a journal exposes its content to indexing systems, search engines, and aggregators.',
    items: [
      { label: 'sitemap.xml accessible and up-to-date', pts: 2 },
      { label: 'robots.txt permits academic crawlers', pts: 2 },
      { label: 'OAI-PMH endpoint active and returns Dublin Core', pts: 3 },
      { label: 'Schema.org JSON-LD on article pages', pts: 2 },
      { label: 'Google Scholar citation meta tags on article pages', pts: 2 },
      { label: 'DOI links resolve correctly (< 5% broken)', pts: 2 },
      { label: 'Journal pages accessible without broken links or blank pages', pts: 2 },
    ],
  },
  {
    abbr: 'CVF', name: 'Citation Visibility Factor', weight: '10', max: 10,
    desc: 'Evaluates whether journal citations are open, machine-readable, and tracked by open infrastructure.',
    items: [
      { label: 'Crossref cited-by data detectable', pts: 2 },
      { label: 'OpenAlex source record exists and matchable', pts: 2 },
      { label: 'OpenCitations data detectable', pts: 2 },
      { label: 'Open reference lists deposited with Crossref (I4OC)', pts: 2 },
      { label: 'Citation data source clearly attributed', pts: 2 },
    ],
  },
  {
    abbr: 'RIF', name: 'Research Integrity Factor', weight: '5', max: 5,
    desc: 'Evaluates journal policies supporting research integrity, reproducibility, and ethical compliance.',
    items: [
      { label: 'Retraction and correction policy published', pts: 1 },
      { label: 'Plagiarism / similarity detection policy stated', pts: 1 },
      { label: 'Data availability / data sharing policy published', pts: 1 },
      { label: 'Ethics approval / informed consent policy stated', pts: 1 },
      { label: 'Authorship criteria and author disputes policy stated', pts: 1 },
    ],
  },
]

const GRADES = [
  { grade: 'A+', range: '90–100', desc: 'Excellent transparency and metadata quality', color: '#1F7A4D' },
  { grade: 'A',  range: '80–89',  desc: 'Strong journal quality infrastructure',      color: '#1F7A4D' },
  { grade: 'B+', range: '70–79',  desc: 'Good journal infrastructure',                color: '#1e3a5f' },
  { grade: 'B',  range: '60–69',  desc: 'Satisfactory but improvable',                color: '#1e3a5f' },
  { grade: 'C',  range: '50–59',  desc: 'Developing',                                 color: '#B7791F' },
  { grade: 'D',  range: '40–49',  desc: 'Early stage',                                color: '#6B7280' },
  { grade: 'E',  range: '<40',    desc: 'Insufficient public evidence',               color: '#9CA3AF' },
]

export default function PqfPage() {
  const journalsWithPqf = ALL_JOURNALS.filter(j => j.pqf ?? j.ojqf)
    .sort((a, b) => ((b.pqf ?? b.ojqf)!.total) - ((a.pqf ?? a.ojqf)!.total))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="text-xs flex items-center gap-1.5 mb-6" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>POSI Quality Factor</span>
      </nav>

      {/* Title */}
      <div className="border-l-4 border-[#c41e3a] pl-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">PQF</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">2026</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">POSI Quality Factor Methodology</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          The POSI Quality Factor is a composite, evidence-based indicator designed to assess journal transparency,
          metadata quality, editorial governance, technical discoverability, open citation visibility,
          and research integrity readiness through publicly auditable evidence.
        </p>
      </div>

      {/* Official definition */}
      <section className="bg-white border border-gray-200 mb-6 p-5">
        <p className="text-xs leading-relaxed text-gray-700 mb-3">
          <strong>PQF is not a Journal Impact Factor.</strong> It is not a citation impact metric and is not a
          substitute for Web of Science, Scopus, DOAJ, or any other indexing or accreditation service.
          PQF scores indicate metadata completeness, transparency readiness, and technical discoverability only.
        </p>
        <p className="text-xs leading-relaxed text-gray-600">
          <strong>PQF should not be used</strong> for individual researcher evaluation, hiring decisions,
          promotion criteria, funding allocation, or institutional ranking.
        </p>
      </section>

      {/* Formula */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Scoring Formula</h2>
        </div>
        <div className="p-5">
          <div className="font-mono text-sm text-gray-800 bg-gray-50 border border-gray-200 px-4 py-3 mb-4">
            PQF = 0.25·JTF + 0.25·MQF + 0.20·EGF + 0.15·TDF + 0.10·CVF + 0.05·RIF
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-px bg-gray-200 border border-gray-200">
            {SUBFACTORS.map(sf => (
              <div key={sf.abbr} className="bg-white px-3 py-2 text-center">
                <div className="text-[10px] font-mono font-bold text-[#c41e3a]">{sf.abbr}</div>
                <div className="text-base font-bold font-mono text-gray-900">{sf.weight}</div>
                <div className="text-[10px] text-gray-400">pts max</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Each criterion is binary (met / not met). Points are allocated proportionally to criteria satisfied
            within each subfactor. Maximum total score is 100.
          </p>
        </div>
      </section>

      {/* Grade scale */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Grade Scale</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-2 font-semibold text-gray-500 w-16">Grade</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500 w-24">Score</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody>
              {GRADES.map(g => (
                <tr key={g.grade} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2">
                    <span className="font-mono font-bold text-sm" style={{ color: g.color }}>{g.grade}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-gray-600">{g.range}</td>
                  <td className="px-4 py-2 text-gray-600">{g.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Journal scores */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100 flex items-baseline justify-between">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Journal PQF Scores — 2026</h2>
          <span className="text-[10px] text-gray-400 font-mono">Assessed 2026-06-22</span>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2 font-semibold text-gray-500">Journal</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-500">Publisher</th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">JTF<span className="font-normal text-gray-400">/25</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">MQF<span className="font-normal text-gray-400">/25</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">EGF<span className="font-normal text-gray-400">/20</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">TDF<span className="font-normal text-gray-400">/15</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">CVF<span className="font-normal text-gray-400">/10</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">RIF<span className="font-normal text-gray-400">/5</span></th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500">Total</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500">Grade</th>
              </tr>
            </thead>
            <tbody>
              {journalsWithPqf.map(j => {
                const pqf = (j.pqf ?? j.ojqf)!
                const gradeData = GRADES.find(g => g.grade === pqf.grade)
                return (
                  <tr key={j.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5">
                      <Link href={`/journal/${j.journal_code}`} className="font-medium text-gray-800 hover:text-[#c41e3a] transition-colors">
                        {j.short_title}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-[11px]">
                      {j.publisher}
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.jtf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.mqf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.egf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.tdf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.cvf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.rif ?? 0}</td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-gray-800">{pqf.total}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-mono font-bold" style={{ color: gradeData?.color ?? '#6B7280' }}>{pqf.grade}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {journalsWithPqf.map(j => {
            const pqf = (j.pqf ?? j.ojqf)!
            const gradeData = GRADES.find(g => g.grade === pqf.grade)
            return (
              <div key={j.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <Link href={`/journal/${j.journal_code}`} className="text-xs font-semibold text-gray-800 hover:text-[#c41e3a] transition-colors">
                      {j.short_title}
                    </Link>
                    <p className="text-[10px] text-gray-400 mt-0.5">{j.publisher}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-bold font-mono leading-none" style={{ color: gradeData?.color ?? '#6B7280' }}>{pqf.total}</span>
                    <span className="block text-xs font-mono font-bold" style={{ color: gradeData?.color ?? '#6B7280' }}>{pqf.grade}</span>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[
                    { abbr: 'JTF', val: pqf.subfactors.jtf, max: 25 },
                    { abbr: 'MQF', val: pqf.subfactors.mqf, max: 25 },
                    { abbr: 'EGF', val: pqf.subfactors.egf, max: 20 },
                    { abbr: 'TDF', val: pqf.subfactors.tdf, max: 15 },
                    { abbr: 'CVF', val: pqf.subfactors.cvf, max: 10 },
                    { abbr: 'RIF', val: pqf.subfactors.rif ?? 0, max: 5 },
                  ].map(sf => (
                    <div key={sf.abbr} className="text-center py-1.5" style={{ background: '#f9fafb' }}>
                      <div className="text-[9px] font-mono font-bold" style={{ color: '#c41e3a' }}>{sf.abbr}</div>
                      <div className="text-xs font-mono font-semibold text-gray-700">{sf.val}</div>
                      <div className="text-[9px] text-gray-400">/{sf.max}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Subfactor details */}
      <div className="space-y-4 mb-6">
        {SUBFACTORS.map(sf => (
          <section key={sf.abbr} className="bg-white border border-gray-200">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100">
              <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5 leading-none">{sf.abbr}</span>
              <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">{sf.name}</h2>
              <span className="ml-auto text-[11px] font-mono text-gray-400">{sf.weight} pts max</span>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-500 leading-relaxed mb-3">{sf.desc}</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1.5 text-gray-400 font-normal">Criterion</th>
                    <th className="text-right py-1.5 w-12 text-gray-400 font-normal">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {sf.items.map((item, i) => (
                    <tr key={i} className="border-b border-gray-50 last:border-0">
                      <td className="py-1.5 text-gray-600 flex gap-2">
                        <span className="text-gray-300 font-mono shrink-0 w-4 text-right">{i + 1}.</span>
                        {item.label}
                      </td>
                      <td className="py-1.5 text-right font-mono text-gray-500">{item.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {/* Evidence requirements */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Evidence Requirements</h2>
        </div>
        <div className="p-5 grid sm:grid-cols-2 gap-4">
          {[
            { title: 'Open Data Only', body: 'PQF uses only publicly verifiable information. No proprietary databases, no confidential surveys, no internal access required.' },
            { title: 'No Citation Impact', body: 'Citation counts are used solely for open-citation tracking (CVF), not to rank academic value, influence, or prestige.' },
            { title: 'Binary Criteria', body: 'Each criterion is met or not met. No subjective scoring — any independent reviewer can replicate the assessment from public sources.' },
            { title: 'Annual Review', body: 'Scores are reassessed annually. Journals may request an expedited review after documented material improvements.' },
          ].map(p => (
            <div key={p.title} className="border-l-2 border-gray-200 pl-3">
              <h3 className="text-xs font-semibold text-gray-800 mb-1">{p.title}</h3>
              <p className="text-[11px] text-gray-500 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Limitations */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Limitations</h2>
        </div>
        <div className="p-5 space-y-2 text-xs text-gray-600 leading-relaxed">
          <p>PQF does not assess peer review quality, editorial rigor, article scientific merit, or author credentials.</p>
          <p>PQF does not measure journal prestige, disciplinary impact, or citation influence.</p>
          <p>PQF scores reflect the state of publicly available evidence at the time of assessment and may not reflect recent changes.</p>
          <p>PQF is not endorsed by or affiliated with Crossref, OpenAlex, DOAJ, Scopus, Web of Science, or any indexing organization.</p>
        </div>
      </section>

      {/* Responsible Use + COI */}
      <div className="space-y-3 mb-6">
        <div className="p-4 bg-amber-50 border border-amber-200">
          <p className="text-[11px] leading-relaxed text-amber-800">
            <strong>Publisher Conflict of Interest Notice:</strong> PQF scores for journals published by Panorama Scholarly Group (PSG)
            are assessed using the same public criteria as all other journals. Because PSG both operates POSI and publishes the journals it evaluates,
            readers should be aware of this structural conflict of interest. PQF scores are based solely on publicly verifiable criteria.
            Independent third-party verification is encouraged.{' '}
            <Link href="/about" className="underline">Read our full governance disclosure →</Link>
          </p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-200">
          <p className="text-[11px] leading-relaxed text-gray-600">
            <strong>Responsible Use:</strong> PQF is an internal quality framework developed by Panorama Scholarly Group.
            It is not affiliated with Scopus, Web of Science, DOAJ, or any commercial citation index.
            PQF should not be cited as an independent or third-party evaluation of PSG journals.
          </p>
        </div>
      </div>

      {/* Eligibility */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">PQF Eligibility</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2 font-semibold text-gray-500">Record Type</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">PQF Status</th>
                <th className="text-left px-4 py-2 font-semibold text-gray-500">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { type: 'POSI Verified Journal Record (evidence complete)', status: 'Official PQF', note: 'Full manual PQF assessment published in Evidence Registry.' },
                { type: 'POSI Verified Journal Record (under review)', status: 'Preliminary PQF', note: 'Draft scores; subject to change after evidence review.' },
                { type: 'DOAJ-listed auto-imported record', status: 'Automated PQF*', note: 'Computed from DOAJ + Crossref signals. Not manually reviewed.' },
                { type: 'Submitted journal (under review)', status: 'Pending', note: 'Assessment begins after POSI evidence review is complete.' },
                { type: 'Auto-discovered from Crossref / OpenAlex', status: 'Not eligible', note: 'Metadata only. PQF requires a minimum evidence baseline.' },
                { type: 'PSG-published journal', status: 'Official PQF (with COI disclosure)', note: 'Assessed under same criteria; conflict of interest disclosed.' },
              ].map(row => (
                <tr key={row.type} className="border-b border-gray-50 last:border-0">
                  <td className="px-5 py-2.5 text-gray-700">{row.type}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono font-semibold text-[11px]" style={{
                      color: row.status.startsWith('Official') ? '#1F7A4D'
                           : row.status.startsWith('Automated') ? '#B7791F'
                           : row.status === 'Pending' ? '#1d4ed8'
                           : row.status === 'Not eligible' ? '#6B7280'
                           : 'var(--posi-text)'
                    }}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 text-[10px]" style={{ color: '#6B7280', borderTop: '1px solid #f3f4f6' }}>
          * Automated PQF grades are shown with an asterisk (PQF*) throughout the platform to distinguish them from Official PQF grades.
        </div>
      </section>

      {/* Version History */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Version History</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {[
            {
              version: 'PQF v1.0',
              date: '2026-06-22',
              status: 'Current',
              notes: 'Initial public release. Six subfactors (JTF, MQF, EGF, TDF, CVF, RIF). 100-point scale. Binary criteria. A+ through E grade scale.',
            },
            {
              version: 'PQF v1.0-auto',
              date: '2026-06-22',
              status: 'Current',
              notes: 'Automated variant computed from DOAJ and Crossref signals. Used for DOAJ-listed journals pending manual review. Not equivalent to official PQF v1.0.',
            },
          ].map(v => (
            <div key={v.version} className="px-5 py-3 flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="shrink-0 sm:w-40">
                <p className="font-mono font-bold text-[11px]" style={{ color: 'var(--posi-primary)' }}>{v.version}</p>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{v.date}</p>
                <span className="text-[10px] font-medium px-1.5 py-0.5 mt-1 inline-block" style={{ background: '#f0fdf4', color: '#1F7A4D', border: '1px solid #bbf7d0' }}>{v.status}</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{v.notes}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
