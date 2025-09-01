// src/components/EventSection.tsx
export default function EventSection() {
  return (
    <section
      id="details"
      className="service-area service-area2 py-[50px] sm:py-[100px] scroll-mt-[40px]"
    >
      <div className="container">
        {/* Title */}
        <div className="col-12">
          <div className="section-title text-center">
            <h2
              className="
                relative mb-[30px] xl:mb-[50px]
                text-[50px] text-[#9f7964]
                xl:before:absolute xl:before:content-[''] 
                xl:before:bg-[url('/divider.png')] xl:before:bg-no-repeat xl:before:bg-center xl:before:bg-cover
                xl:before:w-[18%] xl:before:h-[89%] xl:before:-bottom-[20px] xl:before:left-[41%]
              "
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              When &amp; Where
            </h2>
          </div>
        </div>

        {/* Card / wrap */}
        <div className="service-area-menu">
          <div className="Ceremony-wrap mt-[30px] bg-[#f4ebe2]">
            <div className="grid gap-6 p-4 lg:grid-cols-12 lg:p-6">
              {/* Image */}
              <div className="lg:col-span-5">
                <div className="ceromony-img h-[300px] relative">
                  <img
                    src="/ilderton.jpeg"
                    alt="Wedding ceremony venue"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-7">
                <div className="ceromony-content flex h-full w-full flex-col justify-center">
                  <h3 className="mb-4 text-[30px] text-[#9f7964] font-nav">
                    Wedding Celebration
                  </h3>

                  <span className="block font-medium">
                    Ilderton Community Centre @ 5:30 PM
                  </span>
                  <span className="block">
                    13168 Ilderton Rd, Ilderton, Ontario
                  </span>

                  <span className="mt-[2px] inline-flex items-center gap-1 text-[#649e93]">
                    <i
                      className="fa-solid fa-square-parking"
                      aria-hidden="true"
                    />
                    <span>Free parking available on site</span>
                  </span>

                  <p className="py-5 pr-5">
                    We're so excited to celebrate our wedding with you at the
                    Ilderton Community Centre in Ilderton, Ontario. Please come
                    dressed <strong>formal / modest</strong>. The evening will
                    include our entrance and zaffa, heartfelt speeches, Maghrib
                    prayer, dinner, first dance and cake cutting, games, and
                    dancing. We can't wait to share this special day with you!
                  </p>

                  <a
                    className="font-semibold text-[#9f7964] underline decoration-transparent transition hover:decoration-inherit"
                    href="https://www.google.com/maps/search/?api=1&query=Ilderton%20Community%20Centre%2013168%20Ilderton%20Rd%2C%20Ilderton%2C%20ON"
                    target="_blank"
                    rel="noreferrer"
                  >
                    See Location
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* /wrap */}
      </div>
    </section>
  )
}
