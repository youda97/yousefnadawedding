export default function Footer() {
  return (
    <section
      className="
            footer-area relative z-[1]
            bg-[url('/footer.jpg')] bg-center bg-cover
            py-[100px]
          "
    >
      {/* overlay */}
      <div
        className="absolute inset-0 bg-black/50 -z-[0] pointer-events-none"
        aria-hidden="true"
      />

      <div className="container">
        <div className="footer-content mx-auto text-center">
          <div
            className="
                  content-sub relative inline-block z-[99]
                  px-[80px] py-[50px]
                  bg-[rgba(205,163,139,0.5)]
                  before:content-[''] before:absolute
                  before:-left-[8px] before:-top-[6px]
                  before:w-[103%] before:h-[105%]
                  before:border before:border-white/40
                "
          >
            <h2
              className="text-[80px] text-white"
              style={{ fontFamily: '"Great Vibes", cursive' }}
            >
              Thank You
            </h2>
            <span className="text-[30px] text-[#f4ebe2] font-nav">
              For Being With Us
            </span>
          </div>
        </div>
        <p className="mt-5 relative text-center text-sm text-white">
          Copyright © {new Date().getFullYear()}, Made with love by{' '}
          <a
            href="https://portfolio-yousefouda.vercel.app/"
            className="font-bold text-[#e4c9b8]"
          >
            Yousef Ouda
          </a>
        </p>
      </div>
    </section>
  )
}
