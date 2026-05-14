const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const supabase = require('../lib/supabase')

// POST /api/flags
router.post('/', authenticate, async (req, res) => {
  const { idea_id, post_id, comment_id, target_user_id, reason } = req.body

  const targets = [idea_id, post_id, comment_id, target_user_id].filter(Boolean)
  if (targets.length !== 1) {
    return res.status(400).json({
      error: 'Exactly one of idea_id, post_id, comment_id, or target_user_id is required',
    })
  }

  const { error } = await supabase.from('flags').insert({
    reporter_id:    req.user.id,
    idea_id:        idea_id        ?? null,
    post_id:        post_id        ?? null,
    comment_id:     comment_id     ?? null,
    target_user_id: target_user_id ?? null,
    reason:         reason?.trim() || null,
  })

  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Already reported' })
    return res.status(500).json({ error: error.message })
  }

  res.status(201).json({ ok: true })
})

module.exports = router
