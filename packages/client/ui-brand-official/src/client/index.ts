/**
 * Pocroianu Harness fork: the home whale frame layer only. Upstream's official
 * sidebar mark and wordmark are DeepSeek brand assets reserved by upstream's
 * brand guidelines, so official fork builds leave the sidebar brand slots to
 * their local fallback. `Brand.tsx` keeps the components for upstream merges.
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { PixelWhale } from './home-whale/PixelWhale.tsx'

/** Required service: the UI slot registry. */
export const inject = ['slots']

/**
 * Frame the blank home with the whale decoration.
 * @param ctx - Client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.slots.inject('conversation.hero.frame', () => ctx.slots.register({
    name: 'conversation.hero.frame',
    id: 'pixel-whale',
  }, PixelWhale))
}
