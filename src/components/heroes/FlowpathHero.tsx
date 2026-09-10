import { useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import "./flowpath.css";

interface NavItem {
  label: string;
  items?: string[];
}

const NAV: NavItem[] = [
  { label: "Product", items: ["Connections", "Workflows", "Insights"] },
  { label: "Solutions", items: ["Guides", "Use cases", "API reference"] },
  { label: "About", items: ["Our story", "Open roles", "Reach us"] },
  { label: "Plans" },
];

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260703_053131_1ec3dd1c-d627-44fb-ab20-6e1fce41b0d5.mp4";

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path d="M14 2L24 14L14 26L4 14L14 2Z" fill="white" opacity="0.9" />
      <path d="M14 8L20 14L14 20L8 14L14 8Z" fill="white" opacity="0.5" />
    </svg>
  );
}

export default function FlowpathHero() {
  // Which desktop dropdown is open, by label. Hover-driven, so only ever one.
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <section className="flowpath-hero relative h-screen w-full overflow-hidden">
      {/* Background video */}
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={VIDEO_SRC}
        autoPlay
        loop
        muted
        playsInline
        // Without this the first frame is blank until enough data buffers,
        // which flashes the dark overlay against nothing on a cold load.
        preload="auto"
      />
      <div className="absolute inset-0 bg-black/10" />

      <div className="relative z-10 flex h-full flex-col">
        {/* ---------- Navigation ---------- */}
        <nav className="relative w-full px-5 py-4 sm:px-6 sm:py-5 md:px-12 lg:px-16">
          <div className="flex items-center justify-between">
            <a href="#" className="flex items-center gap-2">
              <Logo />
              <span className="text-lg font-medium tracking-tight text-white sm:text-xl">
                flowpath
              </span>
            </a>

            {/* Desktop links */}
            <div className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenMenu(item.items ? item.label : null)}
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white"
                  >
                    {item.label}
                    {item.items && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform duration-200 ${
                          openMenu === item.label ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {item.items && openMenu === item.label && (
                    // !absolute overrides the `position: relative` that
                    // .liquid-glass sets, which would otherwise drop the panel
                    // into the flow and push the nav around.
                    <div className="animate-dropdown liquid-glass !absolute top-full left-0 min-w-[160px] rounded-xl px-2 py-3 shadow-xl">
                      {item.items.map((sub) => (
                        <a
                          key={sub}
                          href="#"
                          className="block rounded-lg px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                        >
                          {sub}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop CTAs */}
            <div className="hidden items-center gap-4 md:flex">
              <a href="#" className="text-sm font-medium text-white/90 transition-colors hover:text-white">
                Log in
              </a>
              <button
                type="button"
                className="liquid-glass rounded-full px-5 py-2 text-sm font-medium text-white"
              >
                Try it free
              </button>
            </div>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
              className="relative h-6 w-6 md:hidden"
            >
              <Menu
                className={`absolute inset-0 h-6 w-6 text-white transition-all duration-300 ${
                  mobileOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100"
                }`}
              />
              <X
                className={`absolute inset-0 h-6 w-6 text-white transition-all duration-300 ${
                  mobileOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0"
                }`}
              />
            </button>
          </div>

          {/* Mobile menu */}
          <div
            className={`absolute top-full right-5 left-5 z-20 duration-400 md:hidden ${
              mobileOpen
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none -translate-y-3 opacity-0"
            }`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)", transitionProperty: "opacity, transform" }}
          >
            <div className="rounded-2xl bg-[#2C221C]/95 p-6 backdrop-blur-xl">
              {NAV.map((item) => (
                <div key={item.label} className="mb-4">
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  {item.items && (
                    <div className="mt-2 flex flex-col gap-2 pl-3">
                      {item.items.map((sub) => (
                        <a key={sub} href="#" className="text-sm text-white/70 hover:text-white">
                          {sub}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <a href="#" className="text-sm font-medium text-white/90 hover:text-white">
                  Log in
                </a>
                <button
                  type="button"
                  className="liquid-glass rounded-full px-5 py-2 text-sm font-medium text-white"
                >
                  Try it free
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ---------- Hero copy ---------- */}
        <div className="flex flex-1 items-start justify-center px-5 pt-16 sm:pt-20 md:pt-24">
          <div className="max-w-3xl text-center">
            <h1 className="text-3xl leading-[1.05] tracking-[-0.02em] text-white sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Bridge the
              <br />
              gaps. <span className="text-white/60">Ditch the</span>
              <br />
              <span className="text-white/60">grindwork.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-white/80 sm:mt-8 sm:text-base md:text-lg">
              Flowpath unifies your complete wellness tools, so your crew spends less energy
              plugging gaps and more on real progress.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8 sm:gap-4">
              <button
                type="button"
                className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-white/90 sm:px-6 sm:py-3"
              >
                Begin your journey
              </button>
              <button
                type="button"
                className="liquid-glass rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:px-6 sm:py-3"
              >
                See it live
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
