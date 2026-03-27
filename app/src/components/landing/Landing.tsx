"use client";

import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { MagneticCta } from "./MagneticCta";

const HeroCanvas = dynamic(
  () => import("./HeroCanvas").then((m) => m.HeroCanvas),
  { ssr: false, loading: () => <HeroCanvasPlaceholder /> }
);

function HeroCanvasPlaceholder() {
  return (
    <div
      className="h-full w-full animate-pulse bg-brutal-charcoal"
      aria-hidden
    />
  );
}

export function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.4,
  });

  const [rotationSync, setRotationSync] = useState(0);
  useMotionValueEvent(smoothProgress, "change", (v) => {
    setRotationSync(v);
  });

  const headlineY = useTransform(scrollYProgress, [0, 0.35], ["0%", "-8%"]);
  const headlineOpacity = useTransform(scrollYProgress, [0.2, 0.45], [1, 0]);

  return (
    <div ref={containerRef} className="relative min-h-[220vh]">
      <section className="sticky top-0 h-screen w-full overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 z-0">
          <HeroCanvas scrollProgress={rotationSync} />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-brutal-charcoal/20 via-transparent to-brutal-charcoal" />

        <div className="relative z-20 flex h-full flex-col justify-between px-4 pb-10 pt-8 md:px-10 md:pb-14 md:pt-12">
          <header className="pointer-events-auto flex items-start justify-between gap-6">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.35em] text-brutal-off/55">
              Poly-Cursor / v0
            </p>
            <p className="max-w-[14rem] text-right font-mono text-[10px] leading-relaxed text-brutal-off/45">
              Not a template. Not a moodboard. A tool.
            </p>
          </header>

          <motion.div
            style={{ y: headlineY, opacity: headlineOpacity }}
            className="pointer-events-none max-w-[min(100%,52rem)]"
          >
            <h1 className="font-mono text-[clamp(2.75rem,12vw,7.5rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-brutal-off">
              BUILD
              <br />
              ON SOLANA
              <br />
              <span className="text-brutal-solana">WITHOUT</span>
              <br />
              THE SLOP
            </h1>
            <p className="mt-8 max-w-xl font-mono text-sm leading-relaxed text-brutal-off/60 md:text-base">
              Agentic IDE. Anchor programs. Markets. No glassmorphism cult. No
              fake depth. Just sharp type, metal, and code.
            </p>
          </motion.div>

          <div className="pointer-events-auto flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="font-mono text-[11px] uppercase tracking-widest text-brutal-off/40">
              Scroll → torque the solid
            </div>
            <div className="sticky bottom-4 z-30 self-start md:self-end">
              <MagneticCta />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-brutal-charcoal px-4 py-24 md:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-mono text-3xl font-semibold uppercase tracking-tight text-brutal-off md:text-4xl">
            What is Poly-Cursor?
          </h2>
          <p className="mt-8 font-mono text-sm leading-[1.75] text-brutal-off/65 md:text-base">
            A Cursor-side extension and web toolchain for Solana: prediction
            markets, token programs, and a UI that refuses to look like every
            other “AI SaaS” landing page. Charcoal. Off-white. One green strike
            when it matters.
          </p>
          <div className="mt-12 h-px w-full bg-brutal-solana/80" />
          <p className="mt-8 font-mono text-xs uppercase tracking-[0.25em] text-brutal-off/45">
            Extension · Webview · Anchor · Next.js
          </p>
        </div>
      </section>
    </div>
  );
}
