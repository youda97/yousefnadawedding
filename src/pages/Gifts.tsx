// src/components/GiftSection.tsx
export default function GiftSection() {
  return (
    <section id="gifts" className="Gift-area pt-[50px] pb-[30px] bg-[#f4ebe2]">
      <div className="container">
        <div className="col-12">
          <div className="section-title text-center">
            <h2
              className="
                  relative mb-[24px] xl:mb-[50px]
                  text-[50px] text-[#9f7964]
                  xl:before:absolute xl:before:content-['']
                  xl:before:bg-[url('/divider.png')] xl:before:bg-no-repeat xl:before:bg-center xl:before:bg-cover
                  xl:before:w-[18%] xl:before:h-[89%] xl:before:-bottom-[26px] xl:before:left-[41%]
                "
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              Gift Registry
            </h2>

            <p className="mx-auto max-w-[630px] text-gray-500">
              Your presence and duas are the greatest gift. If you wish to
              honour us with a gift, we kindly ask for{' '}
              <strong>gift envelopes</strong>. Please, no boxed or large items.
              Thank you for celebrating with us.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
