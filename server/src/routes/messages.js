const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/authenticate')
const sanitizePrompt = require('../middleware/promptSanitize')
const { dmLimiter } = require('../middleware/rateLimiter')
const supabase = require('../lib/supabase')

// GET /api/messages/conversations
// Returns one entry per unique conversation partner, newest message first.
router.get('/conversations', authenticate, async (req, res) => {
  const userId = req.user.id

  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, content, read_at, created_at')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // Deduplicate by partner — first occurrence per partner is the latest message
  const seen = new Set()
  const conversations = []
  for (const msg of data) {
    const partnerId = msg.sender_id === userId ? msg.recipient_id : msg.sender_id
    if (!seen.has(partnerId)) {
      seen.add(partnerId)
      conversations.push({
        partnerId,
        lastMessage: msg,
        unread: msg.sender_id !== userId && msg.read_at === null,
      })
    }
  }

  res.json(conversations)
})

// GET /api/messages/:partnerId
router.get('/:partnerId', authenticate, async (req, res) => {
  const userId = req.user.id
  const { partnerId } = req.params

  const { data, error } = await supabase
    .from('direct_messages')
    .select('id, sender_id, recipient_id, content, read_at, created_at')
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),` +
      `and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`
    )
    .order('created_at', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/messages
router.post('/', authenticate, dmLimiter, sanitizePrompt, async (req, res) => {
  const senderId = req.user.id
  const { recipient_id, content } = req.body

  if (!recipient_id || !content?.trim()) {
    return res.status(400).json({ error: 'recipient_id and content are required' })
  }
  if (recipient_id === senderId) {
    return res.status(400).json({ error: 'Cannot message yourself' })
  }

  // Check if the sender is blocked by the recipient (silent drop — don't reveal block)
  const { data: block } = await supabase
    .from('blocked_users')
    .select('id')
    .eq('blocker_id', recipient_id)
    .eq('blocked_id', senderId)
    .maybeSingle()

  if (block) return res.status(200).json({ dropped: true })

  const finalContent = req.sanitizedContent ?? content.trim()

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({ sender_id: senderId, recipient_id, content: finalContent })
    .select('id, sender_id, recipient_id, content, created_at')
    .single()

  if (error) return res.status(500).json({ error: error.message })

  // Push real-time notification to recipient via Socket.io
  req.app.get('io')?.to(`user:${recipient_id}`).emit('dm:new', data)

  res.status(201).json(data)
})

// PATCH /api/messages/:partnerId/read — mark all unread messages from partner as read
router.patch('/:partnerId/read', authenticate, async (req, res) => {
  const userId = req.user.id
  const { partnerId } = req.params

  const { error } = await supabase
    .from('direct_messages')
    .update({ read_at: new Date().toISOString() })
    .eq('sender_id', partnerId)
    .eq('recipient_id', userId)
    .is('read_at', null)

  if (error) return res.status(500).json({ error: error.message })

  // Notify sender that their messages were read
  req.app.get('io')?.to(`user:${partnerId}`).emit('dm:read', { by: userId })

  res.status(204).send()
})

module.exports = router
