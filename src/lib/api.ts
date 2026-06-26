import type { Article, Reference, RorOrganization, DoajJournalInfo } from './types'
import { ALL_JOURNALS, PSG_JOURNALS } from './data'
import { extractDoi } from './utils'

const CROSSREF = 'https://api.crossref.org'
const OPENALEX = 'https://api.openalex.org'
const ROR     = 'https://api.ror.org/v2'
const UA = 'POSI/0.1 (mailto:posi@panoramagroup.org)'
const PSG_PREFIX = '10.63802'
const PSG_MEMBER = '53186'
const ARTICLE_FILTER = 'type:journal-article'

// ─── Internal types ────────────────────────────────────────────────────────────

interface CrossrefAuthor {
  given?: string
  family?: string
  ORCID?: string
  sequence?: string
  affiliation?: { name: string; id?: { id: string; 'id-type': string }[] }[]
}

interface CrossrefWork {
  DOI: string
  title: string | string[]
  'container-title': string | string[]
  ISSN?: string[]
  author?: CrossrefAuthor[]
  abstract?: string
  license?: { URL: string }[]
  link?: { URL: string; 'content-type': string }[]
  resource?: { primary?: { URL: string } }
  volume?: string
  issue?: string
  page?: string
  type?: string
  'reference-count'?: number
  'is-referenced-by-count'?: number
  'published-online'?: { 'date-parts': number[][] }
  issued?: { 'date-parts': number[][] }
  created?: { 'date-time': string }
  deposited?: { 'date-time': string }
}

// ─── Advanced-query field parsing ─────────────────────────────────────────────

export interface SearchFields {
  freeText?: string
  title?: string
  author?: string
  journal?: string
  doi?: string
  year?: string
  abstract?: string
  keyword?: string
  institution?: string
  language?: string
  publisher?: string
}

/**
 * Parses advanced query syntax "TI=(value) AND AU=(value)" into structured fields.
 * Plain queries without field codes return as { freeText }.
 */
export function parseFieldQuery(query: string): SearchFields {
  if (!query.trim()) return {}
  if (!/[A-Z]{2,3}=\(/.test(query)) {
    // Auto-detect DOI or DOI URL so it is routed to exact filter, not full-text search
    const doi = extractDoi(query)
    if (doi) return { doi }
    return { freeText: query }
  }

  const fields: SearchFields = {}
  const re = /(?:^|\s+(?:AND|OR|NOT)\s+)([A-Z]{2,3})=\(([^)]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(query)) !== null) {
    const code = m[1]
    const val = m[2].trim()
    if (!val) continue
    switch (code) {
      case 'TS': fields.freeText    = [fields.freeText, val].filter(Boolean).join(' '); break
      case 'TI': fields.title       = [fields.title, val].filter(Boolean).join(' '); break
      case 'AU': fields.author      = [fields.author, val].filter(Boolean).join(' '); break
      case 'SO': fields.journal     = val; break
      case 'DOI': fields.doi        = val; break
      case 'PY': fields.year        = val; break
      case 'AB': fields.abstract    = val; break
      case 'KW': fields.keyword     = val; break
      case 'OG': fields.institution = val; break
      case 'LA': fields.language    = val; break
      case 'PU': fields.publisher   = val; break
      default:   fields.freeText    = [fields.freeText, val].filter(Boolean).join(' ')
    }
  }
  return fields
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stripJats(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function reconstructAbstract(idx: Record<string, number[]> | null | undefined): string | null {
  if (!idx) return null
  const words: string[] = []
  for (const [word, positions] of Object.entries(idx)) {
    for (const pos of positions) words[pos] = word
  }
  return words.filter(Boolean).join(' ') || null
}

function calcMqs(item: CrossrefWork): number {
  let score = 0
  if (item.DOI) score += 20
  if (item.abstract) score += 20
  if (item.author?.some(a => !!a.ORCID)) score += 15
  if (item.author?.some(a => a.affiliation?.some(af => af.id?.length))) score += 15
  if ((item['reference-count'] ?? 0) > 0) score += 15
  if (item.license?.length) score += 10
  score += 5 // all PSG articles are OA
  return Math.min(score, 100)
}

function parseLicense(item: CrossrefWork): string | null {
  const url = item.license?.[0]?.URL
  if (!url) return null
  if (url.includes('/by/')) return 'CC BY 4.0'
  if (url.includes('/by-nc/')) return 'CC BY-NC 4.0'
  if (url.includes('/by-nc-nd/')) return 'CC BY-NC-ND 4.0'
  if (url.includes('/by-sa/')) return 'CC BY-SA 4.0'
  return url
}

function mapCrossrefWork(item: CrossrefWork): Article {
  const issn = item.ISSN?.[0] ?? ''
  const journal = ALL_JOURNALS.find(j => j.issn_online === issn)

  const rawTitle = item.title
  const title = Array.isArray(rawTitle) ? rawTitle[0] : (rawTitle ?? '')

  const rawJt = item['container-title']
  const journalTitle = Array.isArray(rawJt) ? rawJt[0] : (rawJt ?? journal?.title ?? '')

  const dateParts = (item['published-online'] ?? item.issued)?.['date-parts']?.[0] ?? []
  const year = dateParts[0] ?? new Date().getFullYear()
  const pubDate =
    dateParts.length >= 3
      ? `${dateParts[0]}-${String(dateParts[1]).padStart(2, '0')}-${String(dateParts[2]).padStart(2, '0')}`
      : dateParts[0]
        ? String(dateParts[0])
        : null

  const pageStr = item.page ?? ''
  const dash = pageStr.indexOf('-')
  const firstPage = dash > -1 ? pageStr.slice(0, dash) : pageStr || null
  const lastPage = dash > -1 ? pageStr.slice(dash + 1) : pageStr || null

  return {
    id: item.DOI,
    doi: item.DOI,
    title,
    subtitle: null,
    journal_id: journal?.id ?? '',
    journal_title: journalTitle,
    journal_code: journal?.journal_code ?? '',
    volume: item.volume ?? null,
    issue: item.issue ?? null,
    first_page: firstPage,
    last_page: lastPage,
    publication_year: year,
    publication_date: pubDate,
    article_type: item.type === 'journal-article' ? 'Research Article' : (item.type ?? 'Article'),
    language: 'English',
    abstract: item.abstract ? stripJats(item.abstract) : null,
    keywords: [],
    license: parseLicense(item),
    pdf_url: item.link?.find(l => l['content-type'] === 'application/pdf')?.URL ?? null,
    html_url: item.resource?.primary?.URL ?? null,
    openalex_work_id: null,
    crossref_status: 'verified',
    cited_by_count: item['is-referenced-by-count'] ?? 0,
    reference_count: item['reference-count'] ?? 0,
    is_retracted: false,
    metadata_quality_score: calcMqs(item),
    authors: (item.author ?? []).map((a, i) => ({
      id: a.ORCID ?? `${item.DOI}-au-${i}`,
      display_name: [a.given, a.family].filter(Boolean).join(' '),
      given_name: a.given ?? null,
      family_name: a.family ?? null,
      orcid: a.ORCID ? a.ORCID.replace('https://orcid.org/', '') : null,
      openalex_author_id: null,
      country: null,
      institution: a.affiliation?.[0]?.name ?? null,
      is_corresponding: a.sequence === 'first',
      author_order: i + 1,
    })),
    created_at: item.created?.['date-time'] ?? '',
    updated_at: item.deposited?.['date-time'] ?? '',
  }
}

// ─── Public API ────────────────────────────────────────────────────────────────

export async function crossrefSearch(
  query: string,
  options: {
    page?: number
    rows?: number
    yearFrom?: number
    yearTo?: number
    scope?: 'all' | 'psg'  // 'all' = global Crossref, 'psg' = PSG member only
    issn?: string
    signal?: AbortSignal
  } = {}
): Promise<{ total: number; items: Article[] }> {
  const { page = 1, rows = 20, yearFrom, yearTo, scope = 'all', issn, signal } = options

  const offset = (page - 1) * rows
  const f = parseFieldQuery(query)

  // Combine year from field code and from options (field code takes precedence)
  const yr = f.year ? Number(f.year) : undefined
  const filterParts = [ARTICLE_FILTER]
  const yearF = yr ?? yearFrom
  const yearT = yr ?? yearTo
  if (yearF || yearT) {
    filterParts.push(`from-pub-date:${yearF ?? 1900}`, `until-pub-date:${yearT ?? new Date().getFullYear()}`)
  }
  if (issn) filterParts.push(`issn:${issn}`)
  if (f.doi) filterParts.push(`doi:${f.doi.replace(/^https?:\/\/doi\.org\//i, '')}`)
  if (f.language) filterParts.push(`language:${f.language}`)

  const hasQuery = !!(f.freeText || f.title || f.author || f.journal || f.abstract || f.keyword || f.institution)

  const params = new URLSearchParams({
    rows: String(rows),
    offset: String(offset),
    sort: hasQuery ? 'relevance' : 'published',
    order: 'desc',
    filter: filterParts.join(','),
    mailto: 'posi@panoramagroup.org',
  })

  // Map field codes to Crossref's named query params
  if (f.title)       params.set('query.title', f.title)
  if (f.author)      params.set('query.author', f.author)
  if (f.journal)     params.set('query.container-title', f.journal)
  if (f.institution) params.set('query.affiliation', f.institution)
  // Crossref has no separate abstract/keyword/publisher param — append to general query
  const extra = [f.freeText, f.abstract, f.keyword, f.publisher]
    .filter(Boolean).join(' ')
  if (extra) params.set('query', extra)

  const endpoint = scope === 'psg'
    ? `${CROSSREF}/members/${PSG_MEMBER}/works`
    : `${CROSSREF}/works`

  const headers: Record<string, string> = typeof window === 'undefined'
    ? { 'User-Agent': UA }
    : {}

  const res = await fetch(`${endpoint}?${params.toString()}`, { headers, signal, cache: 'no-store' })
  if (!res.ok) return { total: 0, items: [] }

  const data = await res.json()
  const msg = data.message
  return {
    total: msg['total-results'] ?? 0,
    items: (msg.items ?? []).map(mapCrossrefWork),
  }
}

/**
 * Top-N Crossref results for an exact title query via query.bibliographic.
 * Run in parallel with OpenAlex for title-field searches to widen candidate pool.
 */
export async function crossrefTitleLookup(
  title: string,
  options: { rows?: number; signal?: AbortSignal } = {}
): Promise<Article[]> {
  const { rows = 10, signal } = options
  if (!title.trim()) return []
  const params = new URLSearchParams({
    'query.bibliographic': title,
    rows: String(rows),
    filter: ARTICLE_FILTER,
    sort: 'relevance',
    order: 'desc',
    mailto: 'posi@panoramagroup.org',
  })
  try {
    const headers: Record<string, string> = typeof window === 'undefined' ? { 'User-Agent': UA } : {}
    const res = await fetch(`${CROSSREF}/works?${params.toString()}`, { headers, signal, cache: 'no-store' })
    if (!res.ok) return []
    const data = await res.json()
    return (data.message?.items ?? []).map(mapCrossrefWork)
  } catch {
    return []
  }
}

export async function crossrefGetWork(doi: string): Promise<Article | null> {
  const res = await fetch(`${CROSSREF}/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': UA },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  return mapCrossrefWork(data.message)
}

interface CrossrefRefItem {
  key?: string
  DOI?: string
  'article-title'?: string
  'volume-title'?: string
  author?: string
  year?: string
  'journal-title'?: string
  volume?: string
  issue?: string
  'first-page'?: string
  unstructured?: string
}

export async function crossrefGetReferences(doi: string): Promise<Reference[]> {
  try {
    const res = await fetch(
      `${CROSSREF}/works/${encodeURIComponent(doi)}?mailto=posi@panoramagroup.org`,
      { headers: { 'User-Agent': UA } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const refs: CrossrefRefItem[] = data.message?.reference ?? []
    return refs.map((r, i) => ({
      key:          r.key ?? String(i + 1),
      doi:          r.DOI ?? null,
      title:        r['article-title'] ?? r['volume-title'] ?? null,
      author:       r.author ?? null,
      year:         r.year ?? null,
      journal:      r['journal-title'] ?? null,
      volume:       r.volume ?? null,
      issue:        r.issue ?? null,
      first_page:   r['first-page'] ?? null,
      unstructured: r.unstructured ?? null,
    }))
  } catch {
    return []
  }
}

export async function crossrefGetJournalWorks(
  issn: string,
  options: { page?: number; rows?: number } = {}
): Promise<{ total: number; items: Article[] }> {
  const { page = 1, rows = 20 } = options
  const offset = (page - 1) * rows

  const params = new URLSearchParams({
    rows: String(rows),
    offset: String(offset),
    sort: 'published',
    order: 'desc',
    filter: ARTICLE_FILTER,
    mailto: 'posi@panoramagroup.org',
  })

  const res = await fetch(
    `${CROSSREF}/journals/${issn}/works?${params.toString()}`,
    { headers: { 'User-Agent': UA } }
  )
  if (!res.ok) {
    // Fallback: member works filtered by ISSN
    const fp = new URLSearchParams(params)
    fp.set('filter', `${ARTICLE_FILTER},issn:${issn}`)
    const fallback = await fetch(
      `${CROSSREF}/members/${PSG_MEMBER}/works?${fp.toString()}`,
      { headers: { 'User-Agent': UA } }
    )
    if (!fallback.ok) return { total: 0, items: [] }
    const d = await fallback.json()
    return {
      total: d.message['total-results'] ?? 0,
      items: (d.message.items ?? []).map(mapCrossrefWork),
    }
  }

  const data = await res.json()
  const msg = data.message
  return {
    total: msg['total-results'] ?? 0,
    items: (msg.items ?? []).map(mapCrossrefWork),
  }
}

export async function openAlexGetWork(doi: string): Promise<{
  id: string
  cited_by_count: number
  keywords: string[]
  abstract: string | null
} | null> {
  const res = await fetch(`${OPENALEX}/works/https://doi.org/${doi}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) return null
  const d = await res.json()
  return {
    id: d.id ?? '',
    cited_by_count: d.cited_by_count ?? 0,
    keywords: (d.keywords ?? []).map((k: { display_name: string }) => k.display_name),
    abstract: reconstructAbstract(d.abstract_inverted_index),
  }
}

// ─── OAI-PMH (primary harvest source) ────────────────────────────────────────

function xmlText(xml: string, tag: string): string {
  const re = new RegExp(`<(?:[a-z]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'i')
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .trim()
}

function xmlAll(xml: string, tag: string): string[] {
  const re = new RegExp(`<(?:[a-z]+:)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[a-z]+:)?${tag}>`, 'gi')
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) {
    const val = m[1]
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .trim()
    if (val) out.push(val)
  }
  return out
}

function parseOaiRecord(block: string): Article | null {
  const identifiers = xmlAll(block, 'identifier')
  const doi = identifiers.find(id => id.includes('doi.org/'))?.replace(/.*doi\.org\//, '')
    ?? identifiers.find(id => id.startsWith('10.'))
  if (!doi) return null

  const title = xmlText(block, 'title')
  if (!title) return null

  const creators = xmlAll(block, 'creator')
  const description = xmlText(block, 'description')
  const date = xmlText(block, 'date')
  const year = date ? parseInt(date.slice(0, 4), 10) : new Date().getFullYear()
  const rights = xmlText(block, 'rights')
  const source = xmlText(block, 'source')
  const subjects = xmlAll(block, 'subject').filter(Boolean)
  const setSpec = xmlAll(block, 'setSpec')[0] ?? ''

  const codeMatch = doi.match(/10\.63802\/([a-z]+)\./i)
  const journalCode = codeMatch?.[1]?.toLowerCase() ?? setSpec.split(':')[0].toLowerCase()
  const journal = ALL_JOURNALS.find(j => j.journal_code === journalCode)

  const volMatch = source.match(/[Vv]ol\.?\s*(\d+)/)
  const issueMatch = source.match(/[Nn]o\.?\s*(\d+)/)

  let license: string | null = null
  if (rights.includes('/by/4')) license = 'CC BY 4.0'
  else if (rights.includes('/by-nc-nd/')) license = 'CC BY-NC-ND 4.0'
  else if (rights.includes('/by-nc/')) license = 'CC BY-NC 4.0'
  else if (rights.includes('/by-sa/')) license = 'CC BY-SA 4.0'

  const htmlUrl = identifiers.find(id => id.startsWith('http') && !id.includes('doi.org') && id.includes('/article/'))

  const authors = creators.map((c, i) => {
    const commaIdx = c.indexOf(',')
    const family = commaIdx > -1 ? c.slice(0, commaIdx).trim() : c
    const given = commaIdx > -1 ? c.slice(commaIdx + 1).trim() : null
    return {
      id: `${doi}-au-${i}`,
      display_name: given ? `${given} ${family}` : c,
      given_name: given,
      family_name: family,
      orcid: null,
      openalex_author_id: null,
      country: null,
      institution: null,
      is_corresponding: i === 0,
      author_order: i + 1,
    }
  })

  return {
    id: doi,
    doi,
    title,
    subtitle: null,
    journal_id: journal?.id ?? '',
    journal_title: (journal?.title ?? source.split(';')[0].trim()) || '',
    journal_code: journalCode,
    volume: volMatch?.[1] ?? null,
    issue: issueMatch?.[1] ?? null,
    first_page: null,
    last_page: null,
    publication_year: year,
    publication_date: date || null,
    article_type: 'Research Article',
    language: 'English',
    abstract: description || null,
    keywords: subjects,
    license,
    pdf_url: null,
    html_url: htmlUrl ?? null,
    openalex_work_id: null,
    crossref_status: 'registered',
    cited_by_count: 0,
    reference_count: 0,
    is_retracted: false,
    metadata_quality_score: description ? 55 : 35,
    authors,
    created_at: date || '',
    updated_at: date || '',
  }
}

// Derive per-journal OAI endpoint: use oai_base_url if set, else append /oai to website_url
function getJournalOaiUrl(journalCode: string): string | null {
  const journal = ALL_JOURNALS.find(j => j.journal_code === journalCode)
  if (!journal) return null
  if (journal.oai_base_url) return journal.oai_base_url
  if (journal.website_url) return journal.website_url.replace(/\/+$/, '') + '/oai'
  return null
}

async function oaiFetchUrl(url: string, params: Record<string, string>): Promise<string | null> {
  try {
    const res = await fetch(url + '?' + new URLSearchParams(params).toString(), {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    })
    return res.ok ? res.text() : null
  } catch {
    return null
  }
}

export async function oaiHarvestJournal(journalCode: string): Promise<Article[]> {
  const oaiUrl = getJournalOaiUrl(journalCode)
  if (!oaiUrl) return []

  const articles: Article[] = []
  let token: string | null = null

  do {
    const xml = await oaiFetchUrl(
      oaiUrl,
      token
        ? { verb: 'ListRecords', resumptionToken: token }
        : { verb: 'ListRecords', metadataPrefix: 'oai_dc' }
    )
    if (!xml || xml.includes('<error')) break

    for (const block of xml.match(/<record>[\s\S]*?<\/record>/g) ?? []) {
      const a = parseOaiRecord(block)
      if (a) articles.push(a)
    }

    token = (/<resumptionToken[^>]*>([^<]*)<\/resumptionToken>/.exec(xml)?.[1] ?? '').trim() || null
  } while (token)

  return articles
}

// Harvest all indexed journals via their individual OAI endpoints
export async function oaiHarvestAll(): Promise<Article[]> {
  const results = await Promise.allSettled(
    ALL_JOURNALS.map(j => oaiHarvestJournal(j.journal_code))
  )
  return results
    .filter((r): r is PromiseFulfilledResult<Article[]> => r.status === 'fulfilled')
    .flatMap(r => r.value)
}

// ─── ISSN Portal (registration country) ──────────────────────────────────────

export async function issnGetCountry(issn: string): Promise<string | null> {
  try {
    const res = await fetch(`https://portal.issn.org/resource/ISSN/${issn}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; POSI-Bot/1.0; +https://posi.panorama-sg.com)',
        'Accept': 'application/ld+json, application/json;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const data = await res.json()

    // ISSN Portal flat JSON format: publication[0].location[].label
    const locations = data?.publication?.[0]?.location
    if (Array.isArray(locations) && locations.length > 0) {
      type LocEntry = { label?: string }
      const label = (locations as LocEntry[]).find(l => typeof l.label === 'string' && l.label)?.label
      if (typeof label === 'string' && label) {
        // Portal returns ALL-CAPS (e.g. "HONG KONG S.A.R., CHINA").
        // \b\w+ correctly preserves single-letter abbreviations like S.A.R. as-is
        // since each letter is already uppercase and slice(1) is empty.
        return label === label.toUpperCase()
          ? label.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          : label
      }
    }

    return null
  } catch {
    return null
  }
}

// ─── Crossref journals search ─────────────────────────────────────────────────

export interface CrossrefJournalItem {
  title: string
  issn: string[]
  publisher: string
  total_dois: number
  subjects: string[]
}

export async function crossrefSearchJournals(
  query: string,
  options: { rows?: number; offset?: number } = {}
): Promise<{ total: number; items: CrossrefJournalItem[] }> {
  const { rows = 20, offset = 0 } = options
  const params = new URLSearchParams({
    rows: String(rows),
    offset: String(offset),
    mailto: 'posi@panoramagroup.org',
  })
  if (query) params.set('query', query)
  const res = await fetch(`${CROSSREF}/journals?${params.toString()}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) return { total: 0, items: [] }
  const data = await res.json()
  const msg = data.message
  return {
    total: msg['total-results'] ?? 0,
    items: (msg.items ?? []).map((j: {
      title: string
      ISSN?: string[]
      publisher?: string
      counts?: { 'total-dois'?: number }
      subjects?: { name: string }[]
    }) => ({
      title: j.title ?? '',
      issn: j.ISSN ?? [],
      publisher: j.publisher ?? '',
      total_dois: j.counts?.['total-dois'] ?? 0,
      subjects: (j.subjects ?? []).map((s: { name: string }) => s.name),
    })),
  }
}

// ─── Crossref journal metadata ────────────────────────────────────────────────

export interface CrossrefJournalMeta {
  title: string
  issn: string[]
  publisher: string
  publisher_location: string | null
  total_dois: number
  subjects: string[]
}

export async function crossrefFetchJournal(issn: string): Promise<CrossrefJournalMeta | null> {
  // Fetch journal metadata and accurate article-only count in parallel
  const [metaRes, countRes] = await Promise.all([
    fetch(`${CROSSREF}/journals/${issn}?mailto=posi@panoramagroup.org`, { headers: { 'User-Agent': UA } }),
    fetch(`${CROSSREF}/journals/${issn}/works?filter=${ARTICLE_FILTER}&rows=0&mailto=posi@panoramagroup.org`, { headers: { 'User-Agent': UA } }),
  ])
  if (!metaRes.ok) return null
  const meta = (await metaRes.json()).message
  const articleCount = countRes.ok ? ((await countRes.json()).message?.['total-results'] ?? 0) : (meta.counts?.['total-dois'] ?? 0)
  return {
    title: meta.title ?? '',
    issn: meta.ISSN ?? [issn],
    publisher: meta.publisher ?? '',
    publisher_location: (meta['publisher-location'] as string) ?? null,
    total_dois: articleCount,
    subjects: ((meta.subjects ?? []) as { name: string }[]).map((s: { name: string }) => s.name),
  }
}

// ─── Crossref full harvest (DOI prefix pagination) ───────────────────────────

// Harvest all PSG articles from Crossref member endpoint (build-time only)
export async function crossrefHarvestAll(): Promise<Article[]> {
  const all: Article[] = []
  let offset = 0
  const rows = 100

  for (;;) {
    const params = new URLSearchParams({
      rows: String(rows),
      offset: String(offset),
      sort: 'published',
      order: 'asc',
      filter: ARTICLE_FILTER,
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`${CROSSREF}/members/${PSG_MEMBER}/works?${params.toString()}`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) break
    const data = await res.json()
    const items: CrossrefWork[] = data.message?.items ?? []
    if (items.length === 0) break
    all.push(...items.map(mapCrossrefWork))
    if (items.length < rows) break
    offset += rows
  }

  return all
}

// Harvest all articles for a specific journal ISSN (build-time only)
export async function crossrefHarvestJournal(issn: string): Promise<Article[]> {
  const all: Article[] = []
  let offset = 0
  const rows = 100

  for (;;) {
    const params = new URLSearchParams({
      rows: String(rows),
      offset: String(offset),
      sort: 'published',
      order: 'desc',
      filter: ARTICLE_FILTER,
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`${CROSSREF}/journals/${issn}/works?${params.toString()}`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) break
    const data = await res.json()
    const items: CrossrefWork[] = data.message?.items ?? []
    if (items.length === 0) break
    all.push(...items.map(mapCrossrefWork))
    if (items.length < rows) break
    offset += rows
  }

  return all
}

// ─── ROR (Research Organization Registry) ────────────────────────────────────

type RorOrgRaw = Record<string, unknown>

function mapRorOrg(org: RorOrgRaw): RorOrganization {
  const names = (org.names as Array<{ value: string; types: string[] }>) ?? []
  const name = names.find(n => n.types.includes('ror_display'))?.value ?? names[0]?.value ?? ''
  const locs = (org.locations as Array<{ geonames_details: { country_name: string; country_code: string } }>) ?? []
  const geo = locs[0]?.geonames_details
  const links = (org.links as Array<{ value: string }>) ?? []
  return {
    id: (org.id as string) ?? '',
    name,
    country: geo?.country_name ?? '',
    country_code: geo?.country_code ?? '',
    types: ((org.types as string[]) ?? []).map(t => String(t).toLowerCase()),
    website: links[0]?.value ?? null,
  }
}

// Match a raw affiliation string (department name, university, etc.) to a ROR record.
// Returns the best match only when the API is confident (chosen: true).
export async function rorMatchAffiliation(affiliation: string): Promise<RorOrganization | null> {
  try {
    const res = await fetch(
      `${ROR}/organizations?affiliation=${encodeURIComponent(affiliation)}`,
      { headers: { 'User-Agent': UA } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const chosen = (data.items ?? []).find((item: { chosen: boolean }) => item.chosen)
    return chosen ? mapRorOrg(chosen.organization) : null
  } catch {
    return null
  }
}

// Free-text name search (paginated).
export async function rorSearch(
  query: string,
  page = 1
): Promise<{ total: number; items: RorOrganization[] }> {
  try {
    const params = new URLSearchParams({ query, page: String(page) })
    const res = await fetch(`${ROR}/organizations?${params.toString()}`, {
      headers: { 'User-Agent': UA }
    })
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json()
    return {
      total: data.number_of_results ?? 0,
      items: (data.items ?? []).map((item: RorOrgRaw) =>
        mapRorOrg((item.organization as RorOrgRaw) ?? item)
      ),
    }
  } catch {
    return { total: 0, items: [] }
  }
}

// Fetch a single organisation by full ROR URL or bare ID (e.g. "04aj4c181").
export async function rorGetOrg(rorId: string): Promise<RorOrganization | null> {
  try {
    const id = rorId.replace('https://ror.org/', '')
    const res = await fetch(`${ROR}/organizations/${id}`, {
      headers: { 'User-Agent': UA }
    })
    if (!res.ok) return null
    return mapRorOrg(await res.json())
  } catch {
    return null
  }
}

// ─── OpenAlex article search ──────────────────────────────────────────────────

interface OpenAlexWork {
  id: string
  doi: string | null
  title: string | null
  publication_year: number | null
  publication_date: string | null
  type: string | null
  language: string | null
  is_retracted: boolean
  cited_by_count: number
  referenced_works_count: number
  abstract_inverted_index: Record<string, number[]> | null
  biblio: { volume?: string; issue?: string; first_page?: string; last_page?: string } | null
  primary_location: {
    source?: { display_name?: string; issn_l?: string; issn?: string[] } | null
    landing_page_url?: string | null
  } | null
  open_access: { oa_url?: string | null; oa_status?: string } | null
  authorships: Array<{
    author: { id?: string; display_name?: string; orcid?: string | null } | null
    institutions: Array<{ display_name?: string }> | null
    countries: string[] | null
    is_corresponding: boolean
  }>
  keywords: Array<{ display_name: string }> | null
}

function mapOpenAlexWork(work: OpenAlexWork): Article {
  const rawDoi = work.doi?.replace('https://doi.org/', '') ?? ''
  const issn = work.primary_location?.source?.issn_l
    ?? work.primary_location?.source?.issn?.[0]
    ?? ''
  const journal = ALL_JOURNALS.find(j =>
    j.issn_online === issn || j.issn_print === issn
  )
  const abstract = reconstructAbstract(work.abstract_inverted_index)

  let mqs = 20
  if (rawDoi)   mqs += 20
  if (abstract) mqs += 20
  if (work.authorships?.some(a => a.author?.orcid)) mqs += 15
  if (work.authorships?.some(a => (a.institutions ?? []).length > 0)) mqs += 10
  if ((work.referenced_works_count ?? 0) > 0) mqs += 10
  if (work.open_access?.oa_url) mqs += 5

  return {
    id: rawDoi || work.id,
    doi: rawDoi,
    title: work.title ?? '',
    subtitle: null,
    journal_id: journal?.id ?? '',
    journal_title: work.primary_location?.source?.display_name ?? '',
    journal_code: journal?.journal_code ?? '',
    volume: work.biblio?.volume ?? null,
    issue: work.biblio?.issue ?? null,
    first_page: work.biblio?.first_page ?? null,
    last_page: work.biblio?.last_page ?? null,
    publication_year: work.publication_year ?? new Date().getFullYear(),
    publication_date: work.publication_date ?? null,
    article_type: work.type === 'article' ? 'Research Article' : (work.type ?? 'Article'),
    language: work.language ?? 'English',
    abstract,
    keywords: (work.keywords ?? []).map(k => k.display_name),
    license: work.open_access?.oa_status === 'gold' || work.open_access?.oa_status === 'diamond'
      ? 'Open Access' : null,
    pdf_url: work.open_access?.oa_url ?? null,
    html_url: work.primary_location?.landing_page_url ?? null,
    openalex_work_id: work.id,
    crossref_status: rawDoi ? 'registered' : null,
    cited_by_count: work.cited_by_count ?? 0,
    reference_count: work.referenced_works_count ?? 0,
    is_retracted: work.is_retracted ?? false,
    metadata_quality_score: Math.min(mqs, 100),
    authors: (work.authorships ?? []).map((a, i) => ({
      id: a.author?.id ?? `${work.id}-au-${i}`,
      display_name: a.author?.display_name ?? '',
      given_name: null,
      family_name: null,
      orcid: a.author?.orcid?.replace('https://orcid.org/', '') ?? null,
      openalex_author_id: a.author?.id ?? null,
      country: a.countries?.[0] ?? null,
      institution: a.institutions?.[0]?.display_name ?? null,
      is_corresponding: a.is_corresponding ?? i === 0,
      author_order: i + 1,
    })),
    created_at: work.publication_date ?? '',
    updated_at: work.publication_date ?? '',
  }
}

const OA_SELECT = [
  'id', 'doi', 'title', 'publication_year', 'publication_date', 'type', 'language',
  'is_retracted', 'cited_by_count', 'referenced_works_count', 'abstract_inverted_index',
  'biblio', 'primary_location', 'open_access', 'authorships', 'keywords',
].join(',')

export async function openalexSearch(
  query: string,
  options: {
    page?: number
    rows?: number
    yearFrom?: number
    yearTo?: number
    issn?: string
    signal?: AbortSignal
  } = {}
): Promise<{ total: number; items: Article[] }> {
  const { page = 1, rows = 20, yearFrom, yearTo, issn, signal } = options

  const f = parseFieldQuery(query)

  const yr = f.year ? Number(f.year) : undefined
  const filterParts = ['type:article']

  // Year filter (field code takes precedence over sidebar filter)
  const yearF = yr ?? yearFrom
  const yearT = yr ?? yearTo
  if (yearF && yearT && yearF === yearT) filterParts.push(`publication_year:${yearF}`)
  else if (yearF) filterParts.push(`publication_year:>${yearF - 1}`)
  else if (yearT) filterParts.push(`publication_year:<${yearT + 1}`)

  if (issn) filterParts.push(`primary_location.source.issn:${issn}`)

  // Map field codes to OpenAlex filter syntax
  if (f.doi) {
    const clean = f.doi.replace(/^https?:\/\/doi\.org\//i, '')
    filterParts.push(`doi:https://doi.org/${clean}`)
  }
  // Author: no quotes → AND-matching on each word, handles "Zhang Wei" / "Wei Zhang" / "Zhang, Wei"
  // Title: keep quotes for exact phrase matching (user is looking for a specific title)
  // Journal: no quotes → allows partial journal name matching
  if (f.author)      filterParts.push(`authorships.author.display_name.search:${f.author}`)
  if (f.title)       filterParts.push(`title.search:"${f.title}"`)
  if (f.journal)     filterParts.push(`primary_location.source.display_name.search:${f.journal}`)
  if (f.institution) filterParts.push(`authorships.institutions.display_name.search:${f.institution}`)
  // Keyword: use OpenAlex keyword filter; also added to searchTerm below as fallback for unlabelled papers
  if (f.keyword)     filterParts.push(`keywords.keyword.search:${f.keyword}`)
  if (f.language)    filterParts.push(`language:${f.language}`)
  // Abstract: use dedicated abstract.search filter instead of general search param
  if (f.abstract)    filterParts.push(`abstract.search:${f.abstract}`)
  // Publisher: host_organization_name is a reliable string field; lineage covers parent publishers
  if (f.publisher)   filterParts.push(`primary_location.source.host_organization_name.search:${f.publisher}`)

  const params = new URLSearchParams({
    'per-page': String(rows),
    page: String(page),
    filter: filterParts.join(','),
    select: OA_SELECT,
    mailto: 'posi@panoramagroup.org',
  })

  // Free-text search param:
  // - TS (Topic) and plain queries → full-text search across title/abstract/etc.
  // - Keyword (KW) also added here as a fallback: many papers lack OpenAlex keyword tags,
  //   so also search the keyword term in title/abstract to catch unlabelled papers.
  // - Abstract (AB) is handled via abstract.search filter above, not repeated here.
  const searchTerm = [f.freeText, f.keyword].filter(Boolean).join(' ')
  if (searchTerm) {
    params.set('search', searchTerm)
  } else if (!f.title && !f.author && !f.doi && !f.abstract && !f.journal && !f.institution) {
    // No structured query at all: sort by recent
    params.set('sort', 'publication_date:desc')
  }

  const res = await fetch(`${OPENALEX}/works?${params.toString()}`, { signal, cache: 'no-store' })
  if (!res.ok) return { total: 0, items: [] }

  const data = await res.json()
  return {
    total: data.meta?.count ?? 0,
    items: (data.results ?? []).map(mapOpenAlexWork),
  }
}

// ─── DOAJ (Directory of Open Access Journals) ────────────────────────────────

const DOAJ = 'https://doaj.org/api'

export async function doajGetJournal(issn: string): Promise<DoajJournalInfo | null> {
  try {
    const res = await fetch(`${DOAJ}/search/journals/issn:${issn}`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return null
    const data = await res.json()
    const first = data.results?.[0]
    if (!first) return null
    const bib = (first.bibjson ?? {}) as Record<string, unknown>
    const admin = (first.admin ?? {}) as Record<string, unknown>
    return {
      in_doaj: true, // presence in DOAJ API v4 results implies listing
      has_seal: (admin.ticked as boolean) ?? false,
      license: ((bib.license as Array<{ type: string }>)?.[0]?.type) ?? null,
      has_apc: ((bib.apc as { has_apc?: boolean })?.has_apc) ?? false,
      apc_max: ((bib.apc as { max?: { currency: string; price: number }[] })?.max) ?? [],
      subjects: ((bib.subject as Array<{ term: string }>) ?? []).map(s => s.term),
      last_updated: (first.last_updated as string) ?? null,
      doaj_id: (first.id as string) ?? null,
      publication_time_weeks: (bib.publication_time_weeks as number) ?? null,
      publisher_country_code: ((bib.publisher as { country?: string })?.country) ?? null,
    }
  } catch {
    return null
  }
}

// ─── OpenAlex journal/source citation stats ───────────────────────────────────

export interface OpenAlexSourceStats {
  two_yr_mean_citedness: number | null
  h_index: number | null
  cited_by_count: number | null
}

export async function openAlexGetSourceStats(issn: string): Promise<OpenAlexSourceStats | null> {
  try {
    const params = new URLSearchParams({
      filter: `issn:${issn}`,
      select: 'summary_stats,cited_by_count',
      mailto: 'posi@panoramagroup.org',
    })
    const res = await fetch(`${OPENALEX}/sources?${params.toString()}`, {
      headers: { 'User-Agent': UA },
    })
    if (!res.ok) return null
    const data = await res.json()
    const source = data.results?.[0]
    if (!source) return null
    return {
      two_yr_mean_citedness: source.summary_stats?.['2yr_mean_citedness'] ?? null,
      h_index: source.summary_stats?.h_index ?? null,
      cited_by_count: source.cited_by_count ?? null,
    }
  } catch {
    return null
  }
}

// Full Article object from OpenAlex (used by /cite as fallback when Crossref has no record)
export async function openAlexGetArticle(doi: string): Promise<Article | null> {
  try {
    const params = new URLSearchParams({ select: OA_SELECT, mailto: 'posi@panoramagroup.org' })
    const res = await fetch(
      `${OPENALEX}/works/https://doi.org/${encodeURIComponent(doi)}?${params.toString()}`,
      { headers: { 'User-Agent': UA }, cache: 'no-store' }
    )
    if (!res.ok) return null
    return mapOpenAlexWork(await res.json())
  } catch {
    return null
  }
}

// Legacy aliases used by /api/doi/[doi]
export const fetchOpenAlexWork = openAlexGetWork
export const fetchCrossrefWork = crossrefGetWork

// ─── Book metadata (ISBN lookup with multi-source fallback) ───────────────────

export interface BookInfo {
  title: string
  subtitle?: string
  authors: string[]
  year: string | null
  publisher: string | null
  place: string | null
  isbn: string
  source?: string
}

// Source 1: Open Library (CORS-native, broad English/global coverage)
async function fetchBookOl(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
    )
    if (!res.ok) return null
    const data = await res.json() as Record<string, Record<string, unknown>>
    const book = data[`ISBN:${clean}`]
    if (!book) return null
    type OLEntry = { name: string }
    return {
      title: (book.title as string) ?? '',
      subtitle: book.subtitle as string | undefined,
      authors: ((book.authors as OLEntry[]) ?? []).map((a) => a.name),
      year: ((book.publish_date as string) ?? '').match(/\d{4}/)?.[0] ?? null,
      publisher: ((book.publishers as OLEntry[]) ?? [])[0]?.name ?? null,
      place: ((book.publish_places as OLEntry[]) ?? [])[0]?.name ?? null,
      isbn: clean,
      source: 'Open Library',
    }
  } catch {
    return null
  }
}

// Source 2: Google Books (via Cloudflare Pages Function proxy)
// Requires BOOKS_API env var set in Cloudflare Pages dashboard.
// Falls back silently if proxy returns 503 (key not configured).
async function fetchBookGoogle(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/google-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as {
      totalItems?: number
      items?: Array<{
        volumeInfo: {
          title?: string
          subtitle?: string
          authors?: string[]
          publisher?: string
          publishedDate?: string
          industryIdentifiers?: Array<{ type: string; identifier: string }>
        }
      }>
    }
    if (!data.totalItems || !data.items?.length) return null
    const v = data.items[0].volumeInfo
    if (!v.title) return null
    const year = v.publishedDate?.match(/\d{4}/)?.[0] ?? null
    const isbn13 = v.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier ?? clean
    return {
      title: v.title,
      subtitle: v.subtitle,
      authors: v.authors ?? [],
      year,
      publisher: v.publisher ?? null,
      place: null,
      isbn: isbn13,
      source: 'Google Books',
    }
  } catch {
    return null
  }
}

// Source 3: Korean National Library Open API (via Cloudflare Pages Function proxy)
// Requires NLK_API_KEY env var. Falls back silently if proxy returns 503.
async function fetchBookNlk(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/nlk-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as {
      found?: boolean
      title?: string
      authors?: string[]
      year?: string | null
      publisher?: string | null
    }
    if (!data.found || !data.title) return null
    return {
      title: data.title,
      authors: data.authors ?? [],
      year: data.year ?? null,
      publisher: data.publisher ?? null,
      place: null,
      isbn: clean,
      source: 'Korean National Library',
    }
  } catch {
    return null
  }
}

// Source 4: Library of Congress (CORS-friendly JSON API, strong US/English coverage)
async function fetchBookLoc(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://www.loc.gov/books/?q=${encodeURIComponent(clean)}&fo=json`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return null
    const data = await res.json() as {
      results?: Array<{
        title?: string
        contributor?: string[]
        date?: string
        description?: string[]
      }>
    }
    const item = data.results?.[0]
    if (!item?.title) return null

    // LOC titles often append " / Author Name." — strip that
    const title = item.title.replace(/\s*\/\s*[^/]+$/, '').replace(/\.$/, '').trim()
    if (!title) return null

    const authors = (item.contributor ?? []).map(c =>
      c.replace(/,\s*\d{4}-(\d{4})?\.?$/, '')
       .replace(/,\s*(author|editor|compiler|translator|illustrator)[,.]?.*$/i, '')
       .trim()
    ).filter(Boolean)

    // description[0] is often "Publisher : Place, Year"
    const desc = item.description?.[0] ?? ''
    const pubMatch = desc.match(/^(.+?)\s*:\s*(.+?),\s*\d{4}/)

    return {
      title,
      authors,
      year: item.date?.match(/\d{4}/)?.[0] ?? null,
      publisher: pubMatch?.[1]?.trim() ?? null,
      place: pubMatch?.[2]?.trim() ?? null,
      isbn: clean,
      source: 'Library of Congress',
    }
  } catch {
    return null
  }
}

// Source 5: Nasjonalbiblioteket / National Library of Norway (JSON, no key needed)
async function fetchBookNb(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://api.nb.no/catalog/v1/items?q=isbn:${encodeURIComponent(clean)}&size=1`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return null
    const data = await res.json() as {
      page?: { totalElements?: number }
      _embedded?: {
        items?: Array<{
          metadata?: {
            title?: string
            creators?: Array<{ name?: string }>
            originInfo?: {
              publisher?: string
              dateIssued?: string
              placeOfPublication?: string
            }
          }
        }>
      }
    }
    if ((data.page?.totalElements ?? 0) === 0) return null
    const meta = data._embedded?.items?.[0]?.metadata
    if (!meta?.title) return null

    const authors = (meta.creators ?? []).map(c => {
      const name = c.name ?? ''
      const comma = name.indexOf(',')
      if (comma === -1) return name.trim()
      const last = name.slice(0, comma).trim()
      const first = name.slice(comma + 1).trim()
      return first ? `${first} ${last}` : last
    }).filter(Boolean)

    return {
      title: meta.title,
      authors,
      year: meta.originInfo?.dateIssued?.match(/\d{4}/)?.[0] ?? null,
      publisher: meta.originInfo?.publisher ?? null,
      place: meta.originInfo?.placeOfPublication ?? null,
      isbn: clean,
      source: 'Nasjonalbiblioteket (Norway)',
    }
  } catch {
    return null
  }
}

// Source 6: Libris / Kungliga biblioteket (Sweden, JSON xsearch, no key needed)
async function fetchBookLibris(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://libris.kb.se/xsearch?query=isbn:${encodeURIComponent(clean)}&format=json&n=1`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return null
    const data = await res.json() as {
      xsearch?: {
        'total-hits'?: number
        list?: Array<{ title?: string; creator?: string; publisher?: string; date?: string }>
      }
    }
    const list = data.xsearch?.list
    if (!list?.length) return null
    const item = list[0]
    if (!item.title) return null

    const title = item.title.replace(/\s*\/\s*.+$/, '').replace(/\.$/, '').trim()

    const authors = item.creator
      ? item.creator.split(/\s*;\s*/).map(c => {
          const s = c.replace(/,\s*\d{4}-(\d{4})?\.?$/, '').trim()
          const comma = s.indexOf(',')
          if (comma === -1) return s
          const last = s.slice(0, comma).trim()
          const first = s.slice(comma + 1).trim()
          return first ? `${first} ${last}` : last
        }).filter(Boolean)
      : []

    // Libris publisher may be "Place : Publisher, Year"
    const rawPub = item.publisher ?? ''
    const pubParts = rawPub.split(/\s*:\s*/)
    const publisher = (pubParts.length > 1
      ? pubParts[1].replace(/,\s*\d{4}.*$/, '').trim()
      : rawPub.replace(/,\s*\d{4}.*$/, '').trim()) || null
    const place = pubParts.length > 1 ? pubParts[0].trim() : null

    return {
      title,
      authors,
      year: item.date?.match(/\d{4}/)?.[0] ?? null,
      publisher,
      place,
      isbn: clean,
      source: 'Libris / KB (Sweden)',
    }
  } catch {
    return null
  }
}

// Source 7: Finna — National Library of Finland consortium (JSON, no key needed)
async function fetchBookFinna(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(
      `https://api.finna.fi/v1/search?lookfor=isbn:${encodeURIComponent(clean)}&type=AllFields&limit=1&field[]=title&field[]=authors&field[]=year&field[]=publishers`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (!res.ok) return null
    const data = await res.json() as {
      resultCount?: number
      records?: Array<{
        title?: string
        authors?: { primary?: Record<string, unknown>; secondary?: Record<string, unknown> }
        year?: string
        publishers?: string[]
      }>
    }
    if (!data.resultCount || !data.records?.length) return null
    const item = data.records[0]
    if (!item.title) return null

    const authors = [
      ...Object.keys(item.authors?.primary ?? {}),
      ...Object.keys(item.authors?.secondary ?? {}),
    ].filter(Boolean)

    return {
      title: item.title,
      authors,
      year: item.year ?? null,
      publisher: item.publishers?.[0] ?? null,
      place: null,
      isbn: clean,
      source: 'Finna (Finland)',
    }
  } catch {
    return null
  }
}

// Source 8: Deutsche Nationalbibliothek (via CF proxy — SRU has CORS restrictions)
async function fetchBookDnb(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/dnb-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as {
      found?: boolean
      title?: string
      authors?: string[]
      year?: string | null
      publisher?: string | null
      subjects?: string[]
    }
    if (!data.found || !data.title) return null
    return {
      title: data.title,
      authors: data.authors ?? [],
      year: data.year ?? null,
      publisher: data.publisher ?? null,
      place: null,
      isbn: clean,
      source: 'Deutsche Nationalbibliothek',
    }
  } catch {
    return null
  }
}

// Source 9: Bibliothèque nationale de France (via CF proxy — SRU has CORS restrictions)
async function fetchBookBnf(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/bnf-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as {
      found?: boolean
      title?: string
      subtitle?: string
      authors?: string[]
      year?: string | null
      publisher?: string | null
    }
    if (!data.found || !data.title) return null
    return {
      title: data.title,
      subtitle: data.subtitle,
      authors: data.authors ?? [],
      year: data.year ?? null,
      publisher: data.publisher ?? null,
      place: null,
      isbn: clean,
      source: 'Bibliothèque nationale de France',
    }
  } catch {
    return null
  }
}

// Source 10: Japan National Diet Library (via CF proxy — SRU has CORS restrictions)
async function fetchBookNdl(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/ndl-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as {
      found?: boolean
      title?: string
      authors?: string[]
      year?: string | null
      publisher?: string | null
    }
    if (!data.found || !data.title) return null
    return {
      title: data.title,
      authors: data.authors ?? [],
      year: data.year ?? null,
      publisher: data.publisher ?? null,
      place: null,
      isbn: clean,
      source: '国立国会図書館 (NDL Japan)',
    }
  } catch {
    return null
  }
}

// Source 11: Europeana (via CF proxy — requires PERSONAL_API_KEY env var)
async function fetchBookEuropeana(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/europeana-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as { found?: boolean; title?: string; authors?: string[]; year?: string | null; publisher?: string | null }
    if (!data.found || !data.title) return null
    return { title: data.title, authors: data.authors ?? [], year: data.year ?? null, publisher: data.publisher ?? null, place: null, isbn: clean, source: 'Europeana' }
  } catch { return null }
}

// Source 12: Library and Archives Canada / Bibliothèque et Archives Canada (via CF proxy — SRU, no key)
async function fetchBookLac(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/lac-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as { found?: boolean; title?: string; authors?: string[]; year?: string | null; publisher?: string | null }
    if (!data.found || !data.title) return null
    return { title: data.title, authors: data.authors ?? [], year: data.year ?? null, publisher: data.publisher ?? null, place: null, isbn: clean, source: 'Library and Archives Canada' }
  } catch { return null }
}

// Source 15: National Library of New Zealand Te Puna (via CF proxy — Alma SRU, no key)
async function fetchBookNlnz(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/nlnz-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as { found?: boolean; title?: string; authors?: string[]; year?: string | null; publisher?: string | null }
    if (!data.found || !data.title) return null
    return { title: data.title, authors: data.authors ?? [], year: data.year ?? null, publisher: data.publisher ?? null, place: null, isbn: clean, source: 'National Library of New Zealand' }
  } catch { return null }
}

// Source 16: National Central Library of Taiwan 國立中央圖書館 (via CF proxy — SRU, no key)
async function fetchBookTaiwan(clean: string): Promise<BookInfo | null> {
  try {
    const res = await fetch(`/api/taiwan-isbn?isbn=${encodeURIComponent(clean)}`)
    if (!res.ok) return null
    const data = await res.json() as { found?: boolean; title?: string; authors?: string[]; year?: string | null; publisher?: string | null }
    if (!data.found || !data.title) return null
    return { title: data.title, authors: data.authors ?? [], year: data.year ?? null, publisher: data.publisher ?? null, place: null, isbn: clean, source: '國立中央圖書館 (NCL Taiwan)' }
  } catch { return null }
}

// Public entry point — two-phase parallel cascade across 14 international library sources.
// Phase 1 (JSON, fast): OL / Google / Norway / Sweden / Finland — all in parallel.
// Detect likely language/region from ISBN registration-group prefix.
// All requests still run in parallel — this only reorders which result is returned first.
function detectIsbnLang(clean: string): 'en' | 'fr' | 'de' | 'ja' | 'ko' | 'zh-tw' | 'zh-hk' | 'no' | 'sv' | 'fi' | 'other' {
  if (clean.startsWith('9780') || clean.startsWith('9781') || clean.startsWith('9798')) return 'en'
  if (clean.startsWith('9782') || clean.startsWith('97910'))                             return 'fr'
  if (clean.startsWith('9783'))                                                           return 'de'
  if (clean.startsWith('9784'))                                                           return 'ja'
  if (clean.startsWith('97882'))                                                          return 'no'
  if (clean.startsWith('97889') || clean.startsWith('97911'))                            return 'ko'
  if (clean.startsWith('97891'))                                                          return 'sv'
  if (clean.startsWith('978951') || clean.startsWith('978952'))                          return 'fi'
  if (clean.startsWith('978957') || clean.startsWith('978986') || clean.startsWith('978626')) return 'zh-tw'
  // 978-962 / 978-988 = Hong Kong; 978-972 / 978-989 covers Macau via Portugal group
  if (clean.startsWith('978962') || clean.startsWith('978988')) return 'zh-hk'
  return 'other'
}

type P2 = BookInfo | null
// Returns Phase 2 results in language-priority order.
// Sources: loc, dnb, bnf, nlk, ndl, europeana, lac, nlnz, taiwan
function p2Ordered(lang: ReturnType<typeof detectIsbnLang>, loc: P2, dnb: P2, bnf: P2, nlk: P2, ndl: P2, europeana: P2, lac: P2, nlnz: P2, taiwan: P2): P2[] {
  const all = { loc, dnb, bnf, nlk, ndl, europeana, lac, nlnz, taiwan }
  switch (lang) {
    case 'ja':    return [all.ndl,    all.loc, all.lac, all.nlnz, all.europeana, all.dnb,  all.bnf,  all.nlk,  all.taiwan]
    case 'ko':    return [all.nlk,    all.loc, all.lac, all.nlnz, all.europeana, all.dnb,  all.bnf,  all.ndl,  all.taiwan]
    case 'zh-tw': return [all.taiwan, all.loc, all.lac, all.nlnz, all.europeana, all.dnb,  all.bnf,  all.nlk,  all.ndl   ]
    case 'zh-hk': return [all.loc,    all.europeana, all.lac, all.nlnz, all.dnb, all.bnf,  all.nlk,  all.ndl,  all.taiwan]
    case 'fr':    return [all.bnf,    all.europeana, all.loc, all.lac, all.dnb, all.nlnz,  all.nlk,  all.ndl,  all.taiwan]
    case 'de':    return [all.dnb,    all.europeana, all.loc, all.lac, all.bnf, all.nlnz,  all.nlk,  all.ndl,  all.taiwan]
    case 'en':    return [all.loc,    all.lac, all.nlnz, all.europeana, all.dnb, all.bnf,  all.nlk,  all.ndl,  all.taiwan]
    case 'no':
    case 'sv':
    case 'fi':    return [all.europeana, all.loc, all.lac, all.dnb, all.bnf, all.nlnz,    all.nlk,  all.ndl,  all.taiwan]
    default:      return [all.loc,    all.dnb, all.bnf, all.nlk, all.ndl, all.europeana,  all.lac,  all.nlnz, all.taiwan]
  }
}

// All regional sources in parallel, results checked in language-priority order.
export async function fetchBookByIsbn(isbn: string): Promise<BookInfo | null> {
  const clean = isbn.replace(/[-\s]/g, '')
  const lang  = detectIsbnLang(clean)

  // Phase 1: two fast global JSON sources
  const [ol, google] = await Promise.all([fetchBookOl(clean), fetchBookGoogle(clean)])
  if (ol?.title)     return ol
  if (google?.title) return google

  // Phase 2: all remaining sources in parallel — 12 requests, no waterfalls
  const [nb, libris, finna, loc, dnb, bnf, nlk, ndl, europeana, lac, nlnz, taiwan] = await Promise.all([
    fetchBookNb(clean),
    fetchBookLibris(clean),
    fetchBookFinna(clean),
    fetchBookLoc(clean),
    fetchBookDnb(clean),
    fetchBookBnf(clean),
    fetchBookNlk(clean),
    fetchBookNdl(clean),
    fetchBookEuropeana(clean),
    fetchBookLac(clean),
    fetchBookNlnz(clean),
    fetchBookTaiwan(clean),
  ])

  // Prefer results that have both title AND authors; keep a title-only fallback
  let partial: BookInfo | null = null
  function accept(r: BookInfo | null): r is BookInfo {
    if (!r?.title) return false
    if (r.authors.length > 0) return true
    if (!partial) partial = r
    return false
  }

  // Nordic sources first for their own ISBN ranges
  if (lang === 'no' && accept(nb))     return nb
  if (lang === 'sv' && accept(libris)) return libris
  if (lang === 'fi' && accept(finna))  return finna

  // Remaining sources in language-priority order
  for (const r of p2Ordered(lang, loc, dnb, bnf, nlk, ndl, europeana, lac, nlnz, taiwan)) {
    if (accept(r)) return r!
  }

  // Nordic sources as final fallback for non-Nordic ISBNs
  if (accept(nb))     return nb
  if (accept(libris)) return libris
  if (accept(finna))  return finna

  // Nothing has authors — return the best title-only result we found
  return partial
}

// ─── Open Library book search ─────────────────────────────────────────────────

export interface BookSearchResult {
  key: string
  title: string
  authors: string[]
  year: number | null
  publisher: string | null
  isbn: string[]
  cover_url: string | null
  edition_count: number
  source_url?: string | null
  source_label?: string | null
}

export async function openLibrarySearch(
  query: string,
  options: { limit?: number; field?: 'q' | 'title' | 'author' | 'isbn' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'q' } = options
  const params = new URLSearchParams({
    [field]: query,
    limit: String(limit),
    // author_key used as fallback when author_name is missing
    fields: 'key,title,author_name,author_key,first_publish_year,publisher,isbn,cover_i,edition_count',
  })
  try {
    const res = await fetch(`https://openlibrary.org/search.json?${params.toString()}`)
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as {
      numFound?: number
      docs?: Array<{
        key?: string
        title?: string
        author_name?: string[]
        author_key?: string[]
        first_publish_year?: number
        publisher?: string[]
        isbn?: string[]
        cover_i?: number
        edition_count?: number
      }>
    }
    const docs = data.docs ?? []

    // For docs missing author_name but having author_key, resolve the name in parallel
    const authorNames: (string[] | null)[] = await Promise.all(
      docs.map(async d => {
        if ((d.author_name?.length ?? 0) > 0) return null  // already have names
        const keys = d.author_key ?? []
        if (keys.length === 0) return null
        // Fetch up to 2 author names to cover co-authored works
        const fetched = await Promise.all(
          keys.slice(0, 2).map(k =>
            fetch(`https://openlibrary.org${k}.json`)
              .then(r => r.ok ? r.json() as Promise<{ name?: string }> : null)
              .then(a => a?.name ?? null)
              .catch(() => null)
          )
        )
        const names = fetched.filter((n): n is string => Boolean(n))
        return names.length > 0 ? names : null
      })
    )

    return {
      total: data.numFound ?? 0,
      items: docs.map((d, i) => ({
        key: d.key ?? '',
        title: d.title ?? '',
        authors: d.author_name ?? authorNames[i] ?? [],
        year: d.first_publish_year ?? null,
        publisher: d.publisher?.[0] ?? null,
        isbn: (d.isbn ?? []).filter(s => s.length === 13 || s.length === 10).slice(0, 2),
        cover_url: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
        edition_count: d.edition_count ?? 1,
      })),
    }
  } catch {
    return { total: 0, items: [] }
  }
}

// ─── Book text search (multilingual routing) ──────────────────────────────────

/**
 * Detects the primary non-Latin script in a query string.
 * Used to route title/author searches to the appropriate national library API.
 */
export function detectQueryLang(q: string): 'ko' | 'ja' | 'zh' | 'other' {
  if (/[가-힯ᄀ-ᇿ]/.test(q)) return 'ko'
  if (/[぀-ヿ]/.test(q)) return 'ja'
  if (/[一-鿿㐀-䶿]/.test(q)) return 'zh'
  return 'other'
}

/** Search Korean National Library by keyword/title/author via CF proxy. */
export async function nlkBookSearch(
  query: string,
  options: { limit?: number; field?: 'title' | 'author' | 'total' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'total' } = options
  const target = field === 'author' ? 'author' : field === 'title' ? 'title' : 'total'
  try {
    const params = new URLSearchParams({ q: query, target, limit: String(limit) })
    const res = await fetch(`/api/nlk-search?${params.toString()}`)
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as {
      total?: number
      items?: Array<{
        title?: string
        authors?: string[]
        year?: number | null
        publisher?: string | null
        isbn?: string[]
        cover_url?: string | null
        edition_count?: number
      }>
    }
    return {
      total: data.total ?? 0,
      items: (data.items ?? []).map((item, i) => {
        const isbn0 = item.isbn?.[0] ?? ''
        return {
          key: isbn0 || `nlk-${i}`,
          title: item.title ?? '',
          authors: item.authors ?? [],
          year: typeof item.year === 'number' ? item.year : (item.year ? parseInt(String(item.year), 10) || null : null),
          publisher: item.publisher ?? null,
          isbn: item.isbn ?? [],
          cover_url: null,
          edition_count: 1,
          source_url: isbn0
            ? `https://www.nl.go.kr/NL/search/search.do?searchType=BI&kwd=${isbn0}`
            : (item.title ? `https://www.nl.go.kr/NL/search/search.do?kwd=${encodeURIComponent(item.title)}` : null),
          source_label: 'NLK',
        }
      }),
    }
  } catch {
    return { total: 0, items: [] }
  }
}

/** Search Japan NDL by title/author via CF proxy (SRU, no key needed). */
export async function ndlBookSearch(
  query: string,
  options: { limit?: number; field?: 'title' | 'author' | 'any' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'any' } = options
  const target = field === 'author' ? 'author' : field === 'title' ? 'title' : 'any'
  try {
    const params = new URLSearchParams({ q: query, target, limit: String(limit) })
    const res = await fetch(`/api/ndl-search?${params.toString()}`)
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as {
      total?: number
      items?: Array<{
        title?: string
        authors?: string[]
        year?: number | null
        publisher?: string | null
        isbn?: string[]
        cover_url?: string | null
        edition_count?: number
      }>
    }
    return {
      total: data.total ?? 0,
      items: (data.items ?? []).map((item, i) => {
        const isbn0 = item.isbn?.[0] ?? ''
        return {
          key: isbn0 || `ndl-${i}`,
          title: item.title ?? '',
          authors: item.authors ?? [],
          year: typeof item.year === 'number' ? item.year : (item.year ? parseInt(String(item.year), 10) || null : null),
          publisher: item.publisher ?? null,
          isbn: item.isbn ?? [],
          cover_url: null,
          edition_count: 1,
          source_url: isbn0
            ? `https://ndlsearch.ndl.go.jp/search?searchWord=${isbn0}`
            : (item.title ? `https://ndlsearch.ndl.go.jp/search?searchWord=${encodeURIComponent(item.title)}` : null),
          source_label: 'NDL',
        }
      }),
    }
  } catch {
    return { total: 0, items: [] }
  }
}

/** Search Taiwan NCL by title/author via CF proxy (SRU, no key needed). */
export async function taiwanBookSearch(
  query: string,
  options: { limit?: number; field?: 'title' | 'author' | 'any' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'any' } = options
  const target = field === 'author' ? 'author' : field === 'title' ? 'title' : 'any'
  try {
    const params = new URLSearchParams({ q: query, target, limit: String(limit) })
    const res = await fetch(`/api/taiwan-search?${params.toString()}`)
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as { total?: number; items?: BookSearchResult[] }
    return {
      total: data.total ?? 0,
      items: (data.items ?? []).map((item, i) => {
        const isbn0 = item.isbn?.[0] ?? ''
        return {
          key: isbn0 || `tw-${i}`,
          title: item.title ?? '',
          authors: item.authors ?? [],
          year: item.year ?? null,
          publisher: item.publisher ?? null,
          isbn: item.isbn ?? [],
          cover_url: null,
          edition_count: 1,
          source_url: isbn0
            ? `https://aleweb.ncl.edu.tw/F/?func=find-b&find_code=ISB&request=${isbn0}`
            : (item.title ? `https://aleweb.ncl.edu.tw/F/?func=find-b&find_code=WTI&request=${encodeURIComponent(item.title)}` : null),
          source_label: 'NCL Taiwan',
        }
      }),
    }
  } catch {
    return { total: 0, items: [] }
  }
}

/** Search BnF by title/author via CF proxy (SRU, no key needed). */
export async function bnfBookSearch(
  query: string,
  options: { limit?: number; field?: 'title' | 'author' | 'any' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'any' } = options
  const target = field === 'author' ? 'author' : field === 'title' ? 'title' : 'any'
  try {
    const params = new URLSearchParams({ q: query, target, limit: String(limit) })
    const res = await fetch(`/api/bnf-search?${params.toString()}`)
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as { total?: number; items?: BookSearchResult[] }
    return {
      total: data.total ?? 0,
      items: (data.items ?? []).map((item, i) => {
        const isbn0 = item.isbn?.[0] ?? ''
        return {
          key: isbn0 || `bnf-${i}`,
          title: item.title ?? '',
          authors: item.authors ?? [],
          year: item.year ?? null,
          publisher: item.publisher ?? null,
          isbn: item.isbn ?? [],
          cover_url: null,
          edition_count: 1,
          source_url: isbn0
            ? `https://catalogue.bnf.fr/recherche.do?motRecherche=${isbn0}&typeRecherche=isbn`
            : (item.title ? `https://catalogue.bnf.fr/recherche.do?motRecherche=${encodeURIComponent(item.title)}&typeRecherche=titre` : null),
          source_label: 'BnF',
        }
      }),
    }
  } catch {
    return { total: 0, items: [] }
  }
}

/** Search DNB by title/author via CF proxy (SRU, no key needed). */
export async function dnbBookSearch(
  query: string,
  options: { limit?: number; field?: 'title' | 'author' | 'any' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'any' } = options
  const target = field === 'author' ? 'author' : field === 'title' ? 'title' : 'any'
  try {
    const params = new URLSearchParams({ q: query, target, limit: String(limit) })
    const res = await fetch(`/api/dnb-search?${params.toString()}`)
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as { total?: number; items?: BookSearchResult[] }
    return {
      total: data.total ?? 0,
      items: (data.items ?? []).map((item, i) => {
        const isbn0 = item.isbn?.[0] ?? ''
        return {
          key: isbn0 || `dnb-${i}`,
          title: item.title ?? '',
          authors: item.authors ?? [],
          year: item.year ?? null,
          publisher: item.publisher ?? null,
          isbn: item.isbn ?? [],
          cover_url: null,
          edition_count: 1,
          source_url: isbn0
            ? `https://portal.dnb.de/opac.htm?method=simpleSearch&cqlMode=true&query=isbn%3D${isbn0}`
            : (item.title ? `https://portal.dnb.de/opac.htm?method=simpleSearch&query=${encodeURIComponent(item.title)}` : null),
          source_label: 'DNB',
        }
      }),
    }
  } catch {
    return { total: 0, items: [] }
  }
}

/** Search Nasjonalbiblioteket (Norway) directly — CORS-native JSON API. */
export async function nbBookSearch(
  query: string,
  options: { limit?: number; field?: 'title' | 'author' | 'any' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'any' } = options
  const qStr = field === 'title' ? `title:${query}` : field === 'author' ? `creator:${query}` : query
  try {
    const params = new URLSearchParams({ q: qStr, mediatype: 'bøker', size: String(limit) })
    const res = await fetch(`https://api.nb.no/catalog/v1/items?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as {
      page?: { totalElements?: number }
      _embedded?: {
        items?: Array<{
          metadata?: {
            title?: string
            creators?: string[]
            originInfo?: { publisher?: string; issued?: string }
            // identifiers is an object with named keys (isbn13, isbn10, sesamId, oaiId)
            identifiers?: { isbn13?: string[]; isbn10?: string[]; sesamId?: string; oaiId?: string }
          }
        }>
      }
    }
    const total = data.page?.totalElements ?? 0
    const itemsRaw = data._embedded?.items ?? []
    const items: BookSearchResult[] = itemsRaw.map((entry, i) => {
      const meta = entry.metadata
      if (!meta?.title) return null as unknown as BookSearchResult
      // creators is a plain string array: ["Lastname, Firstname", ...]
      const authors = (meta.creators ?? []).map(c => {
        const s = c.replace(/,\s*\d{4}-(\d{4})?\.?$/, '').trim()
        const comma = s.indexOf(',')
        if (comma === -1) return s.trim()
        return [s.slice(comma + 1).trim(), s.slice(0, comma).trim()].filter(Boolean).join(' ')
      }).filter(Boolean)
      // identifiers is an object with isbn13/isbn10 as arrays
      const isbn13 = meta.identifiers?.isbn13?.[0]?.replace(/[-\s]/g, '') ?? ''
      const isbn10 = meta.identifiers?.isbn10?.[0]?.replace(/[-\s]/g, '') ?? ''
      const isbn = isbn13 || isbn10
      // issued may be "2006" or "20060101" — extract first 4-digit year
      const year = meta.originInfo?.issued?.match(/\d{4}/)?.[0]
      return {
        key: isbn || `nb-${i}`,
        title: meta.title,
        authors,
        year: year ? parseInt(year, 10) : null,
        publisher: meta.originInfo?.publisher ?? null,
        isbn: isbn ? [isbn] : [],
        cover_url: null,
        edition_count: 1,
        source_url: isbn
          ? `https://www.nb.no/search?q=${isbn}`
          : (meta.title ? `https://www.nb.no/search?q=${encodeURIComponent(meta.title)}&mediatype=b%C3%B8ker` : null),
        source_label: 'NB',
      }
    }).filter(Boolean)
    return { total, items }
  } catch {
    return { total: 0, items: [] }
  }
}

/** Search Libris / KB (Sweden) directly — CORS-native JSON xsearch. */
export async function librisBookSearch(
  query: string,
  options: { limit?: number; field?: 'title' | 'author' | 'any' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'any' } = options
  const qStr = field === 'title' ? `title:${query}` : field === 'author' ? `creator:${query}` : query
  try {
    const params = new URLSearchParams({ query: qStr, format: 'json', n: String(limit) })
    const res = await fetch(`https://libris.kb.se/xsearch?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as {
      xsearch?: {
        'total-hits'?: number
        list?: Array<{ title?: string; creator?: string; publisher?: string; date?: string; identifier?: string }>
      }
    }
    const hits = data.xsearch?.['total-hits'] ?? 0
    const list = data.xsearch?.list ?? []
    const items: BookSearchResult[] = list.map((entry, i) => {
      if (!entry.title) return null as unknown as BookSearchResult
      const title = entry.title.replace(/\s*\/\s*.+$/, '').replace(/\.$/, '').trim()
      const authors = entry.creator
        ? entry.creator.split(/\s*;\s*/).map(c => {
            const s = c.replace(/,\s*\d{4}-(\d{4})?\.?$/, '').trim()
            const comma = s.indexOf(',')
            if (comma === -1) return s
            return [s.slice(comma + 1).trim(), s.slice(0, comma).trim()].filter(Boolean).join(' ')
          }).filter(Boolean)
        : []
      const isbn = (entry.identifier ?? '').replace(/[-\s]/g, '').match(/\d{10,13}/)?.[0] ?? ''
      // Libris publisher can be a string or array; format: "City : Publisher Name"
      const pubRaw = Array.isArray(entry.publisher)
        ? (entry.publisher as string[]).find(p => p.includes(' : ')) ?? (entry.publisher as string[])[0]
        : entry.publisher
      const publisher = pubRaw
        ? (pubRaw.includes(' : ')
            ? pubRaw.split(' : ').slice(1).join(' : ').replace(/\.$/, '').trim()
            : pubRaw.split(/\s*;\s*/)[0].replace(/\.$/, '').trim())
        : null
      return {
        key: isbn || `libris-${i}`,
        title,
        authors,
        year: entry.date ? parseInt(entry.date.match(/\d{4}/)?.[0] ?? '', 10) || null : null,
        publisher,
        isbn: isbn ? [isbn] : [],
        cover_url: null,
        edition_count: 1,
        source_url: isbn
          ? `https://libris.kb.se/search?q=${isbn}`
          : (title ? `https://libris.kb.se/search?q=${encodeURIComponent(title)}` : null),
        source_label: 'Libris',
      }
    }).filter(Boolean)
    return { total: hits, items }
  } catch {
    return { total: 0, items: [] }
  }
}

/** Search Finna (Finland) directly — CORS-native JSON API. */
export async function finnaBookSearch(
  query: string,
  options: { limit?: number; field?: 'title' | 'author' | 'any' } = {}
): Promise<{ total: number; items: BookSearchResult[] }> {
  const { limit = 15, field = 'any' } = options
  const type = field === 'title' ? 'Title' : field === 'author' ? 'Author' : 'AllFields'
  try {
    const params = new URLSearchParams({
      lookfor: query, type, limit: String(limit),
      'field[]': 'title,authors,year,publishers,identifiers',
    })
    const res = await fetch(`https://api.finna.fi/v1/search?${params.toString()}`, {
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return { total: 0, items: [] }
    const data = await res.json() as {
      resultCount?: number
      records?: Array<{
        title?: string
        authors?: { primary?: Record<string, unknown>; secondary?: Record<string, unknown> }
        year?: string
        publishers?: string[]
        identifiers?: string[]
      }>
    }
    const total = data.resultCount ?? 0
    const items: BookSearchResult[] = (data.records ?? []).map((r, i) => {
      if (!r.title) return null as unknown as BookSearchResult
      // Finna author dict keys are "Name, role" — strip lowercase role word after last comma
      const authors = [
        ...Object.keys(r.authors?.primary ?? {}),
        ...Object.keys(r.authors?.secondary ?? {}),
      ].map(name => name.replace(/,\s+[a-zäöåæø]+$/, '').trim()).filter(Boolean)
      // Finna identifiers are strings like "ISBN:9789510430873"
      const isbn = (r.identifiers ?? [])
        .find(id => /^ISBN:/i.test(id))
        ?.replace(/^ISBN:/i, '').replace(/[-\s]/g, '') ?? ''
      return {
        key: isbn || `finna-${i}`,
        title: r.title,
        authors,
        year: r.year ? parseInt(r.year, 10) || null : null,
        publisher: r.publishers?.[0] ?? null,
        isbn: isbn ? [isbn] : [],
        cover_url: null,
        edition_count: 1,
        source_url: isbn
          ? `https://finna.fi/Search/Results?lookfor=${isbn}&type=ISN`
          : (r.title ? `https://finna.fi/Search/Results?lookfor=${encodeURIComponent(r.title)}&type=Title` : null),
        source_label: 'Finna',
      }
    }).filter(Boolean)
    return { total, items }
  } catch {
    return { total: 0, items: [] }
  }
}

/**
 * Merge results from multiple sources, deduplicate by ISBN-13 then normalised title.
 * Earlier sources in the array take priority when there's a duplicate.
 */
export function mergeBookResults(
  ...sets: { items: BookSearchResult[] }[]
): BookSearchResult[] {
  const seenIsbn  = new Set<string>()
  const seenTitle = new Set<string>()
  const out: BookSearchResult[] = []
  for (const { items } of sets) {
    for (const item of items) {
      if (!item.title) continue
      const isbn13 = item.isbn.find(s => s.length === 13)
      if (isbn13) {
        if (seenIsbn.has(isbn13)) continue
        seenIsbn.add(isbn13)
      } else {
        const norm = item.title.toLowerCase().replace(/\W/g, '').slice(0, 40)
        if (seenTitle.has(norm)) continue
        seenTitle.add(norm)
      }
      out.push(item)
    }
  }
  return out.slice(0, 24)
}

export async function fetchOpenAlexSearch(query: string, page = 1) {
  const params = new URLSearchParams({
    search: query,
    filter: `doi_starts_with:${PSG_PREFIX}`,
    page: String(page),
    per_page: '20',
    select: 'id,title,doi,publication_year,primary_location,cited_by_count',
  })
  const res = await fetch(`${OPENALEX}/works?${params.toString()}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) return null
  return res.json()
}
