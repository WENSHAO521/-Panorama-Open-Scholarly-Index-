import Link from 'next/link'
import type { Metadata } from 'next'
import { PSG_JOURNALS, INDEXED_JOURNALS, SHIHARR_JOURNALS, OTHER_INDEXED_JOURNALS } from '@/lib/data'

const ASSESSED_JOURNALS = [...PSG_JOURNALS, ...INDEXED_JOURNALS, ...SHIHARR_JOURNALS, ...OTHER_INDEXED_JOURNALS]

export const metadata: Metadata = {
  title: 'Journal Evidence Records | POSI',
  description: 'Per-journal evidence records showing PQF subfactor scores and verification status for all POSI-assessed journals.',
}

const SUBFACTORS = [
  { abbr: 'JTF', label: 'Journal Transparency Factor',      max: 25 },
  { abbr: 'MQF', label: 'Metadata Quality Factor',          max: 25 },
  { abbr: 'EGF', label: 'Editorial Governance Factor',      max: 20 },
  { abbr: 'TDF', label: 'Technical Discoverability Factor', max: 15 },
  { abbr: 'CVF', label: 'Citation Visibility Factor',       max: 10 },
  { abbr: 'RIF', label: 'Research Integrity Factor',        max: 5  },
]

function gradeColor(grade: string) {
  if (grade === 'A+' || grade === 'A')  return '#1F7A4D'
  if (grade === 'B+' || grade === 'B')  return '#1e3a5f'
  if (grade === 'C')                    return '#B7791F'
  return '#6B7280'
}

export default function JournalEvidencePage() {
  const withScores  = ASSESSED_JOURNALS.filter(j => j.pqf ?? j.ojqf)
  const pending     = ASSESSED_JOURNALS.filter(j => !j.pqf && !j.ojqf)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      <nav className="text-xs flex items-center gap-1.5" style={{ color: 'var(--posi-muted)' }}>
        <Link href="/" className="hover:text-gray-700">Home</Link>
        <span>/</span>
        <Link href="/evidence" className="hover:text-gray-700">Evidence Registry</Link>
        <span>/</span>
        <span style={{ color: 'var(--posi-text)' }}>Journal Evidence Records</span>
      </nav>

      <div className="border-l-4 border-[#c41e3a] pl-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-[#c41e3a] border border-[#c41e3a] px-1.5 py-0.5">Evidence</span>
          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.15em]">Per-Journal Records</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Journal Evidence Records</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-2xl leading-relaxed">
          Evidence records for all journals assessed under the POSI Quality Framework.
          Each row shows the subfactor scores and links to the full journal detail page where
          individual criterion evidence sources are documented.
        </p>
      </div>

      {/* Subfactor key */}
      <div className="bg-white p-4" style={{ border: '1px solid var(--posi-border)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'var(--posi-muted)' }}>Subfactor Key</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SUBFACTORS.map(sf => (
            <div key={sf.abbr} className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold shrink-0 w-7" style={{ color: '#c41e3a' }}>{sf.abbr}</span>
              <span className="text-[11px]" style={{ color: 'var(--posi-muted)' }}>{sf.label} (/{sf.max})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-gray-200" style={{ border: '1px solid var(--posi-border)' }}>
        {[
          { label: 'With PQF Scores',  value: withScores.length },
          { label: 'Pending Review',   value: pending.length },
          { label: 'Total in Registry', value: ASSESSED_JOURNALS.length },
        ].map(s => (
          <div key={s.label} className="bg-white px-5 py-4 text-center">
            <p className="text-2xl font-bold font-mono" style={{ color: 'var(--posi-text)' }}>{s.value}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: 'var(--posi-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Scored journals — desktop table */}
      <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
        <div className="px-5 py-3 flex items-baseline justify-between" style={{ borderBottom: '1px solid var(--posi-border)' }}>
          <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>PQF Evidence Records</h2>
          <span className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>Assessed 2026-06-22</span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: 'var(--posi-bg)', borderBottom: '1px solid var(--posi-border-light)' }}>
                <th className="text-left px-4 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Journal</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>JTF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>MQF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>EGF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>TDF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>CVF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>RIF</th>
                <th className="text-center px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>PQF</th>
                <th className="text-left px-3 py-2.5 font-semibold uppercase tracking-[0.07em]" style={{ color: 'var(--posi-muted)' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {withScores
                .sort((a, b) => ((b.pqf ?? b.ojqf)!.total) - ((a.pqf ?? a.ojqf)!.total))
                .map(j => {
                  const score = (j.pqf ?? j.ojqf)!
                  return (
                    <tr key={j.journal_code} style={{ borderBottom: '1px solid var(--posi-border-light)' }} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2.5">
                        <p className="font-medium leading-tight" style={{ color: 'var(--posi-text)' }}>{j.short_title}</p>
                        <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--posi-muted)' }}>{j.issn_online || j.issn_print || 'No ISSN'}</p>
                      </td>
                      {(['jtf', 'mqf', 'egf', 'tdf', 'cvf', 'rif'] as const).map(f => (
                        <td key={f} className="px-3 py-2.5 text-center font-mono font-medium" style={{ color: 'var(--posi-text)' }}>
                          {score.subfactors[f] ?? 0}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-center">
                        <span className="font-mono font-bold text-xs" style={{ color: gradeColor(score.grade) }}>
                          {score.total} · {score.grade}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/journal/${j.journal_code}`}
                          className="text-[11px] hover:underline"
                          style={{ color: 'var(--posi-accent)' }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: 'var(--posi-border-light)' }}>
          {withScores
            .sort((a, b) => ((b.pqf ?? b.ojqf)!.total) - ((a.pqf ?? a.ojqf)!.total))
            .map(j => {
              const score = (j.pqf ?? j.ojqf)!
              return (
                <div key={j.journal_code} className="px-4 py-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Link href={`/journal/${j.journal_code}`} className="text-xs font-semibold hover:underline" style={{ color: 'var(--posi-text)' }}>
                        {j.short_title}
                      </Link>
                      <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--posi-muted)' }}>{j.issn_online || j.issn_print}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xl font-bold font-mono" style={{ color: gradeColor(score.grade) }}>{score.total}</span>
                      <span className="block text-xs font-mono font-bold" style={{ color: gradeColor(score.grade) }}>{score.grade}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-1">
                    {(['jtf', 'mqf', 'egf', 'tdf', 'cvf', 'rif'] as const).map((f, idx) => (
                      <div key={f} className="text-center py-1.5" style={{ background: '#f9fafb' }}>
                        <div className="text-[9px] font-mono font-bold" style={{ color: '#c41e3a' }}>{SUBFACTORS[idx].abbr}</div>
                        <div className="text-xs font-mono font-semibold text-gray-700">{score.subfactors[f] ?? 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      </section>

      {/* Pending journals */}
      {pending.length > 0 && (
        <section className="bg-white" style={{ border: '1px solid var(--posi-border)' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--posi-border-light)' }}>
            <h2 className="text-xs font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--posi-muted)' }}>Pending Assessment</h2>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--posi-border-light)' }}>
            {pending.map(j => (
              <div key={j.journal_code} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--posi-text)' }}>{j.short_title}</p>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--posi-muted)' }}>{j.issn_online || j.issn_print || 'No ISSN'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] px-1.5 py-0.5 font-medium" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }}>
                    Pending
                  </span>
                  <Link href={`/journal/${j.journal_code}`} className="text-[11px] hover:underline" style={{ color: 'var(--posi-accent)' }}>
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="p-4 text-[11px] leading-relaxed" style={{ background: 'var(--posi-bg)', border: '1px solid var(--posi-border)', color: 'var(--posi-muted)' }}>
        Evidence records reflect publicly verifiable information at the time of assessment.
        Full criterion-level evidence sources are available on each journal's detail page.
        To report an incorrect record, contact the POSI team via the{' '}
        <Link href="/contact" style={{ color: 'var(--posi-accent)' }} className="underline">Record Correction</Link> form.
      </div>

      <div className="flex flex-wrap gap-4 text-xs">
        <Link href="/evidence" style={{ color: 'var(--posi-accent)' }} className="hover:underline">Evidence Registry →</Link>
        <Link href="/pqf" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Methodology →</Link>
        <Link href="/pqf-scores" style={{ color: 'var(--posi-accent)' }} className="hover:underline">PQF Scores →</Link>
        <Link href="/journals?tab=psg" style={{ color: 'var(--posi-accent)' }} className="hover:underline">POSI Verified Journals →</Link>
      </div>
    </div>
  )
}
