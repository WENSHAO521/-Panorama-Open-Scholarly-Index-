/**
 * Cloudflare Pages Function — proxy for Korean National Library keyword/title/author search.
 * Required env var: NLK_API_KEY
 *
 * Usage: GET /api/nlk-search?q=토지&target=title
 *        target: title | author | total (default: total)
 */
export async function onRequestGet({ request, env }) {
  const certKey = env.NLK_API_KEY
  if (!certKey) return json({ total: 0, items: [], error: 'NLK_API_KEY not configured' }, 503)

  const url = new URL(request.url)
  const q      = url.searchParams.get('q') ?? ''
  const target = url.searchParams.get('target') ?? 'total'

  if (!q.trim()) return json({ total: 0, items: [] }, 200)

  const params = new URLSearchParams({
    key: certKey,
    kwd: q,
    srchTarget: ['title', 'author', 'total'].includes(target) ? target : 'total',
    pageNum: '1',
    pageSize: '15',
  })

  let upstream
  try {
    upstream = await fetch(
      `https://www.nl.go.kr/NL/search/openApi/search.do?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(10000),
      }
    )
  } catch {
    return json({ total: 0, items: [], error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ total: 0, items: [], error: `NLK ${upstream.status}` }, 502)

  const xml = await upstream.text()
  const total = parseInt(xmlText(xml, 'total') || '0', 10)

  const docBlocks = xmlAll(xml, 'doc')
  const items = docBlocks.map(block => {
    const title = xmlText(block, 'titleInfo') || xmlText(block, 'title_info')
    if (!title) return null
    const authorRaw = xmlText(block, 'authorInfo') || xmlText(block, 'author_info')
    const authors = authorRaw
      ? authorRaw.split(/[;,]/).map(a =>
          a.replace(/\s*(저|지음|글|엮음|편|역|옮김|著|著者)\s*$/, '').trim()
        ).filter(Boolean)
      : []
    const publisher = xmlText(block, 'pubInfo') || xmlText(block, 'pub_info') || null
    const yearRaw   = xmlText(block, 'pubYearInfo') || xmlText(block, 'pub_year_info')
    const year      = yearRaw ? parseInt(yearRaw.match(/\d{4}/)?.[0] ?? '', 10) || null : null
    const isbn      = xmlText(block, 'isbnNum') || xmlText(block, 'isbn') || ''
    const coverUrl  = null

    return { title, authors, year, publisher, isbn: isbn ? [isbn] : [], cover_url: coverUrl, edition_count: 1 }
  }).filter(Boolean)

  return json({ total, items }, 200)
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() })
}

function xmlText(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const raw = re.exec(xml)?.[1] ?? ''
  return raw
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim()
}

function xmlAll(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'gi')
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
