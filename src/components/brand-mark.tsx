import { cn } from "@/lib/utils";

const MARK_PATHS = [
  "M62.6667 31H37.3333C33.8355 31 31 33.8355 31 37.3333V62.6667",
  "M62.6667 145H37.3333C33.8355 145 31 142.165 31 138.667V113.333",
  "M113.333 145H138.667C142.164 145 145 142.165 145 138.667V113.333",
  "M113.333 31H138.667C142.164 31 145 33.8355 145 37.3333V62.6667",
  "M88 62.6667V113.333",
  "M113.333 62.6667V113.333",
  "M62.6667 62.6667V113.333",
];

export function BrandMark({
  className,
  variant = "mark",
}: {
  className?: string;
  variant?: "mark" | "badge";
}) {
  const stroke = variant === "badge" ? "#111111" : "currentColor";
  return (
    <svg
      viewBox="0 0 177 177"
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden
    >
      {variant === "badge" ? (
        <rect width="177" height="177" rx="40" fill="#C7E941" />
      ) : null}
      {MARK_PATHS.map((d) => (
        <path
          key={d}
          d={d}
          stroke={stroke}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export function MerchantAvatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (
    (parts[0]?.[0] ?? "U") + (parts.length > 1 ? parts[1]?.[0] ?? "" : parts[0]?.[1] ?? "")
  ).toUpperCase();

  return (
    <div
      aria-hidden
      className="flex size-16 shrink-0 items-center justify-center rounded-full bg-ink text-lg font-semibold tracking-wide text-lime"
    >
      {letters}
    </div>
  );
}
