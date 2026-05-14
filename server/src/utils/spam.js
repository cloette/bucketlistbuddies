const supabase = require('../lib/supabase')

/**
 * Returns true if the user posted nearly identical content within the window.
 * Uses case-insensitive exact match on the content field.
 *
 * @param {object} opts
 * @param {string}  opts.table        - supabase table name
 * @param {string}  opts.userField    - column for user id (e.g. 'submitted_by', 'user_id')
 * @param {string}  opts.userId       - the submitting user's id
 * @param {string}  opts.contentField - column to compare (e.g. 'title', 'body')
 * @param {string}  opts.content      - the submitted content
 * @param {number}  opts.windowMs     - look-back window in milliseconds
 * @param {object}  [opts.extraEq]    - optional extra equality filter { column, value }
 */
async function isDuplicate({ table, userField, userId, contentField, content, windowMs, extraEq }) {
  const since = new Date(Date.now() - windowMs).toISOString()
  // Escape LIKE wildcards so we get an exact case-insensitive match
  const escaped = content.trim().replace(/%/g, '\\%').replace(/_/g, '\\_')

  let query = supabase
    .from(table)
    .select('id', { count: 'exact', head: true })
    .eq(userField, userId)
    .ilike(contentField, escaped)
    .gte('created_at', since)

  if (extraEq) {
    query = query.eq(extraEq.column, extraEq.value)
  }

  const { count } = await query
  return (count ?? 0) > 0
}

module.exports = { isDuplicate }
