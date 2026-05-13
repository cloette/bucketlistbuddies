import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const INPUT = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand/40 disabled:bg-gray-50 disabled:text-dim-grey'

export default function SettingsPage() {
  const { profile, updateProfile } = useAuth()

  const [displayName, setDisplayName]       = useState('')
  const [username, setUsername]             = useState('')
  const [bio, setBio]                       = useState('')
  const [allowDms, setAllowDms]             = useState(true)
  const [listVisibility, setListVisibility] = useState('private')
  const [bucketListId, setBucketListId]     = useState(null)
  const [saving, setSaving]                 = useState(false)
  const [message, setMessage]               = useState(null)

  useEffect(() => {
    if (!profile) return
    setDisplayName(profile.display_name ?? '')
    setUsername(profile.username ?? '')
    setBio(profile.bio ?? '')
    setAllowDms(profile.allow_dms ?? true)

    supabase
      .from('bucket_lists')
      .select('id, visibility')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) { setBucketListId(data.id); setListVisibility(data.visibility) }
      })
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    setMessage(null)

    const trimmedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
      return setMessage({ type: 'error', text: 'Username must be 3–30 characters (letters, numbers, underscores).' })
    }

    setSaving(true)

    const [{ error: profileError }, listResult] = await Promise.all([
      updateProfile({
        display_name: displayName.trim() || null,
        username: trimmedUsername,
        bio: bio.trim() || null,
        allow_dms: allowDms,
      }),
      bucketListId
        ? supabase.from('bucket_lists').update({ visibility: listVisibility }).eq('id', bucketListId)
        : supabase.from('bucket_lists').insert({ user_id: profile.id, visibility: listVisibility }).select('id').single(),
    ])

    // If we just created the bucket list, store its ID for future saves
    if (!bucketListId && listResult.data?.id) setBucketListId(listResult.data.id)

    setSaving(false)

    const listError = listResult.error
    if (profileError || listError) {
      if (profileError?.code === '23505') {
        setMessage({ type: 'error', text: 'That username is already taken.' })
      } else {
        setMessage({ type: 'error', text: profileError?.message || listError?.message })
      }
    } else {
      setMessage({ type: 'success', text: 'Settings saved.' })
    }
  }

  if (!profile) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Profile</h2>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={60}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="username"
                maxLength={30}
                required
                className={INPUT}
              />
              <p className="text-xs text-dim-grey mt-1">Letters, numbers, and underscores only.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="A little about you…"
                maxLength={300}
                rows={3}
                className={INPUT + ' resize-none'}
              />
            </div>
          </div>
        </section>

        {/* Privacy section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Privacy</h2>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-5 space-y-4">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-800">Public bucket list</p>
                <p className="text-xs text-dim-grey mt-0.5">Anyone can view your bucket list on your profile.</p>
              </div>
              <Toggle
                checked={listVisibility === 'public'}
                onChange={v => setListVisibility(v ? 'public' : 'private')}
              />
            </label>

            <div className="border-t border-gray-100" />

            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-800">Allow direct messages</p>
                <p className="text-xs text-dim-grey mt-0.5">Other users can send you private messages.</p>
              </div>
              <Toggle checked={allowDms} onChange={setAllowDms} />
            </label>
          </div>
        </section>

        {message && (
          <p className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-brand text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-brand ${
        checked ? 'bg-indigo-brand' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}
