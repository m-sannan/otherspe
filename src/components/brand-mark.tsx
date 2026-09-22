import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 72 72"
      className={cn(className)}
      fill="none"
      aria-hidden
    >
      <rect
        x="6"
        y="6"
        width="60"
        height="60"
        rx="16"
        stroke="currentColor"
        strokeWidth="6"
      />
      <rect x="18" y="18" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="40" y="18" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="18" y="40" width="14" height="14" rx="3" fill="currentColor" />
      <rect x="40" y="40" width="6" height="16" rx="2" fill="currentColor" />
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
      className="flex size-16 items-center justify-center rounded-full bg-ink text-lg font-semibold tracking-wide text-lime"
    >
      {letters}
    </div>
  );
}
