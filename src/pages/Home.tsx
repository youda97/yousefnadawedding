import CountdownSection from './CountdownSection'
import Details from './Details'
import GiftSection from './Gifts'
import Hero from './Hero'
import RSVP from './RSVP'

export default function Home() {
  return (
    <>
      <Hero />
      <CountdownSection />
      <RSVP />
      <Details />
      <GiftSection />
    </>
  )
}
