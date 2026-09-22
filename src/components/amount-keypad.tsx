import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "back"],
] as const;

export function AmountKeypad({
  onKey,
}: {
  onKey: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
      {ROWS.flat().map((key) => (
        <button
          key={key}
          type="button"
          data-testid={`key-${key === "." ? "dot" : key}`}
          onClick={() => onKey(key)}
          className={cn(
            "flex h-14 items-center justify-center rounded-xl bg-paper text-2xl font-medium text-ink shadow-sm transition-[transform,background-color] duration-[var(--motion-quick)] ease-[var(--ease-out)] active:scale-[0.97] active:bg-paper-muted",
          )}
          aria-label={key === "back" ? "Delete" : key === "." ? "Decimal" : key}
        >
          {key === "back" ? <Delete className="size-6" /> : key}
        </button>
      ))}
    </div>
  );
}
