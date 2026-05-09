import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-indigo-brand mb-4">404</h1>
      <p className="text-dim-grey mb-6">This page doesn't exist.</p>
      <Link
        to="/"
        className="inline-block bg-indigo-brand text-white font-semibold px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
      >
        Back to Browse
      </Link>
    </div>
  )
}
