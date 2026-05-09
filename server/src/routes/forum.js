const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const { applyContentFilter } = require('../middleware/contentFilter')
const { forumLimiter, commentLimiter } = require('../middleware/rateLimiter')
const supabase = require('../lib/supabase')

// POST /api/forum/posts
router.post(
  '/posts',
  authenticate,
  forumLimiter,
  applyContentFilter(['title', 'body']),
  async (req, res) => {
    const { idea_id, title, body } = req.body

    if (!idea_id || !title?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'idea_id, title, and body are required' })
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .insert({ idea_id, title: title.trim(), body: body.trim(), user_id: req.user.id })
      .select('id, idea_id, title, body, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  }
)

// PATCH /api/forum/posts/:postId
router.patch(
  '/posts/:postId',
  authenticate,
  applyContentFilter(['title', 'body']),
  async (req, res) => {
    const { postId } = req.params

    const { data: existing } = await supabase
      .from('forum_posts')
      .select('user_id')
      .eq('id', postId)
      .maybeSingle()

    if (!existing) return res.status(404).json({ error: 'Post not found' })
    if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

    const updates = {}
    if (req.body.title?.trim()) updates.title = req.body.title.trim()
    if (req.body.body?.trim())  updates.body  = req.body.body.trim()

    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid fields provided' })
    }

    const { data, error } = await supabase
      .from('forum_posts')
      .update(updates)
      .eq('id', postId)
      .select('id, title, body, updated_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  }
)

// DELETE /api/forum/posts/:postId
router.delete('/posts/:postId', authenticate, async (req, res) => {
  const { postId } = req.params

  const { data: existing } = await supabase
    .from('forum_posts')
    .select('user_id')
    .eq('id', postId)
    .maybeSingle()

  if (!existing) return res.status(404).json({ error: 'Post not found' })
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase.from('forum_posts').delete().eq('id', postId)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

// POST /api/forum/posts/:postId/comments
router.post(
  '/posts/:postId/comments',
  authenticate,
  commentLimiter,
  applyContentFilter(['body']),
  async (req, res) => {
    const { postId } = req.params
    const { body } = req.body

    if (!body?.trim()) return res.status(400).json({ error: 'Body is required' })

    const { data: post } = await supabase
      .from('forum_posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle()

    if (!post) return res.status(404).json({ error: 'Post not found' })

    const { data, error } = await supabase
      .from('forum_comments')
      .insert({ post_id: postId, body: body.trim(), user_id: req.user.id })
      .select('id, post_id, body, created_at')
      .single()

    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  }
)

// DELETE /api/forum/comments/:commentId
router.delete('/comments/:commentId', authenticate, async (req, res) => {
  const { commentId } = req.params

  const { data: existing } = await supabase
    .from('forum_comments')
    .select('user_id')
    .eq('id', commentId)
    .maybeSingle()

  if (!existing) return res.status(404).json({ error: 'Comment not found' })
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })

  const { error } = await supabase.from('forum_comments').delete().eq('id', commentId)
  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

module.exports = router
