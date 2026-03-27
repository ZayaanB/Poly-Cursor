"use client";

const cards = [
  {
    id: "anchor",
    title: "Agentic Anchor Smart Contracts",
    body:
      "Generate, audit, and ship Anchor programs with agent loops that understand PDAs, constraints, and Solana’s failure modes — not boilerplate slop.",
    span: "md:col-span-7 md:row-span-2 md:row-start-1",
  },
  {
    id: "rag",
    title: "Polymarket RAG Engine",
    body:
      "Retrieval tuned for prediction markets: rules, oracles, settlement paths, and messy real-world prompts.",
    span: "md:col-span-5 md:row-span-1 md:col-start-8 md:row-start-1",
  },
  {
    id: "wallet",
    title: "One-Click Wallet Integration",
    body:
      "Wallet adapter wired for devnet and mainnet. Connect, sign, and iterate without leaving the editor flow.",
    span: "md:col-span-5 md:row-span-1 md:col-start-8 md:row-start-2",
  },
] as const;

export function BentoFeatures() {
  return (
    <section
      className="border-t border-white/10 bg-brutal-charcoal px-4 py-20 md:px-10 md:py-28"
      aria-labelledby="bento-heading"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="bento-heading"
          className="font-mono text-[11px] font-semibold uppercase tracking-[0.35em] text-brutal-off/50"
        >
          Capabilities
        </h2>
        <p className="mt-4 max-w-xl font-mono text-2xl font-semibold leading-tight tracking-tight text-brutal-off md:text-3xl">
          Three rails. One brutal grid.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-12 md:grid-rows-2 md:gap-4 md:[grid-template-rows:minmax(0,1fr)_minmax(0,1fr)]">
          {cards.map((c) => (
            <article
              key={c.id}
              className={`bento-card group relative flex min-h-[10rem] flex-col overflow-hidden border border-white/12 bg-[#161616] p-5 md:min-h-0 md:p-6 ${c.span}`}
            >
              <div
                className="bento-noise pointer-events-none absolute inset-0 z-[1]"
                aria-hidden
              />
              <div className="relative z-[2] flex h-full flex-col justify-between gap-6">
                <div>
                  <h3 className="font-mono text-lg font-semibold leading-snug tracking-tight text-brutal-off md:text-xl">
                    {c.title}
                  </h3>
                  <p className="mt-3 font-mono text-sm leading-relaxed text-brutal-off/55 md:text-[15px]">
                    {c.body}
                  </p>
                </div>
                <div className="flex items-end justify-between border-t border-white/10 pt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-brutal-off/35">
                  <span>{c.id}</span>
                  <span className="text-brutal-solana/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    →
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
