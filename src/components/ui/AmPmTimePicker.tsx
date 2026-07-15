import { Clock3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatTime12Label,
  formatTime24,
  parseTime24,
  type Time12Parts,
} from "@/lib/scheduledDateTime";
import { cn } from "@/lib/utils";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => i * 5);

type AmPmTimePickerProps = {
  value: string;
  onChange: (time24: string) => void;
  id?: string;
  className?: string;
};

function TimePickerPanel({
  time24,
  onChange,
}: {
  time24: string;
  onChange: (time24: string) => void;
}) {
  const parts = parseTime24(time24);

  const setParts = (next: Partial<Time12Parts>) => {
    onChange(formatTime24({ ...parts, ...next }));
  };

  return (
    <div className="w-[280px] space-y-4 p-1">
      <div className="rounded-lg bg-[#012F6B]/5 px-3 py-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Selected time
        </p>
        <p className="text-2xl font-semibold tabular-nums text-[#012F6B]">
          {formatTime12Label(time24)}
        </p>
      </div>

      <div className="flex gap-2">
        {(["AM", "PM"] as const).map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => setParts({ period })}
            className={cn(
              "flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors",
              parts.period === period
                ? "border-[#012F6B] bg-[#012F6B] text-white"
                : "border-[#012F6B]/20 bg-white text-[#012F6B] hover:bg-[#012F6B]/5"
            )}
          >
            {period}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Hour
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {HOURS_12.map((hour) => (
            <button
              key={hour}
              type="button"
              onClick={() => setParts({ hour12: hour })}
              className={cn(
                "rounded-md py-2 text-sm font-medium tabular-nums transition-colors",
                parts.hour12 === hour
                  ? "bg-[#012F6B] text-white"
                  : "bg-muted/60 text-foreground hover:bg-[#012F6B]/10 hover:text-[#012F6B]"
              )}
            >
              {hour}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Minute
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {MINUTE_STEPS.map((minute) => (
            <button
              key={minute}
              type="button"
              onClick={() => setParts({ minute })}
              className={cn(
                "rounded-md py-2 text-sm font-medium tabular-nums transition-colors",
                parts.minute === minute
                  ? "bg-[#012F6B] text-white"
                  : "bg-muted/60 text-foreground hover:bg-[#012F6B]/10 hover:text-[#012F6B]"
              )}
            >
              {String(minute).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AmPmTimePicker({ value, onChange, id, className }: AmPmTimePickerProps) {
  const time24 = value?.length >= 5 ? value.slice(0, 5) : value || "09:00";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          className={cn(
            "h-9 w-full justify-start gap-2 font-normal tabular-nums",
            className
          )}
        >
          <Clock3 className="h-4 w-4 shrink-0 text-[#012F6B]" />
          {formatTime12Label(time24)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <TimePickerPanel time24={time24} onChange={onChange} />
      </PopoverContent>
    </Popover>
  );
}
