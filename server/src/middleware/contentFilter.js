const { filterText } = require('../services/contentFilter')

/**
 * Returns middleware that runs filterText against the named request body fields.
 * Usage: applyContentFilter(['title', 'description'])
 */
function applyContentFilter(fields) {
  return (req, res, next) => {
    for (const field of fields) {
      const value = req.body[field]
      if (!value) continue

      const { blocked, reason } = filterText(String(value))
      if (blocked) {
        return res.status(422).json({
          error: `Your ${field} contains ${
            reason === 'profanity' ? 'inappropriate language' : 'disallowed content'
          }. Please revise and try again.`,
          field,
        })
      }
    }
    next()
  }
}

module.exports = { applyContentFilter }
