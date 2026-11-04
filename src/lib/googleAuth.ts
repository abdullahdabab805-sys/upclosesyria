// Service-account access token for Google APIs (SEO day 7: Search Console, read-only), with no SDK:
// a JWT signed RS256 with the account's private key, exchanged at Google's OAuth token endpoint.
// Reference: https://developers.google.com/identity/protocols/oauth2/service-account#httprestapi
import { createSign } from 'node:crypto'

export type ServiceAccount = { client_email: string; private_key: string; token_uri?: string }
export const SEARCH_CONSOLE_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const TOKEN_URI = 'https://oauth2.googleapis.com/token'

/** The key file as stored in an environment variable: raw JSON or base64 of it. Null when unusable. */
export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw?.trim()) return null
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8')
  try {
    const j = JSON.parse(text) as Partial<ServiceAccount>
    return j.client_email && j.private_key ? { client_email: j.client_email, private_key: j.private_key, token_uri: j.token_uri } : null
  } catch {
    return null
  }
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString('base64url')

export function signedAssertion(sa: ServiceAccount, scope: string, now = new Date()): string {
  const iat = Math.floor(now.getTime() / 1000)
  const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope, aud: sa.token_uri ?? TOKEN_URI, iat, exp: iat + 3600 }))
  const sig = createSign('RSA-SHA256').update(`${head}.${claims}`).sign(sa.private_key)
  return `${head}.${claims}.${b64url(sig)}`
}

export async function accessToken(sa: ServiceAccount, scope: string, fetchFn: typeof fetch = fetch): Promise<string> {
  const res = await fetchFn(sa.token_uri ?? TOKEN_URI, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: signedAssertion(sa, scope) }),
  })
  if (!res.ok) throw new Error(`Google token endpoint answered ${res.status}`)
  const body = (await res.json()) as { access_token?: string }
  if (!body.access_token) throw new Error('Google token endpoint returned no access_token')
  return body.access_token
}
