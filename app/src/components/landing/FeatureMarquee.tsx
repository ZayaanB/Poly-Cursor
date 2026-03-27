"use client";

const ITEMS = [
  "Orderbook DEX",
  "Esports Betting Layer",
  "NFT Tokenizer",
  "Prediction Market",
  "Perp Clearing House",
  "Liquidity Router",
  "On-Chain Registry",
  "Vault Strategies",
] as const;

function MarqueeStrip() {
  return (
    <div className="marquee-strip flex w-max shrink-0 items-center gap-10 pr-10">
      {ITEMS.map((label) => (
        <span
          key={label}
          className="whitespace-nowrap font-mono text-sm font-medium uppercase tracking-[0.2em] text-brutal-off/85 md:text-base"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

export function FeatureMarquee() {
  return (
    <section
      className="border-t border-y border-white/10 bg-[#0e0e0e] py-6 md:py-8"
      aria-label="Built with Poly-Cursor"
    >
      <div className="marquee relative overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0e0e0e] to-transparent md:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0e0e0e] to-transparent md:w-24" />
        <div className="marquee-track flex w-max">
          <MarqueeStrip />
          <MarqueeStrip />
        </div>
      </div>
      <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-brutal-off/35">
        Complex dApps shipped with Poly-Cursor
      </p>
    </section>
  );
}
