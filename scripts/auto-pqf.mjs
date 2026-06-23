#!/usr/bin/env node
/**
 * auto-pqf.mjs
 *
 * Computes automated PQF scores for all DISCOVERED_JOURNALS with doaj_status='listed'.
 * Fetches DOAJ bibjson details and combines with static journal data to score each
 * subfactor (JTF, MQF, EGF, TDF, CVF, RIF).
 *
 * Usage:
 *   node scripts/auto-pqf.mjs           # dry run — print scores
 *   node scripts/auto-pqf.mjs --write   # inject auto_pqf into data.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const DATA_PATH = resolve('src/lib/discovered-journals.ts')
const WRITE = process.argv.includes('--write')
const DOAJ = 'https://doaj.org/api'
const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const DOAJ_KEY = process.env.DOAJ_API_KEY ?? ''
const CONCURRENCY = 5
const DELAY_MS = 300
const TODAY = new Date().toISOString().slice(0, 10)

// ─── DOAJ fetch ───────────────────────────────────────────────────────────────

async function fetchDoajDetails(issn) {
  try {
    const keyParam = DOAJ_KEY ? `?api_key=${DOAJ_KEY}` : ''
    const res = await fetch(`${DOAJ}/search/journals/issn:${issn}${keyParam}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.results?.[0]) return null
    const first = data.results[0]
    const bib = first.bibjson ?? {}
    const admin = first.admin ?? {}
    return {
      has_seal: !!(admin.ticked),
      license: (bib.license?.[0]?.type ?? '').toLowerCase(),
      has_apc: !!(bib.apc?.has_apc),
      apc_max: bib.apc?.max ?? [],
      review_processes: bib.editorial?.review_processes ?? [],
      has_editorial_board: !!(bib.editorial?.board_url),
      last_full_review: admin.last_full_review ?? null,
      website_url: bib.ref?.journal ?? null,
    }
  } catch {
    return null
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

function grade(total) {
  if (total >= 90) return 'A+'
  if (total >= 80) return 'A'
  if (total >= 70) return 'B+'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  if (total >= 40) return 'D'
  return 'E'
}

function clamp(v, max) { return Math.min(v, max) }

function scoreJtf(doaj, journal) {
  // JTF — Journal Transparency Factor /25
  let s = 8  // base: DOAJ listing confirms basic transparency
  const lic = doaj.license
  if (lic.includes('cc by 4') || lic === 'cc by') s += 5
  else if (lic.includes('cc by-sa') || lic.includes('cc by-nc 4')) s += 3
  else if (lic.includes('cc by-nd') || lic.includes('cc by-nc-nd')) s += 2
  if (doaj.has_apc && doaj.apc_max.length > 0) s += 4  // APC clearly stated
  else if (!doaj.has_apc) s += 5                        // diamond OA
  if (doaj.has_seal) s += 3
  return clamp(s, 25)
}

function scoreMqf(doaj, journal) {
  // MQF — Metadata Quality Factor /25
  let s = 8  // base: DOAJ listing means basic bibliographic metadata present
  if (journal.issn_print && journal.issn_online) s += 3
  else if (journal.issn_print || journal.issn_online) s += 1
  const a = journal.article_count ?? 0
  if (a >= 1000) s += 5
  else if (a >= 100) s += 3
  else if (a >= 10) s += 1
  if (doaj.review_processes.length > 0) s += 3
  if (doaj.has_seal) s += 4
  return clamp(s, 25)
}

function scoreEgf(doaj, journal) {
  // EGF — Editorial Governance Factor /20
  let s = 6  // base: DOAJ listing
  const reviewed = doaj.review_processes.some(r => r.toLowerCase().includes('peer'))
  if (reviewed) s += 5
  if (doaj.has_editorial_board) s += 4
  if (doaj.has_seal) s += 4
  if (doaj.last_full_review) s += 1
  return clamp(s, 20)
}

function scoreTdf(doaj, journal) {
  // TDF — Technical Discoverability /15
  let s = 5  // base: in DOAJ
  if ((journal.article_count ?? 0) > 0) s += 4  // inferred: has DOI deposits
  if (journal.openalex_source_id) s += 3
  if (journal.oai_base_url) s += 3
  return clamp(s, 15)
}

function scoreCvf(doaj, journal) {
  // CVF — Citation Visibility Factor /10
  let s = 3  // base: in DOAJ
  if (journal.openalex_source_id) s += 3
  if ((journal.article_count ?? 0) > 0) s += 2  // Crossref DOIs inferred
  if (doaj.has_seal) s += 2
  return clamp(s, 10)
}

function scoreRif(doaj, journal) {
  // RIF — Research Integrity Factor /5
  let s = 2  // base: DOAJ listing
  const reviewed = doaj.review_processes.some(r => r.toLowerCase().includes('peer'))
  if (reviewed) s += 1
  if (doaj.has_seal) s += 2
  return clamp(s, 5)
}

function computeAutoPqf(doaj, journal) {
  const jtf = scoreJtf(doaj, journal)
  const mqf = scoreMqf(doaj, journal)
  const egf = scoreEgf(doaj, journal)
  const tdf = scoreTdf(doaj, journal)
  const cvf = scoreCvf(doaj, journal)
  const rif = scoreRif(doaj, journal)
  const total = jtf + mqf + egf + tdf + cvf + rif
  return { jtf, mqf, egf, tdf, cvf, rif, total, grade: grade(total) }
}

// ─── Parse discovered journals with doaj_status='listed' ─────────────────────

function parseDiscoveredListed(src) {
  const startMarker = "// BEGIN:DISCOVERED_JOURNALS"
  const start = src.indexOf(startMarker)
  if (start === -1) throw new Error('BEGIN:DISCOVERED_JOURNALS marker not found')

  const section = src.slice(start)
  const lines = section.split('\n')

  const journals = []
  let current = null

  for (const line of lines) {
    const idM = /id:\s*'(j-disc-[^']+)'/.exec(line)
    if (idM) {
      if (current?.id && current.doajStatus === 'listed') {
        journals.push({
          id: current.id,
          code: current.code,
          issnOnline: current.issnOnline,
          issnPrint: current.issnPrint,
          openalex_source_id: current.openalex,
          oai_base_url: current.oai,
          article_count: current.articleCount,
        })
      }
      current = { id: idM[1], code: null, issnOnline: null, issnPrint: null, doajStatus: null, openalex: null, oai: null, articleCount: 0 }
      continue
    }
    if (!current) continue

    const codeM = /journal_code:\s*'([^']+)'/.exec(line)
    if (codeM) { current.code = codeM[1]; continue }
    const ionM = /issn_online:\s*["']([^"']+)["']/.exec(line)
    if (ionM) { current.issnOnline = ionM[1]; continue }
    const ipM = /issn_print:\s*["']([^"']+)["']/.exec(line)
    if (ipM) { current.issnPrint = ipM[1]; continue }
    const doajM = /doaj_status:\s*["']([^"']+)["']/.exec(line)
    if (doajM) { current.doajStatus = doajM[1]; continue }
    const oaM = /openalex_source_id:\s*'([^']+)'/.exec(line)
    if (oaM) { current.openalex = oaM[1]; continue }
    const oaiM = /oai_base_url:\s*'([^']+)'/.exec(line)
    if (oaiM) { current.oai = oaiM[1]; continue }
    const acM = /article_count:\s*(\d+)/.exec(line)
    if (acM) { current.articleCount = parseInt(acM[1], 10); continue }
  }
  // flush last
  if (current?.id && current.doajStatus === 'listed') {
    journals.push({
      id: current.id,
      code: current.code,
      issnOnline: current.issnOnline,
      issnPrint: current.issnPrint,
      openalex_source_id: current.openalex,
      oai_base_url: current.oai,
      article_count: current.articleCount,
    })
  }
  return journals
}

// ─── Write auto_pqf into data.ts ─────────────────────────────────────────────

function injectAutoPqf(src, id, scores, websiteUrl) {
  const { jtf, mqf, egf, tdf, cvf, rif } = scores

  const idIdx = src.indexOf(`id: '${id}'`)
  if (idIdx === -1) return src

  const blockEnd = src.indexOf('created_at:', idIdx)
  if (blockEnd === -1) return src

  let updated = src
  const blockContent = updated.slice(idIdx, blockEnd)

  // Update website_url if journal has empty string and DOAJ has one
  if (websiteUrl) {
    const wsMatch = /website_url:\s*""/.exec(blockContent)
    if (wsMatch) {
      const wsIdx = idIdx + wsMatch.index
      updated = updated.slice(0, wsIdx) + `website_url: "${websiteUrl}"` + updated.slice(wsIdx + wsMatch[0].length)
    }
  }

  // Recompute blockEnd after potential website_url replacement
  const newBlockEnd = updated.indexOf('created_at:', idIdx)
  const newBlockContent = updated.slice(idIdx, newBlockEnd)

  const autoPqfLine = `  auto_pqf: autopqf(${jtf}, ${mqf}, ${egf}, ${tdf}, ${cvf}, ${rif}),\n`
  if (newBlockContent.includes('auto_pqf:')) {
    const autoIdx = updated.indexOf('auto_pqf:', idIdx)
    if (autoIdx < newBlockEnd) {
      const lineEnd = updated.indexOf('\n', autoIdx)
      return updated.slice(0, autoIdx) + `auto_pqf: autopqf(${jtf}, ${mqf}, ${egf}, ${tdf}, ${cvf}, ${rif}),` + updated.slice(lineEnd)
    }
  }

  return updated.slice(0, newBlockEnd) + autoPqfLine + '  ' + updated.slice(newBlockEnd)
}

// ─── Batch runner ─────────────────────────────────────────────────────────────

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function runBatch(items, fn, concurrency) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const br = await Promise.all(batch.map(fn))
    results.push(...br)
    if (i + concurrency < items.length) await sleep(DELAY_MS)
  }
  return results
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const src = readFileSync(DATA_PATH, 'utf-8')
  const listed = parseDiscoveredListed(src)
  console.log(`Found ${listed.length} DISCOVERED_JOURNALS with doaj_status='listed'\n`)

  const results = await runBatch(listed, async (j) => {
    const issn = j.issnOnline ?? j.issnPrint
    if (!issn) return { ...j, doaj: null }
    const doaj = await fetchDoajDetails(issn)
    process.stdout.write('.')
    return { ...j, doaj }
  }, CONCURRENCY)
  console.log('\n')

  let scored = 0
  let failed = 0
  let updated = src

  for (const { id, code, doaj, ...journal } of results) {
    if (!doaj) { failed++; continue }
    const scores = computeAutoPqf(doaj, journal)
    scored++

    if (!WRITE) {
      const ws = doaj.website_url ? ` url:${doaj.website_url}` : ''
      console.log(`[${code}] JTF:${scores.jtf} MQF:${scores.mqf} EGF:${scores.egf} TDF:${scores.tdf} CVF:${scores.cvf} RIF:${scores.rif} → ${scores.total} ${scores.grade}${ws}`)
    } else {
      updated = injectAutoPqf(updated, id, scores, doaj.website_url)
    }
  }

  console.log(`\nScored: ${scored}  Failed: ${failed}`)

  if (WRITE) {
    writeFileSync(DATA_PATH, updated, 'utf-8')
    console.log(`Written auto_pqf for ${scored} journals to data.ts`)
  } else {
    console.log('\nDry run. Pass --write to update data.ts.')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
