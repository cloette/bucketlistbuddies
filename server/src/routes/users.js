const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const { deleteAccount } = require('../services/gdprService')
const supabase = require('../lib/supabase')

// PATCH /api/users/me
router.patch('/me', authenticate, async (req, res) => {
  const { username, display_name, bio, avatar_url } = req.body
  const updates = {}

  if (username !== undefined) {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (clean.length < 3 || clean.length > 30) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters (letters, numbers, underscores only)',
      })
    }
    updates.username = clean
  }

  if (display_name !== undefined) updates.display_name = display_name.trim().slice(0, 50)
  if (bio          !== undefined) updates.bio          = bio.trim().slice(0, 300)
  if (avatar_url   !== undefined) updates.avatar_url   = avatar_url

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'No valid fields provided' })
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select('id, username, display_name, bio, avatar_url')
    .single()

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'That username is already taken' })
    }
    return res.status(500).json({ error: error.message })
  }

  res.json(data)
})

// POST /api/users/me/block/:targetId
router.post('/me/block/:targetId', authenticate, async (req, res) => {
  const { targetId } = req.params

  if (targetId === req.user.id) {
    return res.status(400).json({ error: 'Cannot block yourself' })
  }

  const { error } = await supabase
    .from('blocked_users')
    .insert({ blocker_id: req.user.id, blocked_id: targetId })

  // Ignore duplicate block (23505 = unique violation)
  if (error && error.code !== '23505') {
    return res.status(500).json({ error: error.message })
  }

  res.status(204).send()
})

// DELETE /api/users/me/block/:targetId
router.delete('/me/block/:targetId', authenticate, async (req, res) => {
  const { targetId } = req.params

  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', req.user.id)
    .eq('blocked_id', targetId)

  if (error) return res.status(500).json({ error: error.message })
  res.status(204).send()
})

// DELETE /api/users/me — GDPR account deletion
router.delete('/me', authenticate, async (req, res) => {
  try {
    await deleteAccount(req.user.id)
    res.status(204).send()
  } catch (err) {
    console.error('[gdpr]', err.message)
    res.status(500).json({ error: 'Account deletion failed. Please contact support.' })
  }
})

module.exports = router
