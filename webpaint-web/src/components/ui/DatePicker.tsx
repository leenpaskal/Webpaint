"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

type Props = {
  id: string;
  name: string;
  /** YYYY-MM-DD string (matches the format Postgres `date` columns use). */
  defaultValue?: string;
  placeholder?: string;
  error?: boolean;
  "aria-describedby"?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date | undefined): string {
  if (!d) return "";
  // Build the YYYY-MM-DD from local fields so timezone doesn't shift it.
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromIsoDate(v: string | undefined): Date | undefined {
  if (!v) return undefined;
  // Parse as local midnight so the calendar selects the intended day.
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function formatDisplay(d: Date | undefined): string {
  if (!d) return "";
  return d.toLocaleDateString();
}

export default function DatePicker({
  id,
  name,
  defaultValue,
  placeholder,
  error,
  ...rest
}: Props) {
  const [date, setDate] = useState<Date | undefined>(fromIsoDate(defaultValue));
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const describedBy = rest["aria-describedby"];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-describedby={describedBy}
        className={`flex h-11 w-full items-center justify-between gap-3 rounded-md border bg-white px-3 text-left text-sm transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:bg-zinc-950 dark:focus:border-zinc-100 dark:focus:ring-zinc-100/10 ${
          error
            ? "border-red-400 dark:border-red-700"
            : "border-zinc-300 dark:border-zinc-700"
        }`}
      >
        <span
          className={
            date
              ? "text-zinc-900 dark:text-zinc-50"
              : "text-zinc-400 dark:text-zinc-600"
          }
        >
          {date ? formatDisplay(date) : (placeholder ?? "Pick a date")}
        </span>
        <CalendarIcon />
      </button>

      {/* The form reads from this hidden input — keeps the FormData API
          identical to a regular <input name="..."> field. */}
      <input type="hidden" name={name} value={toIsoDate(date)} />

      {open ? (
        <div
          role="dialog"
          className="absolute left-0 z-30 mt-2 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <DayPicker
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              if (d) setOpen(false);
            }}
            showOutsideDays
            weekStartsOn={1}
            captionLayout="dropdown"
            startMonth={new Date(2000, 0)}
            endMonth={new Date(new Date().getFullYear() + 5, 11)}
            footer={
              <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-2 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setDate(undefined);
                    setOpen(false);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDate(new Date());
                    setOpen(false);
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                >
                  Today
                </button>
              </div>
            }
          />
        </div>
      ) : null}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-zinc-500 dark:text-zinc-400"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
