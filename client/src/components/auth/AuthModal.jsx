import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { supabase } from '../../lib/supabase'

const INPUT = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand/40'

export default function AuthModal({ isOpen, onClose }) {
  const [tab, setTab]                       = useState('signin')
  const [email, setEmail]                   = useState('')
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState('')
  const [signedUp, setSignedUp]             = useState(false)

  function switchTab(t) {
    setTab(t)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (tab === 'signup') {
      if (password.length < 8) {
        return setError('Password must be at least 8 characters.')
      }
      if (password !== confirmPassword) {
        return setError('Passwords do not match.')
      }
    }

    setLoading(true)

    if (tab === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      setLoading(false)
      if (error) setError(error.message)
      else handleClose()
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      setLoading(false)
      if (error) {
        setError(error.message)
      } else if (data.session) {
        // Email confirmation disabled in Supabase — user is signed in immediately
        handleClose()
      } else {
        // Email confirmation enabled — show the check-your-email screen
        setSignedUp(true)
      }
    }
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  function handleClose() {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSignedUp(false)
    setTab('signin')
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} transition className="relative z-50">
      <div className="fixed inset-0 bg-black/50 transition duration-200 ease-out data-[closed]:opacity-0" />

      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-2xl shadow-xl p-6 pb-8 sm:pb-6 transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95"
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-dim-grey hover:text-gray-900 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          {signedUp ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-indigo-brand/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <EnvelopeIcon className="w-7 h-7 text-indigo-brand" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Check your email</h3>
              <p className="text-sm text-dim-grey mb-6">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </p>
              <button
                onClick={() => setSignedUp(false)}
                className="text-sm text-indigo-brand hover:underline"
              >
                &larr; Back
              </button>
            </div>
          ) : (
            <>
              <DialogTitle className="text-lg font-bold text-gray-900 mb-4 pr-6">
                Welcome to Bucket List Buddies
              </DialogTitle>

              {/* Sign in / Create account tabs */}
              <div className="flex border-b border-gray-200 mb-5">
                {[
                  { key: 'signin', label: 'Sign in' },
                  { key: 'signup', label: 'Create account' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => switchTab(key)}
                    className={`flex-1 pb-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                      tab === key
                        ? 'border-indigo-brand text-indigo-brand'
                        : 'border-transparent text-dim-grey hover:text-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Google OAuth */}
              <button
                onClick={handleGoogle}
                className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-dim-grey">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  autoComplete="email"
                  className={INPUT}
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  className={INPUT}
                />
                {tab === 'signup' && (
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    required
                    autoComplete="new-password"
                    className={INPUT}
                  />
                )}

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-brand text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loading
                    ? (tab === 'signin' ? 'Signing in…' : 'Creating account…')
                    : (tab === 'signin' ? 'Sign in' : 'Create account')
                  }
                </button>
              </form>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
