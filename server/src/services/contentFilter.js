const Filter = require('bad-words')

const filter = new Filter()

// Scam, solicitation, and self-promotion patterns blocked in public content
const SCAM_PATTERNS = [
  /\bclick\s+(?:this\s+)?link\b/i,
  /\bvisit\s+(?:my\s+)?(?:site|website|profile|page)\b/i,
  /\b(?:earn|make)\s+\$?\d+\s+(?:per\s+day|daily|a\s+week|weekly|per\s+hour)\b/i,
  /\b(?:work\s+from\s+home|passive\s+income|financial\s+freedom|get\s+rich\s+quick)\b/i,
  /\b(?:bitcoin|crypto(?:currency)?|nft)\s+(?:invest|opportunity|profit|earn)\b/i,
  /\b(?:wire\s+transfer|western\s+union|moneygram|send\s+money)\b/i,
  /\b(?:whatsapp|telegram)\s+me\b/i,
  /\b(?:dm|message|contact)\s+me\s+(?:for|to\s+(?:learn|earn|make))\b/i,
  /\bfollow\s+(?:me|my\s+(?:account|page|profile|instagram|tiktok))\b/i,
  /\b(?:promo|discount)\s+code\b/i,
]

function filterText(text) {
  try {
    if (filter.isProfane(text)) return { blocked: true, reason: 'profanity' }
  } catch {
    // bad-words can throw on unusual Unicode input; treat as clean
  }

  if (SCAM_PATTERNS.some(p => p.test(text))) {
    return { blocked: true, reason: 'scam' }
  }

  return { blocked: false }
}

module.exports = { filterText }
