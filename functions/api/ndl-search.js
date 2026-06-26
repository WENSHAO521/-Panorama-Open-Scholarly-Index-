/**
 * Cloudflare Pages Function — proxy for Japan NDL (National Diet Library) SRU title/author search.
 * No API key required; CORS bypass only.
 *
 * Usage: GET /api/ndl-search?q=銀河鉄道の夜&target=title
 *        target: title | author | any (default: any)
 */
export async function onRequestGet({ request }) {
  const url    = new URL(request.url)
  const q      = (url.searchParams.get('q') ?? '').trim()
  const target = url.searchParams.get('target') ?? 'any'

  if (!q) return json({ total: 0, items: [] }, 200)

  // Build CQL query
  let cql
  if (target === 'title')  cql = `title="${q}"`
  else if (target === 'author') cql = `creator="${q}"`
  else                      cql = `(title="${q}" or creator="${q}")`

  const params = new URLSearchParams({
    operation: 'searchRetrieve',
    version: '1.2',
    recordSchema: 'dc',
    maximumRecords: '15',
    startRecord: '1',
    query: cql,
  })

  let upstream
  try {
    upstream = await fetch(`https://iss.ndl.go.jp/api/sru?${params.toString()}`, {
      headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
      signal: AbortSignal.timeout(10000),
    })
  } catch {
    return json({ total: 0, items: [], error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ total: 0, items: [], error: `NDL ${upstream.status}` }, 502)

  const xml = await upstream.text()
  const totalRaw = xmlText(xml, 'zs:numberOfRecords') || xmlText(xml, 'numberOfRecords')
  const total    = parseInt(totalRaw || '0', 10)

  const recordBlocks = xmlAll(xml, 'zs:record').length
    ? xmlAll(xml, 'zs:record')
    : xmlAll(xml, 'record')

  const items = recordBlocks.map(block => {
    const dcData  = xmlText(block, 'dc:title') ? block : (xmlAll(block, 'dc')[0] ?? block)
    const title   = xmlText(dcData, 'dc:title') || xmlText(dcData, 'title')
    if (!title) return null
    const creatorsRaw = xmlAll(dcData, 'dc:creator')
    const authorsRaw  = creatorsRaw.length ? creatorsRaw.map(c => c.trim()) : []
    const authors = authorsRaw
      .map(a => a.replace(/\s*\d{4}-(\d{4})?$/, '').trim())
      .filter(Boolean)
    const publisher = xmlText(dcData, 'dc:publisher') || null
    const dateRaw   = xmlText(dcData, 'dc:date') || xmlText(dcData, 'date') || ''
    const year      = parseInt(dateRaw.match(/\d{4}/)?.[0] ?? '', 10) || null
    const isbnRaw   = xmlAll(dcData, 'dc:identifier')
      .find(id => /isbn/i.test(id) || /^\d{10,13}$/.test(id.replace(/[-\s]/g, '')))
    const isbn = isbnRaw ? isbnRaw.replace(/isbn[:\s]*/i, '').replace(/[-\s]/g, '').trim() : ''

    return { title, authors, year, publisher, isbn: isbn ? [isbn] : [], cover_url: null, edition_count: 1 }
  }).filter(Boolean)

  return json({ total, items }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

function xmlText(xml, tag) {
  const tagName = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i')
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function xmlAll(xml, tag) {
  const tagName = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'gi')
  const out = []
  let m
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1])
  }
  return out
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store',
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
