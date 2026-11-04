import { createVerify, generateKeyPairSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { SEARCH_CONSOLE_SCOPE, accessToken, parseServiceAccount, signedAssertion } from '@/lib/googleAuth'

// A throwaway key generated for the test; no real account is involved.
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const sa = { client_email: 'test@example.iam.gserviceaccount.com', private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() }

describe('parseServiceAccount', () => {
  it('reads raw JSON and base64 JSON', () => {
    expect(parseServiceAccount(JSON.stringify(sa))?.client_email).toBe(sa.client_email)
    expect(parseServiceAccount(Buffer.from(JSON.stringify(sa)).toString('base64'))?.private_key).toBe(sa.private_key)
  })
  it('is null when unset, broken or incomplete', () => {
    expect(parseServiceAccount(undefined)).toBeNull()
    expect(parseServiceAccount('  ')).toBeNull()
    expect(parseServiceAccount('{not json')).toBeNull()
    expect(parseServiceAccount(JSON.stringify({ client_email: 'x' }))).toBeNull()
  })
})

describe('signedAssertion', () => {
  it('is a valid RS256 JWT for the token endpoint with the read-only scope and one hour of life', () => {
    const now = new Date('2026-11-08T03:00:00Z')
    const [h, c, s] = signedAssertion(sa, SEARCH_CONSOLE_SCOPE, now).split('.')
    expect(JSON.parse(Buffer.from(h!, 'base64url').toString())).toEqual({ alg: 'RS256', typ: 'JWT' })
    const claims = JSON.parse(Buffer.from(c!, 'base64url').toString())
    expect(claims).toMatchObject({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token' })
    expect(claims.exp - claims.iat).toBe(3600)
    expect(createVerify('RSA-SHA256').update(`${h}.${c}`).verify(publicKey, Buffer.from(s!, 'base64url'))).toBe(true)
  })
})

describe('accessToken', () => {
  it('exchanges the assertion for a token', async () => {
    let body = ''
    const fake = (async (_url: string, init?: RequestInit) => {
      body = String(init?.body)
      return Response.json({ access_token: 'tok' })
    }) as typeof fetch
    expect(await accessToken(sa, SEARCH_CONSOLE_SCOPE, fake)).toBe('tok')
    expect(body).toContain('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer')
  })
  it('throws on an error status or a missing token', async () => {
    await expect(accessToken(sa, SEARCH_CONSOLE_SCOPE, (async () => new Response('', { status: 400 })) as typeof fetch)).rejects.toThrow('400')
    await expect(accessToken(sa, SEARCH_CONSOLE_SCOPE, (async () => Response.json({})) as typeof fetch)).rejects.toThrow('no access_token')
  })
})
