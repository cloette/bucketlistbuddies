const supabase = require('../lib/supabase')

/**
 * Creates a notification row and pushes it to the recipient's socket room.
 * Silently skips if actor === recipient (no self-notifications).
 */
async function createNotification(io, { userId, type, actorId, ideaId, postId, commentId }) {
  if (userId === actorId) return

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id:    userId,
      type,
      actor_id:   actorId   ?? null,
      idea_id:    ideaId    ?? null,
      post_id:    postId    ?? null,
      comment_id: commentId ?? null,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[notification]', error.message)
    return
  }

  // Real-time push — client also receives this via Supabase Realtime,
  // but the socket event wakes the tab immediately without polling.
  io?.to(`user:${userId}`).emit('notification:new', data)
}

module.exports = { createNotification }
