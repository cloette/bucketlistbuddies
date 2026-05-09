const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const { applyContentFilter } = require('../middleware/contentFilter')
const { ideaLimiter } = require('../middleware/rateLimiter')
const supabase = require('../lib/supabase')

// POST /api/ideas
router.post(
  '/',
  authenticate,
  ideaLimiter,
  applyContentFilter(['title', 'description']),
  async (req, res) => {
    const { title, description, category_id, country } = req.body

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }
    if (!category_id) {
      return res.status(400).json({ error: 'category_id is required' })
    }

    const { data, error } = await supabase
      .from('ideas')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        category_id,
        country: country?.trim() || 'anywhere',
        submitted_by: req.user.id,
      })
      .select('id, title, description, country, category_id, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  }
)

module.exports = router
