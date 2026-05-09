const supabase = require('../lib/supabase')

/**
 * Deletes a user account in the correct order so all DB triggers fire properly.
 * Cascade order matters: counts are maintained by triggers, so we must delete
 * children before parents to avoid count drift.
 */
async function deleteAccount(userId) {
  // 1. Bucket list items first — triggers ideas.add_count decrement on each row
  const { data: bl } = await supabase
    .from('bucket_lists')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (bl) {
    await supabase.from('bucket_list_items').delete().eq('bucket_list_id', bl.id)
    await supabase.from('bucket_lists').delete().eq('id', bl.id)
  }

  // 2. Saved ideas — triggers ideas.save_count decrement
  await supabase.from('saved_ideas').delete().eq('user_id', userId)

  // 3. Comments on the user's own posts — triggers forum_posts.comment_count decrement
  const { data: posts } = await supabase
    .from('forum_posts')
    .select('id')
    .eq('user_id', userId)

  for (const post of posts ?? []) {
    await supabase.from('forum_comments').delete().eq('post_id', post.id)
  }

  // 4. User's forum posts — triggers ideas.forum_count decrement
  await supabase.from('forum_posts').delete().eq('user_id', userId)

  // 5. User's comments on other posts — triggers those posts' comment_count decrement
  await supabase.from('forum_comments').delete().eq('user_id', userId)

  // 6. Direct messages and blocks
  await supabase
    .from('direct_messages')
    .delete()
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)

  await supabase
    .from('blocked_users')
    .delete()
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)

  // 7. Anonymise submitted ideas — keep them for the community
  await supabase
    .from('ideas')
    .update({ submitted_by: null })
    .eq('submitted_by', userId)

  // 8. Delete profile (any remaining FK children cascade here)
  await supabase.from('profiles').delete().eq('id', userId)

  // 9. Delete the Supabase auth user
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw new Error(`Auth deletion failed: ${error.message}`)
}

module.exports = { deleteAccount }
