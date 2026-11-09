/** Remote-browser DeepSeek sign-in completion by pasted loopback redirect. */
import { describe, expect, it, vi } from 'vitest'
import { deliverRemoteCallback, isRemoteBrowser, remoteCallbackPath } from '../src/client/remote-callback.ts'

describe('remote sign-in callback', () => {
  it('treats only non-loopback HTTPS pages as remote browsers', () => {
    expect(isRemoteBrowser({ protocol: 'https:', hostname: 'harness.example.net' })).toBe(true)
    expect(isRemoteBrowser({ protocol: 'http:', hostname: '127.0.0.1' })).toBe(false)
    expect(isRemoteBrowser({ protocol: 'https:', hostname: 'localhost' })).toBe(false)
    expect(isRemoteBrowser({ protocol: 'http:', hostname: 'harness.example.net' })).toBe(false)
  })

  it('keeps only code and state from a pasted loopback callback address', () => {
    expect(remoteCallbackPath('  http://127.0.0.1:3080/oauth/callback?code=a%2Bb&state=s1&extra=x  '))
      .toBe('/oauth/callback?code=a%2Bb&state=s1')
    expect(remoteCallbackPath('http://localhost:9/oauth/callback?state=s&code=c')).toBe('/oauth/callback?code=c&state=s')
  })

  it.each([
    'not a url',
    'https://127.0.0.1:3080/oauth/callback?code=c&state=s',
    'http://evil.example/oauth/callback?code=c&state=s',
    'http://127.0.0.1:3080/other?code=c&state=s',
    'http://127.0.0.1:3080/oauth/callback?code=c',
    'http://127.0.0.1:3080/oauth/callback?code=c&code=d&state=s',
    'http://127.0.0.1:3080/oauth/callback?code=&state=s',
  ])('rejects %s', (pasted) => {
    expect(remoteCallbackPath(pasted)).toBeUndefined()
  })

  it('delivers the callback same-origin and reports whether the Host accepted it', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce({ type: 'opaqueredirect', status: 0 } as Response)
      .mockResolvedValueOnce({ type: 'basic', status: 204 } as Response)
      .mockResolvedValueOnce({ type: 'basic', status: 400 } as Response)
    expect(await deliverRemoteCallback('/oauth/callback?code=c&state=s', fetcher)).toBe(true)
    expect(await deliverRemoteCallback('/oauth/callback?code=c&state=s', fetcher)).toBe(true)
    expect(await deliverRemoteCallback('/oauth/callback?code=c&state=s', fetcher)).toBe(false)
    expect(fetcher).toHaveBeenCalledWith('/oauth/callback?code=c&state=s',
      { credentials: 'same-origin', redirect: 'manual', cache: 'no-store' })
  })
})
