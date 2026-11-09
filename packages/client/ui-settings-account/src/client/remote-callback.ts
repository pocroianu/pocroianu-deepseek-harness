/**
 * Remote-browser completion of the DeepSeek sign-in. The platform redirects
 * only to a loopback `redirect_uri`; a browser that reaches the Web UI through
 * a reverse proxy lands on a 127.0.0.1 page that cannot load. The user pastes
 * that address and this hands its query to the Host's `/oauth/callback` route
 * through the page's own origin.
 */

const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '[::1]']

/**
 * @param location - page location to classify.
 * @returns true when the page is served over HTTPS from a non-loopback host.
 */
export function isRemoteBrowser(location: Pick<Location, 'protocol' | 'hostname'>): boolean {
  return location.protocol === 'https:' && !LOOPBACK_HOSTS.includes(location.hostname)
}

/**
 * Extract the Host callback request from a pasted loopback redirect address.
 * @param pasted - full address of the page the platform redirected to.
 * @returns the origin-relative `/oauth/callback?code=…&state=…` path, or undefined.
 */
export function remoteCallbackPath(pasted: string): string | undefined {
  let url: URL
  try { url = new URL(pasted.trim()) } catch { return undefined }
  if (url.protocol !== 'http:' || !LOOPBACK_HOSTS.includes(url.hostname) || url.pathname !== '/oauth/callback') return undefined
  const codes = url.searchParams.getAll('code')
  const states = url.searchParams.getAll('state')
  if (codes.length !== 1 || states.length !== 1 || codes[0] === '' || states[0] === '') return undefined
  return `/oauth/callback?${new URLSearchParams({ code: codes[0]!, state: states[0]! }).toString()}`
}

/**
 * Deliver the pasted callback to the Host; the account view then reports the outcome.
 * @param path - result of {@link remoteCallbackPath}.
 * @param fetcher - fetch implementation (tests inject one).
 * @returns true when the Host accepted the callback.
 */
export async function deliverRemoteCallback(path: string, fetcher: typeof fetch = fetch): Promise<boolean> {
  const response = await fetcher(path, { credentials: 'same-origin', redirect: 'manual', cache: 'no-store' })
  // Success answers with a redirect to the platform completion page (opaque under manual redirects) or 204.
  return response.type === 'opaqueredirect' || (response.status >= 200 && response.status < 400)
}
