import { useMemo } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock3 } from "lucide-react";
import { DateTime } from "luxon";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TimezoneCombobox } from "@/components/ui/TimezoneCombobox";
import { timezoneLabel } from "@/lib/commonTimezones";
import {
  clampToFutureDatetimeLocal,
  combineDatetimeLocal,
  formatTime12Label,
  formatTime24,
  isFutureScheduled,
  minDatetimeLocalInZone,
  parseTime24,
  scheduleValidationMessage,
  splitDatetimeLocal,
} from "@/lib/scheduledDateTime";
import { cn } from "@/lib/utils";

type SmartDateTimePickerProps = {
  value: string;
  timezone: string;
  onValueChange: (datetimeLocal: string) => void;
  onTimezoneChange: (iana: string) => void;
  idPrefix?: string;
  className?: string;
};

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTE_STEPS = Array.from({ length: 12 }, (_, i) => i * 5);

function startOfTodayInZone(timezone: string): Date {
  return DateTime.now().setZone(timezone).startOf("day").toJSDate();
}

type TimePickerPanelProps = {
  time24: string;
  onChange: (time24: string) => void;
};

function TimePickerPanel({ time24, onChange }: TimePickerPanelProps) {
  const parts = parseTime24(time24);

  const setParts = (next: Partial<typeof parts>) => {
    onChange(formatTime24({ ...parts, ...next }));
  };

  return (
    <div className="w-[280px] space-y-4 p-1">
      <div className="rounded-lg bg-[#012F6B]/5 px-3 py-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected time</p>
        <p className="text-2xl font-semibold tabular-nums text-[#012F6B]">{formatTime12Label(time24)}</p>
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
                : "border-[#012F6B]/20 bg-white text-[#012F6B] hover:bg-[#012F6B]/5",
            )}
          >
            {period}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Hour</p>
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
                  : "bg-muted/60 text-foreground hover:bg-[#012F6B]/10 hover:text-[#012F6B]",
              )}
            >
              {hour}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Minute</p>
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
                  : "bg-muted/60 text-foreground hover:bg-[#012F6B]/10 hover:text-[#012F6B]",
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

export function SmartDateTimePicker({
  value,
  timezone,
  onValueChange,
  onTimezoneChange,
  idPrefix = "schedule",
  className,
}: SmartDateTimePickerProps) {
  const { date: selectedDate, time: selectedTime } = splitDatetimeLocal(value, timezone);

  const preview = useMemo(() => {
    if (!value?.includes("T")) return null;
    const dt = DateTime.fromFormat(value, "yyyy-MM-dd'T'HH:mm", { zone: timezone });
    if (!dt.isValid) return null;
    return dt.toFormat("ccc, LLL d · h:mm a");
  }, [value, timezone]);

  const validationMessage = useMemo(
    () => (value?.includes("T") ? scheduleValidationMessage(value, timezone) : null),
    [value, timezone],
  );

  const minLocal = minDatetimeLocalInZone(timezone);
  const minDate = splitDatetimeLocal(minLocal, timezone).date ?? startOfTodayInZone(timezone);

  const commitValue = (next: string) => {
    onValueChange(clampToFutureDatetimeLocal(next, timezone));
  };

  const updateDate = (date: Date | undefined) => {
    if (!date) return;
    const next = combineDatetimeLocal(date, selectedTime || "09:00", timezone);
    commitValue(next);
  };

  const updateTime = (time: string) => {
    const base = selectedDate ?? minDate;
    commitValue(combineDatetimeLocal(base, time, timezone));
  };

  const handleTimezoneChange = (nextZone: string) => {
    onTimezoneChange(nextZone);
    if (value?.includes("T")) {
      const parts = parseTime24(selectedTime || "09:00");
      const dateBase = selectedDate ?? minDate;
      const rebuilt = combineDatetimeLocal(dateBase, formatTime24(parts), nextZone);
      onValueChange(clampToFutureDatetimeLocal(rebuilt, nextZone));
    }
  };

  const isValidFuture = value ? isFutureScheduled(value, timezone) : false;

  return (
    <div
      className={cn(
        "rounded-xl border border-[#012F6B]/15 bg-gradient-to-br from-[#012F6B]/[0.04] to-transparent p-4 space-y-4",
        className,
      )}
    >
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-tz`} className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Time zone
        </Label>
        <TimezoneCombobox
          id={`${idPrefix}-tz`}
          value={timezone}
          onChange={handleTimezoneChange}
          placeholder="Search Kigali, Nairobi, London…"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full justify-start gap-2 h-11 font-normal border-[#012F6B]/20 hover:bg-[#012F6B]/5",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="h-4 w-4 shrink-0 text-[#012F6B]" />
                {selectedDate ? format(selectedDate, "EEE, MMM d, yyyy") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={updateDate}
                disabled={(date) => {
                  const day = DateTime.fromJSDate(date).startOf("day");
                  const minDay = DateTime.fromJSDate(minDate).startOf("day");
                  return day < minDay;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Time</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 justify-start gap-2 font-normal border-[#012F6B]/20 hover:bg-[#012F6B]/5 tabular-nums"
              >
                <Clock3 className="h-4 w-4 shrink-0 text-[#012F6B]" />
                {formatTime12Label(selectedTime || "09:00")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <TimePickerPanel time24={selectedTime || "09:00"} onChange={updateTime} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {preview && (
        <p className={cn("text-sm font-medium", isValidFuture ? "text-[#012F6B]" : "text-amber-700")}>
          {preview}
          <span className="ml-1 font-normal text-muted-foreground">· {timezoneLabel(timezone)}</span>
        </p>
      )}

      {validationMessage && (
        <p className="text-xs font-medium text-amber-700">{validationMessage}</p>
      )}
    </div>
  );
}
