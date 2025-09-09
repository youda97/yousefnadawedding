import { useEffect, useMemo, useRef, useState } from 'react'

import Confetti from 'react-confetti'
import { useWindowSize } from 'react-use'
import { CatBallPit } from '../components/catBallPit'

type TimeParts = {
  days: number
  hours: number
  minutes: number
  seconds: number
  completed: boolean
}

function getTimeParts(target: Date): TimeParts {
  const now = Date.now()
  const diff = +target - now
  if (diff <= 0)
    return { days: 0, hours: 0, minutes: 0, seconds: 0, completed: true }

  const sec = Math.floor(diff / 1000)
  const days = Math.floor(sec / (3600 * 24))
  const hours = Math.floor((sec % (3600 * 24)) / 3600)
  const minutes = Math.floor((sec % 3600) / 60)
  const seconds = sec % 60
  return { days, hours, minutes, seconds, completed: false }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

export default function CountdownSection() {
  // Oct 11, 2025 00:00 local
  const target = useMemo(() => new Date(2025, 9, 11, 0, 0, 0), [])
  const [time, setTime] = useState<TimeParts>(() => getTimeParts(target))
  const [needsTap, setNeedsTap] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const { width, height } = useWindowSize()
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (time.completed && audioRef.current) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay blocked → show button manually
          setIsPlaying(false)
          setNeedsTap(true)
        })
    }
  }, [time.completed])

  const handleEnded = () => setIsPlaying(false)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0 // rewind to start
      setIsPlaying(false)
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false))
    }
  }

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeParts(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  return (
    <div
      id="countdown"
      className="count-down-area count-down-area-2 count-down-area-sub scroll-mt-[75px]"
    >
      <section className="relative countdown-background py-[50px] md:py-[100px] text-white overflow-hidden">
        {time.completed && isPlaying && (
          <CatBallPit
            images={[
              '/cats/c1.jpeg',
              '/cats/c2.jpeg',
              '/cats/c3.jpeg',
              '/cats/c4.jpeg',
              '/cats/c5.jpeg',
              '/cats/c6.jpeg',
              '/cats/c7.jpeg',
              '/cats/c8.jpeg',
              '/cats/c9.jpeg',
              '/cats/c10.jpeg',
              '/cats/c11.jpeg',
              '/cats/c12.jpeg',
              '/cats/c13.jpeg',
              '/cats/c14.jpeg',
              '/cats/c15.jpeg',
              '/cats/c16.jpeg',
              '/cats/c17.jpeg',
            ]}
            gravity={0.8}
            repeatLimit={5}
          />
        )}

        <div className="container countdown-container relative z-20">
          <div className="text-center relative">
            <h2
              className="
                m-0 mb-[20px] lg:mb-[40px] flex w-full flex-col items-center justify-center
                text-[60px]
                max-[1199px]:text-[62px]
                max-[767px]:text-[50px]
                font-logo
              "
            >
              <span
                className="
                  mb-[0.6em] block
                  text-[25px]
                  max-[1199px]:text-[25px]
                  max-[767px]:text-[20px]
                  font-nav
                "
              >
                We Are Waiting For.....
              </span>
              The Big Day
            </h2>
          </div>

          <div className="wedding-date text-center relative">
            {!time.completed && (
              <div
                id="clock"
                className="
                  mx-auto mt-5 justify-items-center
                  grid grid-cols-2 gap-4
                  md:inline-flex md:flex-wrap md:justify-center md:gap-6
                "
              >
                <TimeBox value={pad2(time.days)} label="Days" />
                <TimeBox value={pad2(time.hours)} label="Hours" />
                <TimeBox value={pad2(time.minutes)} label="Mins" />
                <TimeBox value={pad2(time.seconds)} label="Secs" />
              </div>
            )}

            {time.completed && (
              <>
                {/* Confetti */}
                <div className="fixed -top-6 left-0 mt-6 flex flex-col items-center justify-center z-30 pointer-events-none">
                  <Confetti
                    width={width}
                    height={height}
                    numberOfPieces={400}
                    recycle={true}
                    gravity={0.15}
                    wind={0.01}
                  />
                </div>

                {/* Zaffa drums */}
                <audio
                  ref={audioRef}
                  src="/zaffeh.mp3"
                  preload="auto"
                  onEnded={handleEnded}
                />

                {/* Dramatic heading */}
                <div className="text-4xl md:text-6xl font-['Great_Vibes',cursive] text-gray-600 drop-shadow-lg">
                  It's the Big Day — Mabrook! 🎉
                </div>

                {/* Floating emojis */}
                <div
                  className={`bottom-0 flex gap-4 text-4xl justify-center mt-8 ${
                    isPlaying ? 'animate-bounce' : ''
                  }`}
                >
                  <span role="img" aria-label="ring">
                    💍
                  </span>
                  <span role="img" aria-label="party">
                    🥳
                  </span>
                  <span role="img" aria-label="heart">
                    ❤️
                  </span>
                </div>

                {needsTap && (
                  <button
                    onClick={togglePlay}
                    className="px-5 py-2 mt-8 bg-[#9f7964] text-white rounded-md shadow hover:opacity-80"
                  >
                    {isPlaying ? '🟥 Stop Zaffa' : '🔊 Play Zaffa'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function TimeBox({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="
        box flex items-center justify-center
        w-[115px] h-[118px]
        sm:w-[130px] sm:h-[132px]
        bg-[url('/clock-bg.png')] bg-cover bg-center bg-no-repeat border-0 pb-0
        lg:w-[176px] lg:h-[179px]
      "
      role="group"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex flex-col items-center justify-center">
        <div
          className="
            leading-none pt-[15px]
            text-[40px]
            lg:text-[54px]
          "
          style={{ fontFamily: '"Great Vibes", cursive' }}
        >
          {value}
        </div>
        <span className="mt-1 text-sm tracking-wide opacity-90">{label}</span>
      </div>
    </div>
  )
}
