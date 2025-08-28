import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { slideVariants } from '../animation'
import { Step, Household, Guest } from '../types'
import { FindRsvpForm } from '../components/FindRsvpForm'
import { OtpForm } from '../components/OtpForm'
import { HouseholdRsvpPage } from '../components/HouseholdRsvpPage'
import { ConfirmationPage } from '../components/ConfirmationPage'
import { VerifyByLast4Form } from '../components/VerifyByLast4Form'

export default function RSVP() {
  const [step, setStep] = useState<Step>('find')
  const [direction, setDirection] = useState(1)
  const [household, setHousehold] = useState<Household | null>(null)
  const [finalGuests, setFinalGuests] = useState<Guest[] | null>(null)

  const go = (next: Step) => {
    setDirection(1)
    setStep(next)
  }
  const back = (prev: Step) => {
    setDirection(-1)
    setStep(prev)
  }

  async function handleSubmitAll(guests: Guest[]) {
    await fetch('/api/rsvp/submit', {
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
              <FindRsvpForm onCandidateFound={() => go('verifyMethod')} />
            )}

            {step === 'verifyMethod' && (
              <VerifyByLast4Form
                onBack={() => back('find')}
                onOtpSent={() => go('otp')}
              />
            )}

            {step === 'otp' && (
              <OtpForm
                // privacy: don’t reveal phone after last-4; use a generic subtitle in your OtpForm
                maskedPhone="your phone number"
                onVerify={async () => {
                  // 1) fetch verified household
                  const res = await fetch('/api/rsvp/household', {
                    credentials: 'include',
                  })
                  if (!res.ok) {
                    // session expired or similar
                    back('verifyMethod')
                    return
                  }
                  const data = await res.json()

                  // 2) adapt API payload to your UI types
                  const mapped: Household = {
                    id: data.household.id,
                    displayName: data.household.label, // map label -> displayName
                    guests: data.guests.map((g: any) => ({
                      id: g.id,
                      fullName: g.fullName,
                      // backend returns null when unanswered; your UI likes undefined
                      rsvp: g.rsvp ?? undefined,
                    })),
                  }

                  // 3) store it and go to the household step
                  setHousehold(mapped)
                  go('household')
                }}
                onChangeMethod={() => back('verifyMethod')}
              />
            )}

            {step === 'household' && household && (
              <HouseholdRsvpPage
                household={household}
                onBack={() => back('otp')}
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
