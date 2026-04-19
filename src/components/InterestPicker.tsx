import { useState, KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterestPickerProps {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  suggestions?: string[];
}

export function InterestPicker({
  value,
  onChange,
  max = 5,
  suggestions = ["music", "gaming", "art", "movies", "tech", "travel", "fitness", "memes"],
}: InterestPickerProps) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const v = raw.trim().toLowerCase();
    if (!v) return;
    if (value.includes(v)) return;
    if (value.length >= max) return;
    onChange([...value, v]);
    setDraft("");
  };

  const remove = (v: string) => onChange(value.filter((x) => x !== v));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-2.5 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/30 transition">
        {value.map((tag) => (
          <span
            key={tag}
            className="group inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary border border-primary/30"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="opacity-70 transition hover:opacity-100"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder={value.length >= max ? "Max reached" : "Add an interest…"}
          disabled={value.length >= max}
          className="flex-1 min-w-[140px] bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions
          .filter((s) => !value.includes(s))
          .slice(0, 8)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              disabled={value.length >= max}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs text-muted-foreground transition",
                "hover:border-primary/40 hover:text-foreground hover:bg-secondary",
                value.length >= max && "opacity-40 cursor-not-allowed",
              )}
            >
              <Plus className="h-3 w-3" />
              {s}
            </button>
          ))}
      </div>
    </div>
  );
}
