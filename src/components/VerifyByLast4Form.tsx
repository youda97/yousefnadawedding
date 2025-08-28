import React, { useState } from 'react'
import { Card, SectionTitle, Label, TextInput, PrimaryButton } from './FormUI'

const API = import.meta.env.VITE_API_BASE_URL || ''

export const VerifyByLast4Form: React.FC<{
  onBack: () => void
  onOtpSent: () => void // advance to OTP screen if API says sent
}> = ({ onBack, onOtpSent }) => {
  const [last4, setLast4] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{4}$/.test(last4)) {
      setError('Enter the last 4 digits.')
      return
    }
    setError(null)
    setSending(true)

    // Server matches against candidate set from search (kept server-side in session).
    // If unique match found → send OTP (no phone revealed), return 204.
    // If not unique or not found → return 400 with a generic message.
    try {
      const res = await fetch(`${API}/api/rsvp/otp/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ last4 }),
      })
      if (res.ok) onOtpSent()
      else if (res.status === 429)
        setError('Please wait a bit before requesting another code.')
      else setError("We couldn't verify those digits. Try again or contact us.")
    } catch {
      setError("We couldn't verify those digits. Try again or contact us.")
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <SectionTitle
        title="Verify it's you"
        subtitle="Enter the last 4 digits of your phone number"
      />
      <form onSubmit={submit}>
        <Label htmlFor="last4">Last 4 digits</Label>
        <TextInput
          id="last4"
          inputMode="numeric"
          maxLength={4}
          value={last4}
          onChange={(e) =>
            setLast4(e.target.value.replace(/\\D/g, '').slice(0, 4))
          }
          placeholder="••••"
        />
        {error && <p className="text-red-200 text-sm mt-2">{error}</p>}
        <div className="flex items-center gap-4 mt-6">
          <PrimaryButton type="submit" disabled={sending}>
            {sending ? 'Sending…' : 'Send code'}
          </PrimaryButton>
          <button
            type="button"
            onClick={onBack}
            className="text-white/80 underline"
          >
            Use a different spelling
          </button>
        </div>
        <p className="text-white/60 text-xs mt-3">
          For privacy, we'll only text a code if these digits match the number
          on your invitation.
        </p>
      </form>
    </Card>
  )
}
