import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { apiFetch } from '../../lib/api'

const INPUT = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-brand/40'

export default function SubmitIdeaModal({ isOpen, onClose, categories, onSubmitted }) {
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [country, setCountry]       = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  function reset() {
    setTitle(''); setDescription(''); setCategoryId(''); setCountry(''); setError('')
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await apiFetch('/api/ideas', {
      method: 'POST',
      body: JSON.stringify({
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: categoryId,
        country: country.trim() || 'anywhere',
      }),
    })

    setLoading(false)

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? 'Failed to submit idea.')
      return
    }

    const idea = await res.json()
    onSubmitted?.(idea)
    handleClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} transition className="relative z-50">
      <div className="fixed inset-0 bg-black/50 transition duration-200 ease-out data-[closed]:opacity-0" />

      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <DialogPanel
          transition
          className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-xl p-6 pb-8 sm:pb-6 transition duration-200 ease-out data-[closed]:opacity-0 data-[closed]:translate-y-4 sm:data-[closed]:translate-y-0 sm:data-[closed]:scale-95"
        >
          <button
            onClick={handleClose}
            aria-label="Close"
            className="absolute top-4 right-4 p-1 rounded-lg text-dim-grey hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <DialogTitle className="text-lg font-bold text-gray-900 mb-4 pr-6">
            Submit a new idea
          </DialogTitle>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Hike the Appalachian Trail"
                required
                maxLength={120}
                className={INPUT}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="A bit more detail about this idea…"
                maxLength={500}
                rows={3}
                className={INPUT + ' resize-none'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
                className={INPUT + ' bg-white'}
              >
                <option value="">Select a category…</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                placeholder="e.g. Japan  (leave blank for 'anywhere')"
                maxLength={60}
                className={INPUT}
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-brand text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit idea'}
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
