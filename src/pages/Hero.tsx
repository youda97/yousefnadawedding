export default function Hero() {
  return (
    <>
      <section
        className="relative h-[80svh] lg:h-[100svh] w-full"
        aria-label="Hero"
        id="home"
      >
        <div
          className="
          absolute inset-0 bg-no-repeat
          bg-[66%_35%]                 
          [background-size:auto_100%]
          md:bg-cover md:bg-center
          lg:bg-fixed
        "
          style={{ backgroundImage: "url('/hero.jpeg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 flex h-full items-center justify-center">
          <div className="slider-content sd-default-content mt-6 lg:mt-0">
            <div className="col-lg-12 text-center text-white">
              <span className="font-nav uppercase text-2xl opacity-90">
                WE’RE GETTING MARRIED
              </span>
              <h4 className="mt-4 md:mt-6 font-logo text-7xl [text-shadow:1px_3px_2px_rgba(0,0,0,0.6)]">
                Save Our Date
              </h4>
              <p className="mt-1 md:mt-3 font-nav text-3xl opacity-95">
                11 October 2025
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
