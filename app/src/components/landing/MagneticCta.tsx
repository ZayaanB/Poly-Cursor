"use client";

import { useCallback, useRef } from "react";

const EXTENSION_URL =
  "https://marketplace.visualstudio.com/items?itemName=poly-cursor.poly-cursor";

export function MagneticCta() {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    const strength = 0.35;
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate(0px, 0px)";
  }, []);

  return (
    <a
      ref={ref}
      href={EXTENSION_URL}
      target="_blank"
      rel="noopener noreferrer"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative inline-flex touch-manipulation items-center justify-center border-2 border-brutal-off bg-brutal-off px-7 py-4 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-brutal-charcoal transition-[transform,box-shadow] duration-150 will-change-transform hover:shadow-[4px_4px_0_0_#14F195]"
    >
      Install Poly-Cursor Extension
      <span
        className="pointer-events-none absolute -right-1 -top-1 h-2 w-2 bg-brutal-solana opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        aria-hidden
      />
    </a>
  );
}
