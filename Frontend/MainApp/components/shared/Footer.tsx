export const Footer = () => (
  <footer className="px-4 md:px-10 bg-black" role="contentinfo">
    {/* Top section */}
    <div className="flex flex-col lg:flex-row justify-between gap-8 pt-10 text-white w-full min-h-[250px] border-b border-gray-500">
      <h1 className="font-semibold text-3xl md:text-4xl">SIGILLUM</h1>

      <nav className="flex flex-col sm:flex-row gap-10 sm:gap-20">
        {/* Company */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-sm uppercase">Company</h2>
          <ul className="flex flex-col gap-1">
            <li>
              <a
                href="#"
                className="text-stone-500 text-xs hover:text-white transition-colors"
              >
                Careers
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-stone-500 text-xs hover:text-white transition-colors"
              >
                Help Center
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-stone-500 text-xs hover:text-white transition-colors"
              >
                Subscribe
              </a>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-3">
          <h2 className="font-semibold text-sm uppercase">Contact</h2>
          <ul className="flex flex-col gap-1">
            <li>
              <a
                href="#"
                className="text-stone-500 text-xs hover:text-white transition-colors"
              >
                X
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-stone-500 text-xs hover:text-white transition-colors"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>

    {/* Bottom section */}
    <div className="flex flex-col md:flex-row justify-between items-center py-6 md:py-10 text-white w-full text-xs gap-4">
      <div className="text-center md:text-left">© 2025 SIGILLUM</div>
      <nav className="flex gap-4">
        <a href="#" className="hover:text-stone-300 transition-colors">
          Privacy Policy
        </a>
        <a href="#" className="hover:text-stone-300 transition-colors">
          Terms of Service
        </a>
      </nav>
    </div>
  </footer>
);
