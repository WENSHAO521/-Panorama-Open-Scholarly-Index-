/**
 * Cloudflare Pages Function — proxy for Korean National Library Open API.
 * Required env var: NLK_API_KEY  (register at www.nl.go.kr/NL/search/openApi/openApiInfo.do)
 *
 * Usage: GET /api/nlk-isbn?isbn=9791158391485
 */
export async function onRequestGet({ request, env }) {
  const certKey = env.NLK_API_KEY
  if (!certKey) return json({ found: false, error: 'NLK_API_KEY not configured' }, 503)

  const url = new URL(request.url)
  const isbn = url.searchParams.get('isbn')

  if (!isbn) return json({ error: 'Missing isbn parameter' }, 400)
  const clean = isbn.replace(/[-\s]/g, '')
  if (!/^\d{10}$|^\d{13}$/.test(clean)) return json({ error: 'Invalid isbn' }, 400)

  // NL Open API: search by ISBN, filter to books (도서) only
  const params = new URLSearchParams({
    key: certKey,
    kwd: clean,
    srchTarget: 'total',
    pageNum: '1',
    pageSize: '1',
    category1: '도서',
  })

  let upstream
  try {
    upstream = await fetch(
      `https://www.nl.go.kr/NL/search/openApi/search.do?${params.toString()}`,
      {
        headers: { 'User-Agent': 'POSI/0.1 (mailto:posi@panoramagroup.org)' },
        signal: AbortSignal.timeout(8000),
      }
    )
  } catch {
    return json({ found: false, error: 'Upstream fetch failed' }, 502)
  }

  if (!upstream.ok) return json({ found: false, error: `NLK ${upstream.status}` }, 502)

  const xml = await upstream.text()

  const total = parseInt(xmlText(xml, 'total') || '0', 10)
  if (total === 0) return json({ found: false }, 200)

  const title =
    xmlText(xml, 'titleInfo') || xmlText(xml, 'title_info') ||
    xmlText(xml, 'title') || xmlText(xml, 'titleName') || xmlText(xml, 'title_name')
  if (!title) return json({ found: false }, 200)

  const authorRaw =
    xmlText(xml, 'authorInfo') || xmlText(xml, 'author_info') ||
    xmlText(xml, 'author') || xmlText(xml, 'creator')
  const authors = authorRaw
    ? authorRaw.split(/[;,]/).map(a =>
        a.replace(/\s*(저|지음|글|엮음|편|역|옮김|著|著者|글·그림)\s*$/, '').trim()
      ).filter(Boolean)
    : []

  const publisher =
    xmlText(xml, 'pubInfo') || xmlText(xml, 'pub_info') || xmlText(xml, 'publisher') || null
  const yearRaw =
    xmlText(xml, 'pubYearInfo') || xmlText(xml, 'pub_year_info') ||
    xmlText(xml, 'year') || xmlText(xml, 'date')
  const year = yearRaw?.match?.(/\d{4}/)?.[0] ?? null

  return json({ found: true, title, authors, year, publisher }, 200)
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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=86400',
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
