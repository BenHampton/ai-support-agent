// Neutralize untrusted user text before it crosses out of our trust boundary into a system we don't
// control — a Zendesk ticket rendered in a human agent's dashboard, a log line, another UI. We can't
// assume the downstream renderer escapes, so we make the text inert at our last controlled point:
// HTML-encode markup metacharacters, strip control characters, and cap length.
//
// This is input-encoding at the boundary. The textbook ideal is context-aware output-encoding at the
// point of render — but that renderer is the (future real) Zendesk, outside our code, so encoding here
// is the pragmatic defense. It lives ABOVE the integration (not inside zendesk.ts) so the guarantee
// survives swapping the mock for the real API.

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

const MAX_DOWNSTREAM_LENGTH = 2000

const TAB = 9
const NEWLINE = 10
const CARRIAGE_RETURN = 13
const DEL = 127

// keep printable chars + tab/newline/carriage-return; drop C0 control chars and DEL, which have no
// place in a support message and can smuggle terminal escapes / log-injection into a downstream sink
const stripControlChars = (text: string): string =>
  Array.from(text)
    .filter((ch) => {
      const code = ch.charCodeAt(0)
      if (code === TAB || code === NEWLINE || code === CARRIAGE_RETURN) return true
      return code > 31 && code !== DEL
    })
    .join('')

export const sanitizeForDownstream = (text: string): string => {
  // cap on the RAW text first so escaping (which lengthens `<` -> `&lt;`) can't be cut mid-entity
  const capped = text.slice(0, MAX_DOWNSTREAM_LENGTH)
  const noControl = stripControlChars(capped)
  return noControl.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]).trim()
}
