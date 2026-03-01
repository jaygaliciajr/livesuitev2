import { clsx } from "clsx";
import { endOfDay, endOfWeek, format, startOfDay, startOfWeek, subDays } from "date-fns";
import { DateFilter } from "@/types/domain";

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function formatCurrency(value: number, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value || 0);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
}

export function toDateInputValue(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function getDateRange(filter: DateFilter, customFrom?: string, customTo?: string) {
  const now = new Date();
  if (filter === "today") {
    return { from: startOfDay(now), to: endOfDay(now) };
  }

  if (filter === "week") {
    return {
      from: startOfWeek(now, { weekStartsOn: 1 }),
      to: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }

  const from = customFrom ? new Date(customFrom) : startOfDay(subDays(now, 6));
  const to = customTo ? endOfDay(new Date(customTo)) : endOfDay(now);
  return { from: startOfDay(from), to };
}

export function formatSeconds(seconds: number) {
  const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}
