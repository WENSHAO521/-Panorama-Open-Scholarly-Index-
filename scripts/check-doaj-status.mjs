#!/usr/bin/env node
/**
 * check-doaj-status.mjs
 *
 * Checks every DISCOVERED_JOURNALS entry against the live DOAJ API.
 * Journals confirmed in_doaj=true → sets doaj_status: 'listed' in data.ts.
 *
 * Usage: node scripts/check-doaj-status.mjs [--write]
 *   --write  Apply changes to src/lib/data.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const DOAJ = 'https://doaj.org/api'
const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const DOAJ_KEY = process.env.DOAJ_API_KEY ?? ''
const DATA_PATH = resolve('src/lib/data.ts')
const WRITE = process.argv.includes('--write')
const CONCURRENCY = 5
const DELAY_MS = 300 // be polite to DOAJ

async function checkDoaj(issn) {
  try {
    const keyParam = DOAJ_KEY ? `?api_key=${DOAJ_KEY}` : ''
    const res = await fetch(`${DOAJ}/search/journals/issn:${issn}${keyParam}`, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()
    // DOAJ API v4: presence in results = listed (no in_doaj field in this version)
    const first = data.results?.[0]
    if (!first || (data.total ?? 0) === 0) return { in_doaj: false, doaj_id: null }
    return { in_doaj: true, doaj_id: first.id ?? null }
  } catch {
    return null
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function runBatch(items, fn, concurrency) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
    if (i + concurrency < items.length) await sleep(DELAY_MS)
  }
  return results
}

// Extract DISCOVERED_JOURNALS entries from raw TypeScript source
function parseDiscovered(src) {
  // Find the DISCOVERED_JOURNALS array block
  const start = src.indexOf("export const DISCOVERED_JOURNALS")
  if (start === -1) throw new Error('DISCOVERED_JOURNALS not found')

  const journals = []
  // Match each journal object's key fields
  const re = /id:\s*'([^']+)'[\s\S]*?journal_code:\s*'([^']+)'[\s\S]*?issn_online:\s*([^\n,]+)/g
  let m
  // Only search within DISCOVERED_JOURNALS section
  const section = src.slice(start)
  while ((m = re.exec(section)) !== null) {
    const issn_raw = m[3].trim().replace(/[",]/g, '')
    if (issn_raw === 'null') continue
    journals.push({ id: m[1], journal_code: m[2], issn: issn_raw })
  }
  return journals
}

async function main() {
  const src = readFileSync(DATA_PATH, 'utf-8')
  const discovered = parseDiscovered(src)

  console.log(`Found ${discovered.length} DISCOVERED_JOURNALS with ISSNs\n`)

  const confirmed = []
  const notListed = []
  const failed = []

  const results = await runBatch(discovered, async ({ id, journal_code, issn }) => {
    const result = await checkDoaj(issn)
    process.stdout.write('.')
    return { id, journal_code, issn, result }
  }, CONCURRENCY)

  console.log('\n')

  for (const { id, journal_code, issn, result } of results) {
    if (!result) {
      failed.push({ id, journal_code, issn })
    } else if (result.in_doaj) {
      confirmed.push({ id, journal_code, issn, doaj_id: result.doaj_id })
    } else {
      notListed.push({ id, journal_code, issn })
    }
  }

  console.log(`DOAJ confirmed (in_doaj=true): ${confirmed.length}`)
  console.log(`Not in DOAJ: ${notListed.length}`)
  console.log(`API failed/timeout: ${failed.length}\n`)

  if (confirmed.length > 0) {
    console.log('DOAJ-confirmed journals:')
    for (const j of confirmed) {
      console.log(`  [${j.journal_code}] ${j.issn}`)
    }
    console.log()
  }

  if (!WRITE) {
    console.log('Dry run. Pass --write to update data.ts.')
    return
  }

  // Update doaj_status for confirmed journals in data.ts
  let updated = src
  let changeCount = 0

  for (const { id } of confirmed) {
    // Find the journal block by id and change doaj_status: 'not_listed' to 'listed'
    // We look for the id, then the nearest doaj_status within ~800 chars
    const idIdx = updated.indexOf(`id: '${id}'`)
    if (idIdx === -1) continue

    const window = updated.slice(idIdx, idIdx + 900)
    const statusMatch = /doaj_status:\s*'([^']+)'/.exec(window)
    if (!statusMatch) continue
    if (statusMatch[1] === 'listed') continue // already correct

    const absIdx = idIdx + statusMatch.index
    updated = updated.slice(0, absIdx) +
      `doaj_status: 'listed'` +
      updated.slice(absIdx + statusMatch[0].length)
    changeCount++
  }

  writeFileSync(DATA_PATH, updated, 'utf-8')
  console.log(`Updated ${changeCount} journal(s) to doaj_status: 'listed' in data.ts`)
}

main().catch(err => { console.error(err); process.exit(1) })
