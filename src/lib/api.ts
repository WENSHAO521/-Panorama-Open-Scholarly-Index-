import type { Article, RorOrganization, DoajJournalInfo } from './types'
import { ALL_JOURNALS, PSG_JOURNALS } from './data'

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
  } = {}
): Promise<{ total: number; items: Article[] }> {
  const { page = 1, rows = 20, yearFrom, yearTo, scope = 'all', issn } = options

  // Crossref supports CORS; browsers strip User-Agent anyway so omit it here
  const offset = (page - 1) * rows
  const filterParts = [ARTICLE_FILTER]
  if (yearFrom || yearTo) {
    const from = yearFrom ?? 1900
    const to = yearTo ?? new Date().getFullYear()
    filterParts.push(`from-pub-date:${from}`, `until-pub-date:${to}`)
  }
  if (issn) filterParts.push(`issn:${issn}`)

  const params = new URLSearchParams({
    rows: String(rows),
    offset: String(offset),
    sort: query ? 'relevance' : 'published',
    order: 'desc',
    filter: filterParts.join(','),
    mailto: 'posi@panoramagroup.org',
  })
  if (query) params.set('query', query)

  const endpoint = scope === 'psg'
    ? `${CROSSREF}/members/${PSG_MEMBER}/works`
    : `${CROSSREF}/works`

  const headers: Record<string, string> = typeof window === 'undefined'
    ? { 'User-Agent': UA }
    : {}

  const res = await fetch(`${endpoint}?${params.toString()}`, { headers })
  if (!res.ok) return { total: 0, items: [] }

  const data = await res.json()
  const msg = data.message
  return {
    total: msg['total-results'] ?? 0,
    items: (msg.items ?? []).map(mapCrossrefWork),
  }
}

export async function crossrefGetWork(doi: string): Promise<Article | null> {
  const res = await fetch(`${CROSSREF}/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) return null
  const data = await res.json()
  return mapCrossrefWork(data.message)
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

// ─── DOAJ (Directory of Open Access Journals) ────────────────────────────────

const DOAJ = 'https://doaj.org/api/v4'

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
      in_doaj: (admin.in_doaj as boolean) ?? false,
      has_seal: (admin.ticked as boolean) ?? false,
      license: ((bib.license as Array<{ type: string }>)?.[0]?.type) ?? null,
      has_apc: ((bib.apc as { has_apc?: boolean })?.has_apc) ?? false,
      apc_max: ((bib.apc as { max?: { currency: string; price: number }[] })?.max) ?? [],
      subjects: ((bib.subject as Array<{ term: string }>) ?? []).map(s => s.term),
      last_updated: (first.last_updated as string) ?? null,
      doaj_id: (first.id as string) ?? null,
    }
  } catch {
    return null
  }
}

// Legacy aliases used by /api/doi/[doi]
export const fetchOpenAlexWork = openAlexGetWork
export const fetchCrossrefWork = crossrefGetWork

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
