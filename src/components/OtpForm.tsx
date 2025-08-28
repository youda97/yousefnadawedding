import React, { useState } from 'react'
import { Card, SectionTitle, Label, TextInput, PrimaryButton } from './FormUI'

export const OtpForm: React.FC<{
  maskedPhone: string
  onVerify: () => void
  onChangeMethod: () => void
}> = ({ maskedPhone, onVerify, onChangeMethod }) => {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit code.')
      return
    }

    setError(null)
    setVerifying(true)
    try {
      // 1) Verify code
      const v = await fetch('/api/rsvp/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // IMPORTANT for cookies
        body: JSON.stringify({ code }),
      })

      if (!v.ok) {
        if (v.status === 400) {
          const { error } = await v.json().catch(() => ({ error: 'bad_code' }))
          const msg =
            error === 'expired'
              ? 'Code expired. Request a new one.'
              : error === 'bad_code'
              ? 'Code incorrect. Try again.'
              : 'We could not verify your code.'
          setError(msg)
        } else {
          setError('Something went wrong. Please try again.')
        }
        return
      }

      // 2) Tell the parent we’re good; parent can fetch /api/rsvp/household and render the next step
      onVerify()
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <Card>
      <SectionTitle
        title="Enter your code"
        subtitle={`Sent to ${maskedPhone}`}
      />
      <form onSubmit={submit} aria-describedby="otp-error">
        <Label htmlFor="otp">6-digit code</Label>
        <TextInput
          id="otp"
          name="otp"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          placeholder="••••••"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
          }
        />
        {error && (
          <p id="otp-error" className="text-red-200 text-sm mt-2">
            {error}
          </p>
        )}
        <div className="flex items-center gap-4 mt-6">
          <PrimaryButton type="submit" disabled={verifying}>
            {verifying ? 'Verifying…' : 'Verify'}
          </PrimaryButton>
          <button
            type="button"
            onClick={onChangeMethod}
            className="text-white/80 underline"
          >
            Change method
          </button>
        </div>
      </form>
    </Card>
  )
}
