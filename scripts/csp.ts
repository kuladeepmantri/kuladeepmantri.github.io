/**
 * Adds a Content-Security-Policy <meta> to every exported page.
 *
 * GitHub Pages cannot send headers, and Next.js inlines its flight data as
 * <script> tags, so script-src lists the sha256 of each inline script on that
 * page. Never add 'unsafe-inline' to script-src. Styles keep 'unsafe-inline'
 * for React style attributes. frame-ancestors is ignored in a <meta> policy.
 *
 * Usage: tsx scripts/csp.ts [dir]   (default: out). Runs after `next build`.
 */

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = process.argv[2] ?? 'out'

const BASE = [
  "default-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self'",
  "font-src 'self'",
  // The browser refresh reads GitHub's public events API (lib/live-client.ts).
  "connect-src 'self' https://api.github.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "worker-src 'none'",
  "manifest-src 'self'",
]

const SCRIPT = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi
const META = /<meta http-equiv="Content-Security-Policy"[^>]*>/i
const JS_TYPE = /^(|text\/javascript|application\/javascript|module)$/i

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => join(e.parentPath, e.name))
}

function policy(html: string): string {
  const hashes = new Set<string>()
  for (const [, attrs = '', body] of html.matchAll(SCRIPT)) {
    if (/\ssrc=/i.test(attrs)) continue
    const type = attrs.match(/\stype=["']?([^"'\s>]*)/i)?.[1] ?? ''
    if (!JS_TYPE.test(type)) continue // data blocks such as JSON-LD never run
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`)
  }
  return [BASE[0], `script-src 'self' ${[...hashes].join(' ')}`.trim(), ...BASE.slice(1)].join('; ')
}

let pages = 0
for (const file of htmlFiles(DIR)) {
  // Idempotent: a policy or early redirect copy from an earlier run goes first.
  const html = readFileSync(file, 'utf8')
    .replace(META, '')
    .replace(/<script id="moved-early">[\s\S]*?<\/script>/, '')
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy(html)}"/>`
  // The 404 page's old-URL redirect (app/not-found.tsx) is copied right after
  // the policy, ahead of the stylesheet, so it never waits for it. The
  // original stays where React rendered it so hydration still matches; a
  // second location.replace() to the same place is harmless, and both copies
  // share one hash.
  const original = html.match(/<script id="moved">[\s\S]*?<\/script>/)?.[0]
  const moved = original ? original.replace('id="moved"', 'id="moved-early"') : ''
  // Right after the charset, before any script, so it governs all of them.
  const charset = html.match(/<meta charSet="utf-8"\/?>/i)
  const out = charset
    ? html.replace(charset[0], charset[0] + meta + moved)
    : html.replace(/<head(\s[^>]*)?>/i, (m) => m + meta + moved)
  if (out === html) throw new Error(`csp: no <head> in ${file}`)
  writeFileSync(file, out)
  pages++
}
console.log(`[csp] policy added to ${pages} page(s) in ${DIR}`)
