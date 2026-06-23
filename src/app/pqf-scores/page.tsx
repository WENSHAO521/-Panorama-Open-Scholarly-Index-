import Link from 'next/link'
import type { Metadata } from 'next'
import { ALL_JOURNALS } from '@/lib/data'

export const metadata: Metadata = {
  title: 'PQF Scores | POSI',
  description: 'POSI Quality Framework scores for all assessed journals. Includes subfactor breakdown across JTF, MQF, EGF, TDF, CVF, and RIF.',
}

const GRADES = [
  { grade: 'A+', range: '90-100', color: '#1F7A4D' },
  { grade: 'A',  range: '80-89',  color: '#1F7A4D' },
  { grade: 'B+', range: '70-79',  color: '#1e3a5f' },
  { grade: 'B',  range: '60-69',  color: '#1e3a5f' },
  { grade: 'C',  range: '50-59',  color: '#B7791F' },
  { grade: 'D',  range: '40-49',  color: '#6B7280' },
  { grade: 'E',  range: '<40',    color: '#9CA3AF' },
]

function gradeColor(grade: string) {
  return GRADES.find(g => g.grade === grade)?.color ?? '#6B7280'
}

export default function PqfScoresPage() {
  const journals = ALL_JOURNALS.filter(j => j.pqf ?? j.ojqf)
    .sort((a, b) => ((b.pqf ?? b.ojqf)!.total) - ((a.pqf ?? a.ojqf)!.total))

  const gradeDist = GRADES.map(g => ({
    ...g,
    count: journals.filter(j => (j.pqf ?? j.ojqf)!.grade === g.grade).length,
  }))

  const avgScore = journals.length
    ? Math.round(journals.reduce((s, j) => s + (j.pqf ?? j.ojqf)!.total, 0) / journals.length)
    : 0

  const officialCount = journals.filter(j => j.pqf?.version === 'PQF v1.0').length
  const autoCount     = journals.filter(j => !j.pqf && j.ojqf).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <nav className="text-xs flex items-center gap-1.5 mb-6" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/pqf" className="hover:text-gray-700">PQF Methodology</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>PQF Scores</span>
      </nav>

      <div className="border-l-4 border-[#c41e3a] pl-5 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">PQF</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">Scores — 2026</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">PQF Scores</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          POSI Quality Framework scores for all assessed journals. Each score reflects performance
          across six subfactors: transparency, metadata quality, editorial governance,
          technical discoverability, citation visibility, and research integrity.
        </p>
      </div>

      {/* Score type notice */}
      <div className="p-4 mb-6" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: '#92400e' }}>
          <strong>Official PQF</strong> scores (marked PQF v1.0) are manually reviewed assessments.
          Scores marked <strong>PQF*</strong> are automated estimates computed from DOAJ and Crossref signals
          and have not been manually verified. Both types are included in this table.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-px bg-gray-200 mb-6" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="bg-white px-5 py-4 text-center">
          <p className="text-2xl font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{journals.length}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--posi-muted)' }}>Assessed Journals</p>
        </div>
        <div className="bg-white px-5 py-4 text-center">
          <p className="text-2xl font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{avgScore}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--posi-muted)' }}>Platform Average</p>
        </div>
        <div className="bg-white px-5 py-4 text-center">
          <p className="text-2xl font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{officialCount}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--posi-muted)' }}>Official Reviews</p>
        </div>
      </div>

      {/* Grade distribution */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Grade Distribution</h2>
        </div>
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {gradeDist.map(g => (
            <div key={g.grade} className="px-3 py-4 text-center">
              <p className="text-2xl font-bold font-mono leading-none" style={{ color: gradeColor(g.grade) }}>{g.grade}</p>
              <p className="text-lg font-bold font-mono mt-2" style={{ color: 'var(--posi-text)' }}>{g.count}</p>
              <p className="text-[9px] uppercase tracking-[0.1em] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{g.range}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scores table — desktop */}
      <section className="bg-white border border-gray-200 mb-6">
        <div className="px-5 py-3 border-b border-gray-100 flex items-baseline justify-between">
          <h2 className="text-xs font-bold text-gray-700 uppercase tracking-[0.1em]">Journal PQF Scores</h2>
          <span className="text-[10px] text-gray-400 font-mono">Assessed 2026-06-22</span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-2 font-semibold text-gray-500">#</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-500">Journal</th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">JTF<span className="font-normal text-gray-400">/25</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">MQF<span className="font-normal text-gray-400">/25</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">EGF<span className="font-normal text-gray-400">/20</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">TDF<span className="font-normal text-gray-400">/15</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">CVF<span className="font-normal text-gray-400">/10</span></th>
                <th className="text-center px-2 py-2 font-semibold text-gray-500">RIF<span className="font-normal text-gray-400">/5</span></th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500">Total</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-500">Grade</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-500">Version</th>
              </tr>
            </thead>
            <tbody>
              {journals.map((j, i) => {
                const pqf = (j.pqf ?? j.ojqf)!
                const isAuto = pqf.version === 'PQF v1.0-auto'
                return (
                  <tr key={j.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-2.5 font-mono text-gray-400 text-[10px]">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/journal/${j.journal_code}`} className="font-medium text-gray-800 hover:text-[#c41e3a] transition-colors">
                        {j.short_title}
                      </Link>
                      <p className="text-[10px] text-gray-400 mt-0.5">{j.publisher}</p>
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.jtf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.mqf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.egf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.tdf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.cvf}</td>
                    <td className="px-2 py-2.5 text-center font-mono text-gray-600">{pqf.subfactors.rif ?? 0}</td>
                    <td className="px-3 py-2.5 text-center font-mono font-bold text-gray-800">{pqf.total}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="font-mono font-bold text-sm" style={{ color: gradeColor(pqf.grade) }}>
                        {pqf.grade}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5"
                        style={isAuto
                          ? { background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }
                          : { background: '#f0fdf4', color: '#1F7A4D', border: '1px solid #bbf7d0' }
                        }
                      >
                        {isAuto ? 'PQF*' : 'PQF v1.0'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {journals.map((j, i) => {
            const pqf = (j.pqf ?? j.ojqf)!
            return (
              <div key={j.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[10px] font-mono text-gray-400 mr-1.5">#{i + 1}</span>
                    <Link href={`/journal/${j.journal_code}`} className="text-xs font-semibold text-gray-800 hover:text-[#c41e3a] transition-colors">
                      {j.short_title}
                    </Link>
                    <p className="text-[10px] text-gray-400 mt-0.5">{j.publisher}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-bold font-mono leading-none" style={{ color: gradeColor(pqf.grade) }}>{pqf.total}</span>
                    <span className="block text-xs font-mono font-bold" style={{ color: gradeColor(pqf.grade) }}>{pqf.grade}</span>
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

      <div className="p-4 bg-gray-50 border border-gray-200 mb-4 text-[11px] leading-relaxed" style={{ color: 'var(--posi-muted)' }}>
        PQF scores are assessed annually against publicly verifiable evidence. Scores reflect the state of evidence
        at the time of assessment and do not indicate scientific merit, citation impact, or editorial prestige.
        PQF is not affiliated with Web of Science, Scopus, or DOAJ.
      </div>

      <div className="flex gap-4 text-xs">
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/evidence" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Evidence Registry →</Link>
        <Link href="/journals?tab=psg" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Verified Journals →</Link>
      </div>
    </div>
  )
}
