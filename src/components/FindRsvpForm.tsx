import React, { useState } from 'react'
import { Card, SectionTitle, Label, TextInput, PrimaryButton } from './FormUI'

const API = import.meta.env.VITE_API_BASE_URL || ''

export const FindRsvpForm: React.FC<{ onCandidateFound: () => void }> = ({
  onCandidateFound,
}) => {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()

    if (!trimmed || trimmed.split(/\s+/).length < 2) {
      setError('Please enter your first and last name.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch(`${API}/api/rsvp/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // keep cookies (candidate cookie)
        body: JSON.stringify({ name: trimmed }), // send trimmed
      })

      // Network / server error
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many attempts. Please wait a moment and try again.')
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      const data = await res.json()

      if (data.candidate) {
        onCandidateFound() // proceed to last-4 screen
      } else {
        setError(
          "We couldn't find a match. Try a different name or contact us."
        )
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <SectionTitle
        title="Be Our Guest"
        subtitle="Please reserve before September 20th, 2025."
      />
      <form
        onSubmit={handleSubmit}
        aria-describedby="find-help find-error"
        aria-busy={submitting}
      >
        <Label htmlFor="fullName">Your full name</Label>
        <TextInput
          id="fullName"
          name="fullName"
          placeholder="e.g., Yousef Ouda"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          inputMode="text"
        />
        <p id="find-help" className="text-white/70 text-sm mt-2">
          Try the name used on your invitation.
        </p>
        {error && (
          <p id="find-error" className="text-red-200 text-sm mt-2">
            {error}
          </p>
        )}
        <div className="flex items-center gap-4 mt-4">
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Searching…' : 'Continue'}
          </PrimaryButton>
        </div>
        <p className="text-white/80 text-sm mt-6">
          Can't find your RSVP? Please contact{' '}
          <a className="underline" href="mailto:ouda.yousef@gmail.com">
            ouda.yousef@gmail.com
          </a>
        </p>
        <p className="text-white/60 text-xs mt-2">
          For privacy, we won't show any names until you verify with a code.
        </p>
      </form>
    </Card>
  )
}
