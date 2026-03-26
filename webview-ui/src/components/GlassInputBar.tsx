import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useState,
} from "react";

export interface GlassInputBarProps {
  disabled?: boolean;
  placeholder?: string;
  onSubmit: (text: string) => void;
}

export function GlassInputBar({
  disabled = false,
  placeholder = "Ask Poly-Cursor…",
  onSubmit,
}: GlassInputBarProps): JSX.Element {
  const [value, setValue] = useState("");

  const submit = useCallback(() => {
    const t = value.trim();
    if (!t || disabled) return;
    onSubmit(t);
    setValue("");
  }, [disabled, onSubmit, value]);

  const onFormSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={onFormSubmit}
      className="border-t border-cursor-border/80 bg-cursor-bg/60 px-3 py-3 backdrop-blur-glass"
    >
      <div
        className="group relative rounded-xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-[box-shadow,border-color] duration-200 focus-within:border-solana-green/50 focus-within:shadow-glass-focus"
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={2}
          placeholder={placeholder}
          className="min-h-[44px] w-full resize-none bg-transparent px-3 py-2.5 text-[13px] leading-relaxed text-cursor-bright placeholder:text-cursor-muted/80 outline-none"
        />
        <div className="flex items-center justify-end gap-2 border-t border-white/5 px-2 py-1.5">
          <span className="text-[10px] text-cursor-muted/70">
            Enter send · Shift+Enter newline
          </span>
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="rounded-lg bg-solana-green/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-solana-green transition hover:bg-solana-green/25 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </form>
  );
}
