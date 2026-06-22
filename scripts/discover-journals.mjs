#!/usr/bin/env node
/**
 * discover-journals.mjs
 *
 * Discover journals from external sources and optionally write them directly
 * into src/lib/data.ts as unverified auto-discovered metadata records.
 *
 * Usage:
 *   node scripts/discover-journals.mjs --doaj "<publisher name>"
 *   node scripts/discover-journals.mjs --doaj-all                  # all DOAJ journals
 *   node scripts/discover-journals.mjs --doaj-subject "<subject>"  # filter by subject
 *   node scripts/discover-journals.mjs --crossref-member <id>
 *   node scripts/discover-journals.mjs --ojs <domain>
 *
 *   Add --write to dedup against existing ISSNs and append to DISCOVERED_JOURNALS:
 *   node scripts/discover-journals.mjs --doaj "MDPI AG" --write
 *   node scripts/discover-journals.mjs --doaj-all --write --limit 500
 *   node scripts/discover-journals.mjs --doaj-all --write --resume-page 5
 *
 * Without --write: prints TypeScript blocks to stdout (for manual review).
 * With    --write: deduplicates against data.ts and appends new journals.
 *
 * Requires Node.js 18+
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dir, '../src/lib/discovered-journals.ts')

const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'

const args = process.argv.slice(2)
const WRITE_MODE = args.includes('--write')
const LIMIT = (() => {
  const i = args.indexOf('--limit')
  return i !== -1 ? parseInt(args[i + 1], 10) : Infinity
})()
const RESUME_PAGE = (() => {
  const i = args.indexOf('--resume-page')
  return i !== -1 ? parseInt(args[i + 1], 10) : 1
})()
// DOAJ API key — pass via env var DOAJ_API_KEY or --doaj-key <key>
const DOAJ_KEY = (() => {
  const i = args.indexOf('--doaj-key')
  return i !== -1 ? args[i + 1] : (process.env.DOAJ_API_KEY ?? '')
})()

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Helpers ────────────────────────────────────────────────────────────────

function titleCase(str) {
  if (!str) return str
  return str === str.toUpperCase()
    ? str.replace(/\b\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    : str
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'application/json', ...opts.headers },
    signal: AbortSignal.timeout(12000),
    ...opts,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json()
}

async function fetchXml(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.text()
}

function extractTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return m ? m[1].trim().replace(/\s+/g, ' ') : null
}
function extractAll(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))].map(m => m[1].trim())
}

function slugify(str) {
  return (str ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
}

function parseIssns(issnArr) {
  const print = issnArr?.find(i => i.type === 'print')?.value ?? null
  const online = issnArr?.find(i => i.type === 'electronic')?.value ?? null
  return { issn_print: print, issn_online: online ?? issnArr?.[0]?.value ?? null }
}

// ── ISO country code → name ─────────────────────────────────────────────────

const ISO_COUNTRY = {
  AF:'Afghanistan',AL:'Albania',DZ:'Algeria',AD:'Andorra',AO:'Angola',AR:'Argentina',
  AM:'Armenia',AU:'Australia',AT:'Austria',AZ:'Azerbaijan',BH:'Bahrain',BD:'Bangladesh',
  BY:'Belarus',BE:'Belgium',BJ:'Benin',BT:'Bhutan',BO:'Bolivia',BA:'Bosnia and Herzegovina',
  BW:'Botswana',BR:'Brazil',BN:'Brunei',BG:'Bulgaria',BF:'Burkina Faso',BI:'Burundi',
  KH:'Cambodia',CM:'Cameroon',CA:'Canada',CF:'Central African Republic',TD:'Chad',
  CL:'Chile',CN:'China',CO:'Colombia',CG:'Congo',HR:'Croatia',CU:'Cuba',CY:'Cyprus',
  CZ:'Czech Republic',DK:'Denmark',DO:'Dominican Republic',EC:'Ecuador',EG:'Egypt',
  SV:'El Salvador',EE:'Estonia',ET:'Ethiopia',FI:'Finland',FR:'France',GE:'Georgia',
  DE:'Germany',GH:'Ghana',GR:'Greece',GT:'Guatemala',GN:'Guinea',HT:'Haiti',
  HN:'Honduras',HU:'Hungary',IS:'Iceland',IN:'India',ID:'Indonesia',IR:'Iran',
  IQ:'Iraq',IE:'Ireland',IL:'Israel',IT:'Italy',JM:'Jamaica',JP:'Japan',JO:'Jordan',
  KZ:'Kazakhstan',KE:'Kenya',KW:'Kuwait',KG:'Kyrgyzstan',LA:'Laos',LV:'Latvia',
  LB:'Lebanon',LT:'Lithuania',LU:'Luxembourg',MK:'North Macedonia',MG:'Madagascar',
  MW:'Malawi',MY:'Malaysia',MV:'Maldives',ML:'Mali',MT:'Malta',MR:'Mauritania',
  MX:'Mexico',MD:'Moldova',MN:'Mongolia',MA:'Morocco',MZ:'Mozambique',MM:'Myanmar',
  NA:'Namibia',NP:'Nepal',NL:'Netherlands',NZ:'New Zealand',NI:'Nicaragua',
  NG:'Nigeria',NO:'Norway',OM:'Oman',PK:'Pakistan',PA:'Panama',PY:'Paraguay',
  PE:'Peru',PH:'Philippines',PL:'Poland',PT:'Portugal',QA:'Qatar',RO:'Romania',
  RU:'Russia',RW:'Rwanda',SA:'Saudi Arabia',SN:'Senegal',RS:'Serbia',SL:'Sierra Leone',
  SG:'Singapore',SK:'Slovakia',SI:'Slovenia',SO:'Somalia',ZA:'South Africa',
  SS:'South Sudan',ES:'Spain',LK:'Sri Lanka',SD:'Sudan',SE:'Sweden',CH:'Switzerland',
  SY:'Syria',TW:'Taiwan',TJ:'Tajikistan',TZ:'Tanzania',TH:'Thailand',TN:'Tunisia',
  TR:'Turkey',TM:'Turkmenistan',UG:'Uganda',UA:'Ukraine',AE:'United Arab Emirates',
  GB:'United Kingdom',US:'United States',UY:'Uruguay',UZ:'Uzbekistan',VE:'Venezuela',
  VN:'Vietnam',YE:'Yemen',ZM:'Zambia',ZW:'Zimbabwe',
}

function isoToCountry(code) {
  if (!code) return ''
  return ISO_COUNTRY[code.toUpperCase()] ?? code
}

// ── Frequency from DOAJ publication_time_weeks ───────────────────────────────

function weeksToFrequency(weeks) {
  if (!weeks) return ''
  if (weeks <= 1)  return 'Weekly'
  if (weeks <= 2)  return 'Biweekly'
  if (weeks <= 3)  return 'Three times a month'
  if (weeks <= 5)  return 'Monthly'
  if (weeks <= 7)  return 'Six times a year'
  if (weeks <= 9)  return 'Bimonthly'
  if (weeks <= 14) return 'Quarterly'
  if (weeks <= 20) return 'Three times a year'
  if (weeks <= 30) return 'Semiannual'
  return 'Annual'
}

// ── Inline PQF scoring (mirrors auto-pqf.mjs logic) ────────────────────────

function pqfGrade(total) {
  if (total >= 90) return 'A+'
  if (total >= 80) return 'A'
  if (total >= 70) return 'B+'
  if (total >= 60) return 'B'
  if (total >= 50) return 'C'
  if (total >= 40) return 'D'
  return 'E'
}

function scoreDoaj(bib, admin) {
  const lic = (bib.license?.[0]?.type ?? '').toLowerCase()
  const has_seal = !!(admin?.ticked)
  const has_apc = !!(bib.apc?.has_apc)
  const apc_max = bib.apc?.max ?? []
  const reviews = bib.editorial?.review_processes ?? bib.editorial?.review_process ?? []
  const reviewArr = Array.isArray(reviews) ? reviews : [reviews]
  const peer = reviewArr.some(r => String(r).toLowerCase().includes('peer'))

  // JTF /25
  let jtf = 8
  if (lic.includes('cc by 4') || lic === 'cc by') jtf += 5
  else if (lic.includes('cc by-sa') || lic.includes('cc by-nc 4')) jtf += 3
  else if (lic.includes('cc by-nd') || lic.includes('cc by-nc-nd')) jtf += 2
  if (has_apc && apc_max.length > 0) jtf += 4
  else if (!has_apc) jtf += 5
  if (has_seal) jtf += 3
  jtf = Math.min(jtf, 25)

  // MQF /25
  let mqf = 8
  if (bib.pissn && bib.eissn) mqf += 3
  else if (bib.pissn || bib.eissn) mqf += 1
  if (reviewArr.length > 0) mqf += 3
  if (has_seal) mqf += 4
  mqf = Math.min(mqf, 25)

  // EGF /20
  let egf = 6
  if (peer) egf += 5
  if (bib.editorial?.board_url) egf += 4
  if (has_seal) egf += 4
  egf = Math.min(egf, 20)

  // TDF /15
  let tdf = 5
  tdf = Math.min(tdf, 15)  // no Crossref/OpenAlex data at this stage

  // CVF /10
  let cvf = 3
  if (has_seal) cvf += 2
  cvf = Math.min(cvf, 10)

  // RIF /5
  let rif = 2
  if (peer) rif += 1
  if (has_seal) rif += 2
  rif = Math.min(rif, 5)

  const total = jtf + mqf + egf + tdf + cvf + rif
  return { jtf, mqf, egf, tdf, cvf, rif, total, grade: pqfGrade(total) }
}

// ── Build journal object from DOAJ bibjson ───────────────────────────────────

function buildFromDoaj(bib, item) {
  const issn_print  = bib.pissn ?? null
  const issn_online = bib.eissn ?? null
  const licenseLabel = bib.license?.[0]?.type ?? 'Open Access'
  // v4: review_processes (plural); v3 compat: review_process
  const reviewArr = bib.editorial?.review_processes ?? bib.editorial?.review_process ?? []
  const peerType  = (Array.isArray(reviewArr) ? reviewArr[0] : reviewArr) ?? 'Peer review'
  const langArr   = bib.language ?? []
  const lang      = (Array.isArray(langArr) ? langArr[0] : langArr) ?? 'English'
  const countryCode    = bib.publisher?.country ?? null
  const countryName    = isoToCountry(countryCode)
  const pubTimeWeeks   = bib.publication_time_weeks ?? null
  const admin          = item.admin ?? {}

  // Use ISSN as code for uniqueness at scale; fall back to slugified title
  const primaryIssn = issn_online ?? issn_print ?? null
  const code = primaryIssn ? `issn-${primaryIssn}` : slugify(bib.title ?? '').slice(0, 24)

  // Compute auto_pqf inline — avoids a separate scoring pass
  const scores = scoreDoaj(bib, admin)

  return {
    code,
    title: bib.title ?? 'Unknown',
    short_title: (bib.title ?? 'Unknown').split(':')[0].trim(),
    issn_print,
    issn_online,
    publisher: bib.publisher?.name ?? '',
    country: countryName,
    registration_country: countryName || null,
    language: lang,
    frequency: weeksToFrequency(pubTimeWeeks),
    peer_review_type: peerType,
    license: licenseLabel,
    website_url: bib.ref?.journal ?? '',
    oai_base_url: null,
    doaj_status: 'listed',   // DOAJ search only returns listed journals
    article_count: 0,
    _scores: scores,         // used by formatEntry; stripped before writing
  }
}

// ── Output formatter ────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10)

/**
 * Format a journal object into a TypeScript object literal.
 * All required Journal fields get safe non-null defaults.
 */
function formatEntry(j) {
  const code = j.code ?? slugify(j.title)
  const id   = `j-disc-${code}`
  // Required string fields — use safe defaults for unknown values
  const country       = j.country       ?? ''
  const language      = j.language      ?? 'English'
  const frequency     = j.frequency     ?? ''
  const license       = j.license       ?? 'Open Access'
  const peerReview    = j.peer_review_type ?? 'Peer review'
  const websiteUrl    = j.website_url   ?? ''
  const publisher     = j.publisher     ?? ''

  const regCountry = j.registration_country ?? null

  return `  {
    id: '${id}',
    journal_code: '${code}',
    title: ${JSON.stringify(j.title ?? '')},
    short_title: ${JSON.stringify(j.short_title ?? j.title?.split(':')[0]?.trim() ?? '')},
    issn_print: ${j.issn_print ? JSON.stringify(j.issn_print) : 'null'},
    issn_online: ${j.issn_online ? JSON.stringify(j.issn_online) : 'null'},
    publisher: ${JSON.stringify(publisher)},
    country: ${JSON.stringify(country)},
    language: ${JSON.stringify(language)},
    frequency: ${JSON.stringify(frequency)},
    open_access: true,
    license: ${JSON.stringify(license)},
    peer_review_type: ${JSON.stringify(peerReview)},
    website_url: ${JSON.stringify(websiteUrl)},
    cover_image_url: null,
    oai_base_url: ${j.oai_base_url ? JSON.stringify(j.oai_base_url) : 'null'},
    registration_country: ${regCountry ? JSON.stringify(regCountry) : 'null'},
    doaj_status: ${j.doaj_status ? JSON.stringify(j.doaj_status) : "'not_listed'"},
    openalex_source_id: null,
    metadata_quality_score: 30,
    transparency_score: 30,
    indexing_readiness: 'D',
    pqf: null,
    ${j._scores ? `auto_pqf: autopqf(${j._scores.jtf}, ${j._scores.mqf}, ${j._scores.egf}, ${j._scores.tdf}, ${j._scores.cvf}, ${j._scores.rif}),` : ''}
    article_count: ${j.article_count ?? 0},
    created_at: '${TODAY}T00:00:00Z',
    updated_at: '${TODAY}T00:00:00Z',
  },`
}

// ── MODE 1: OJS sitewide OAI-PMH ───────────────────────────────────────────

async function discoverOjs(domain) {
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  console.error(`\n🔍  Scanning OJS server: ${base}\n`)

  const setsUrl = `${base}/index.php/index/oai?verb=ListSets`
  console.error(`    Fetching sets: ${setsUrl}`)
  const xml = await fetchXml(setsUrl)

  const setSpecList = extractAll(xml, 'setSpec')
  const setNameList = extractAll(xml, 'setName')

  const journals = []
  for (let i = 0; i < setSpecList.length; i++) {
    if (journals.length >= LIMIT) break
    const spec = setSpecList[i]
    const name = setNameList[i] ?? spec
    const slug = spec.includes(':') ? spec.split(':')[1] : spec
    if (!slug || slug === 'index') continue

    const oaiBase   = `${base}/index.php/${slug}/oai`
    const journalUrl = `${base}/index.php/${slug}`

    let issn_print = null, issn_online = null, articleCount = 0
    try {
      const recordsXml = await fetchXml(`${oaiBase}?verb=ListRecords&metadataPrefix=oai_dc`)
      const sources = extractAll(recordsXml, 'dc:source')
      const issnPattern = /\b(\d{4}-\d{3}[\dX])\b/g
      const issns = new Set()
      for (const s of sources) for (const [, issn] of s.matchAll(issnPattern)) issns.add(issn)
      const issnArr = [...issns]
      if (issnArr.length >= 2) { issnArr.sort(); issn_print = issnArr[0]; issn_online = issnArr[1] }
      else if (issnArr.length === 1) issn_online = issnArr[0]
      const totalMatch = recordsXml.match(/completeListSize="(\d+)"/) ?? recordsXml.match(/totalListSize="(\d+)"/)
      articleCount = totalMatch ? Number(totalMatch[1]) : (recordsXml.match(/<record>/g) ?? []).length
    } catch (e) {
      console.error(`    ⚠  ${slug}: ${e.message}`)
    }

    journals.push({ code: slug, title: name, short_title: name, issn_print, issn_online,
      website_url: journalUrl, oai_base_url: oaiBase, article_count: articleCount })
    console.error(`    ✓  ${slug.padEnd(16)} | ${issn_print ?? '----'} / ${issn_online ?? '----'} | ${articleCount} articles`)
  }
  return journals
}

// ── MODE 2: Crossref Member API ─────────────────────────────────────────────
// The /members/{id}/journals endpoint no longer exists in Crossref API.
// Strategy: page through member /works, collect unique ISSNs, then fetch
// journal-level metadata via GET /journals/{issn} for each unique one.

async function discoverCrossrefMember(memberId) {
  console.error(`\n🔍  Scanning Crossref member ${memberId} works for unique journals\n`)

  // Step 1: collect unique ISSN → container-title from works
  const issnMap = new Map() // issn → {title, publisher}
  let offset = 0
  const rows = 100
  const MAX_PAGES = 20 // scan up to 2000 works max

  for (let page = 0; page < MAX_PAGES && issnMap.size < LIMIT * 3; page++) {
    const url = `https://api.crossref.org/members/${memberId}/works?filter=type:journal-article&rows=${rows}&offset=${offset}&select=ISSN,container-title,issn-type,publisher&mailto=posi@panorama-sg.com`
    console.error(`    Works page ${page + 1}: offset=${offset} (${issnMap.size} journals found so far)`)
    let data
    try { data = await fetchJson(url) } catch { break }
    const items = data?.message?.items ?? []
    if (items.length === 0) break

    for (const item of items) {
      const issn = item.ISSN?.[0]
      if (!issn || issnMap.has(issn)) continue
      const title = Array.isArray(item['container-title']) ? item['container-title'][0] : item['container-title']
      if (title) issnMap.set(issn, { title, publisher: item.publisher ?? '' })
    }
    if (items.length < rows) break
    offset += rows
  }

  console.error(`\n    Found ${issnMap.size} unique journal ISSNs — fetching journal metadata\n`)

  // Step 2: for each unique ISSN, fetch journal metadata
  const journals = []
  for (const [issn, { title, publisher }] of [...issnMap.entries()].slice(0, LIMIT)) {
    let meta = null
    try {
      const r = await fetchJson(
        `https://api.crossref.org/journals/${issn}?mailto=posi@panorama-sg.com`
      )
      meta = r?.message
    } catch { /* use fallback */ }

    const issnTypeArr = (meta?.['issn-type'] ?? [])
    const issn_print  = issnTypeArr.find(i => i.type === 'print')?.value  ?? null
    const issn_online = issnTypeArr.find(i => i.type === 'electronic')?.value ?? issn

    journals.push({
      code: slugify(meta?.title ?? title),
      title: meta?.title ?? title,
      short_title: (meta?.title ?? title).split(':')[0].trim(),
      issn_print,
      issn_online,
      publisher: meta?.publisher ?? publisher,
      country: titleCase(meta?.['publisher-location']) ?? '',
      website_url: '',
      article_count: meta?.counts?.['current-dois'] ?? 0,
    })

    console.error(`    ✓  ${(meta?.title ?? title).slice(0, 44).padEnd(44)} | ${issn_print ?? '----'} / ${issn_online ?? '----'}`)
  }
  return journals
}

// ── MODE 3a: DOAJ — search by publisher name ────────────────────────────────

async function discoverDoaj(publisherQuery) {
  console.error(`\n🔍  Searching DOAJ for publisher: "${publisherQuery}"\n`)

  const pageSize = 100
  let page = 1
  const journals = []

  while (journals.length < LIMIT) {
    const q = encodeURIComponent(`bibjson.publisher.name:"${publisherQuery}"`)
    const keyParam = DOAJ_KEY ? `&api_key=${DOAJ_KEY}` : ''
    const url = `https://doaj.org/api/v4/search/journals/${q}?pageSize=${pageSize}&page=${page}${keyParam}`
    console.error(`    Fetching page ${page}: ${url}`)
    const data = await fetchJson(url)
    const results = data?.results ?? []
    if (results.length === 0) break

    for (const item of results) {
      if (journals.length >= LIMIT) break
      const bib = item.bibjson ?? {}
      const j = buildFromDoaj(bib, item)
      if (!j.publisher) j.publisher = publisherQuery
      journals.push(j)
      console.error(`    ✓  ${(bib.title ?? '?').slice(0, 44).padEnd(44)} | ${j.issn_print ?? '----'} / ${j.issn_online ?? '----'}`)
    }
    if (results.length < pageSize) break
    page++
    await sleep(300)
  }
  return journals
}

// ── MODE 3b: DOAJ — fetch all journals (paginate everything) ─────────────────

async function discoverDoajAll(subjectFilter = '') {
  const label = subjectFilter ? `subject: "${subjectFilter}"` : 'all journals'
  console.error(`\n🔍  Fetching DOAJ ${label} (starting at page ${RESUME_PAGE})\n`)

  const pageSize = 100
  let page = RESUME_PAGE
  const journals = []
  let totalKnown = null

  while (journals.length < LIMIT) {
    const q = subjectFilter
      ? encodeURIComponent(`bibjson.subject.term:"${subjectFilter}"`)
      : encodeURIComponent('_exists_:bibjson.title')
    const keyParam = DOAJ_KEY ? `&api_key=${DOAJ_KEY}` : ''
    const url = `https://doaj.org/api/v4/search/journals/${q}?pageSize=${pageSize}&page=${page}${keyParam}`

    const totalPages = totalKnown ? Math.ceil(totalKnown / pageSize) : '?'
    console.error(`    Page ${page}/${totalPages} — ${journals.length} collected so far...`)

    let data
    try {
      data = await fetchJson(url)
    } catch (e) {
      console.error(`    ⚠  ${e.message} — retrying in 5s`)
      await sleep(5000)
      try { data = await fetchJson(url) } catch (e2) {
        console.error(`    ❌  Skipping page ${page}: ${e2.message}`)
        page++
        continue
      }
    }

    if (totalKnown === null && data.total != null) {
      totalKnown = data.total
      console.error(`    Total available: ${totalKnown} journals`)
    }

    const results = data?.results ?? []
    if (results.length === 0) break

    for (const item of results) {
      if (journals.length >= LIMIT) break
      const bib = item.bibjson ?? {}
      journals.push(buildFromDoaj(bib, item))
    }

    if (results.length < pageSize) break
    page++
    await sleep(300)
  }
  return journals
}

// ── MODE 3c: OpenAlex — fetch all DOAJ journals via cursor (no 10k limit) ────

async function discoverOpenAlexDoaj() {
  console.error('\n🔍  Fetching DOAJ journals via OpenAlex cursor API (no page limit)\n')

  const perPage = 200
  let cursor = '*'
  const journals = []
  let totalKnown = null
  let pageNum = 0

  while (journals.length < LIMIT) {
    const url = `https://api.openalex.org/sources?filter=is_in_doaj:true&per-page=${perPage}&cursor=${encodeURIComponent(cursor)}&mailto=posi@panoramagroup.org`

    pageNum++
    const totalPages = totalKnown ? Math.ceil(totalKnown / perPage) : '?'
    console.error(`    Page ${pageNum}/${totalPages} — ${journals.length} collected so far...`)

    let data
    try {
      data = await fetchJson(url)
    } catch (e) {
      console.error(`    ⚠  ${e.message} — retrying in 5s`)
      await sleep(5000)
      try { data = await fetchJson(url) } catch (e2) {
        console.error(`    ❌  Fatal: ${e2.message}`)
        break
      }
    }

    if (totalKnown === null && data?.meta?.count != null) {
      totalKnown = data.meta.count
      console.error(`    Total available: ${totalKnown} journals`)
    }

    const results = data?.results ?? []
    if (results.length === 0) break

    for (const src of results) {
      if (journals.length >= LIMIT) break

      const issns = src.issn ?? []
      const issn_online = src.issn_l ?? issns[0] ?? null
      const issn_print  = issns.find(i => i !== issn_online) ?? null
      const primaryIssn = issn_online ?? issn_print

      const code = primaryIssn ? `issn-${primaryIssn}` : slugify(src.display_name ?? '').slice(0, 24)

      // Simplified scoring from OpenAlex data (no DOAJ bibjson license/review details)
      const has_apc      = (src.apc_usd ?? 0) > 0
      const has_dual     = issns.length >= 2
      const jtf = Math.min(8 + (has_apc ? 4 : 5), 25)
      const mqf = Math.min(8 + (has_dual ? 3 : 1), 25)
      const egf = 6   // peer review assumed (DOAJ requires it) but no detail
      const tdf = 5   // base only
      const cvf = 3   // base only
      const rif = 3   // DOAJ-indexed = peer reviewed

      journals.push({
        code,
        title:          src.display_name ?? 'Unknown',
        short_title:    (src.display_name ?? 'Unknown').split(':')[0].trim(),
        issn_print,
        issn_online,
        publisher:      src.host_organization_name ?? '',
        country:        isoToCountry(src.country_code),
        registration_country: isoToCountry(src.country_code) || null,
        language:       'English',
        frequency:      '',
        peer_review_type: 'Peer review',
        license:        'Open Access',
        website_url:    src.homepage_url ?? '',
        oai_base_url:   null,
        doaj_status:    'listed',
        article_count:  src.works_count ?? 0,
        _scores: { jtf, mqf, egf, tdf, cvf, rif },
      })
    }

    const nextCursor = data?.meta?.next_cursor
    if (!nextCursor || results.length < perPage) break
    cursor = nextCursor
    await sleep(120)  // OpenAlex allows ~10 req/s; 120ms is safe
  }

  return journals
}

// ── Write mode: dedup + patch data.ts ─────────────────────────────────────

function writeToDataTs(journals) {
  const dataSrc = readFileSync(DATA_FILE, 'utf8')

  // Extract all known ISSNs already in data.ts (both single and double quoted)
  const knownIssns = new Set(
    [...dataSrc.matchAll(/issn_(?:print|online):\s*["']([^"']+)["']/g)].map(m => m[1])
  )

  // Filter out duplicates (match on either ISSN)
  let newJournals = journals.filter(j => {
    if (j.issn_online && knownIssns.has(j.issn_online)) return false
    if (j.issn_print  && knownIssns.has(j.issn_print))  return false
    return true
  })

  if (newJournals.length === 0) {
    console.error('\n✓  No new journals (all already in data.ts by ISSN).')
    return
  }

  // Deduplicate within discovered list (same online or print ISSN = same journal)
  const seenIssn = new Set()
  const deduped = newJournals.filter(j => {
    const key = j.issn_online ?? j.issn_print ?? j.code
    if (seenIssn.has(key)) return false
    seenIssn.add(key)
    if (j.issn_print)  seenIssn.add(j.issn_print)
    if (j.issn_online) seenIssn.add(j.issn_online)
    return true
  })
  const removed = newJournals.length - deduped.length
  const newJournalsFinal = deduped
  newJournals = newJournalsFinal

  console.error(`\nDeduplication: ${journals.length} discovered → ${newJournals.length} new (${journals.length - newJournals.length + removed} already known or duplicate)\n`)

  const entries = newJournals.map(j => formatEntry(j)).join('\n\n')

  // Insert before the // END:DISCOVERED_JOURNALS marker
  const MARKER = '// END:DISCOVERED_JOURNALS'
  if (!dataSrc.includes(MARKER)) {
    console.error('❌  Could not find // END:DISCOVERED_JOURNALS marker in data.ts')
    process.exit(1)
  }

  const updated = dataSrc.replace(MARKER, `${entries}\n${MARKER}`)
  writeFileSync(DATA_FILE, updated, 'utf8')
  console.error(`✓  Wrote ${newJournals.length} new journal(s) to DISCOVERED_JOURNALS in data.ts`)
  for (const j of newJournals) {
    console.error(`   + ${j.code.padEnd(24)} ${j.issn_online ?? j.issn_print ?? ''}  ${j.title?.slice(0, 44)}`)
  }
}

// ── CLI entrypoint ──────────────────────────────────────────────────────────

let journals = []

if (args[0] === '--ojs' && args[1]) {
  journals = await discoverOjs(args[1])
} else if (args[0] === '--crossref-member' && args[1]) {
  journals = await discoverCrossrefMember(args[1])
} else if (args[0] === '--doaj' && args[1]) {
  journals = await discoverDoaj(args[1])
} else if (args[0] === '--doaj-all') {
  journals = await discoverDoajAll()
} else if (args[0] === '--doaj-subject' && args[1]) {
  journals = await discoverDoajAll(args[1])
} else if (args[0] === '--openalex-doaj') {
  journals = await discoverOpenAlexDoaj()
} else {
  console.error(`
Usage:
  node scripts/discover-journals.mjs --ojs <domain>              [--write] [--limit N]
  node scripts/discover-journals.mjs --crossref-member <id>      [--write] [--limit N]
  node scripts/discover-journals.mjs --doaj "<publisher name>"   [--write] [--limit N]
  node scripts/discover-journals.mjs --doaj-all                  [--write] [--limit N] [--resume-page N]
  node scripts/discover-journals.mjs --doaj-subject "<subject>"  [--write] [--limit N]
  node scripts/discover-journals.mjs --openalex-doaj             [--write] [--limit N]

Examples:
  node scripts/discover-journals.mjs --openalex-doaj --write           # all DOAJ (recommended)
  node scripts/discover-journals.mjs --doaj "MDPI AG" --write
  node scripts/discover-journals.mjs --doaj-subject "Medicine" --write --limit 200
  node scripts/discover-journals.mjs --crossref-member 1968 --write --limit 30
  node scripts/discover-journals.mjs --ojs ojs.shiharr.com --write

Without --write: prints TypeScript blocks to stdout for manual review.
With    --write: deduplicates and appends new journals to DISCOVERED_JOURNALS in data.ts.
  --openalex-doaj: cursor-based, no 10,000 result limit (preferred over --doaj-all)
`)
  process.exit(1)
}

if (journals.length === 0) {
  console.error('\n⚠  No journals discovered.')
  process.exit(0)
}

console.error(`\n✓  Discovered ${journals.length} journals.`)

if (WRITE_MODE) {
  writeToDataTs(journals)
} else {
  // Print to stdout for manual review / paste
  console.error('─'.repeat(60))
  console.log(`// ── Discovered ${journals.length} journals — paste into data.ts ──`)
  console.log(`// Source: ${args.filter(a => a !== '--write').join(' ')}`)
  console.log(`// Generated: ${TODAY}`)
  console.log()
  for (const j of journals) {
    console.log(formatEntry(j))
    console.log()
  }
}
