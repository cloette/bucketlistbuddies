// Strips prompt-injection patterns from DM content.
// DMs are personal, so we don't run bad-words here — only remove
// patterns that could manipulate AI moderation pipelines if added later.
const INJECTION_PATTERNS = [
  /ignore\s+(?:previous|all|the\s+above)\s+instructions?/gi,
  /(?:you\s+are|act\s+as|pretend\s+(?:to\s+be|you\s+are))\s+(?:a|an|the)\s+\w+/gi,
  /(?:system|assistant|user)\s*:\s*\n/gi,
  /\[(?:INST|\/INST|SYS|\/SYS)\]/gi,
  /<\/?(?:system|assistant|user)>/gi,
]

module.exports = function sanitizePrompt(req, res, next) {
  if (typeof req.body?.content === 'string') {
    let content = req.body.content
    for (const pattern of INJECTION_PATTERNS) {
      content = content.replace(pattern, '[removed]')
    }
    req.sanitizedContent = content.trim()
  }
  next()
}
