import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { slideVariants } from '../animation'
import { Step, Household, Guest } from '../types'
import { FindRsvpForm } from '../components/FindRsvpForm'
import { OtpForm } from '../components/OtpForm'
import { HouseholdRsvpPage } from '../components/HouseholdRsvpPage'
import { ConfirmationPage } from '../components/ConfirmationPage'
import { VerifyByLast4Form } from '../components/VerifyByLast4Form'

const API = import.meta.env.VITE_API_BASE_URL || ''

export default function RSVP() {
  const [step, setStep] = useState<Step>('find')
  const [direction, setDirection] = useState(1)
  const [household, setHousehold] = useState<Household | null>(null)
  const [finalGuests, setFinalGuests] = useState<Guest[] | null>(null)
  const [skippedOtp, setSkippedOtp] = useState(false)

  const go = (next: Step) => {
    setDirection(1)
    setStep(next)
  }
  const back = (prev: Step) => {
    setDirection(-1)
    setStep(prev)
  }

  async function fetchAndSetHousehold() {
    const res = await fetch(`${API}/api/rsvp/household`, {
      credentials: 'include',
    })
    if (!res.ok) {
      back('verifyMethod')
      return false
    }
    const data = await res.json()
    const mapped: Household = {
      id: data.household.id,
      displayName: data.household.label,
      guests: data.guests.map((g: any) => ({
        id: g.id,
        fullName: g.fullName,
        rsvp: g.rsvp ?? undefined,
      })),
    }
    setHousehold(mapped)
    return true
  }

  async function handleBypass() {
    const ok = await fetchAndSetHousehold()
    if (!ok) return
    setSkippedOtp(true)
    go('household')
  }

  async function handleSubmitAll(guests: Guest[]) {
    await fetch(`${API}/api/rsvp/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        responses: guests.map((g) => ({ id: g.id, rsvp: g.rsvp })),
      }),
    })
    // advance to confirmation step here
    setFinalGuests(guests)
    go('confirmation')
  }

  return (
    <div
      id="rsvp"
      className="rsvp-background relative min-h-screen w-full bg-[url('form-background.jpeg')] bg-cover bg-fixed bg-bottom flex items-center justify-center p-4 md:p-8 scroll-mt-[20px]"
    >
      <div className="w-full max-w-3xl">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            {step === 'find' && (
              <FindRsvpForm
                onCandidateFound={() => {
                  setSkippedOtp(false)
                  go('verifyMethod')
                }}
              />
            )}

            {step === 'verifyMethod' && (
              <VerifyByLast4Form
                onBack={() => back('find')}
                onOtpSent={() => {
                  setSkippedOtp(false)
                  go('otp')
                }}
                onBypass={handleBypass}
              />
            )}

            {step === 'otp' && (
              <OtpForm
                // privacy: don't reveal phone after last-4; use a generic subtitle in your OtpForm
                maskedPhone="your phone number"
                onVerify={async () => {
                  const ok = await fetchAndSetHousehold()
                  if (!ok) return
                  setSkippedOtp(false)
                  go('household')
                }}
                onChangeMethod={() => back('verifyMethod')}
              />
            )}

            {step === 'household' && household && (
              <HouseholdRsvpPage
                household={household}
                onBack={() => back(skippedOtp ? 'verifyMethod' : 'otp')}
                onSubmitAll={handleSubmitAll}
              />
            )}

            {step === 'confirmation' && finalGuests && (
              <ConfirmationPage guests={finalGuests} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
