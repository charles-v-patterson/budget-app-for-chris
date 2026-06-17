import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function toNumber(value: { toNumber(): number } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : value.toNumber();
}

export function parseDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid date");
  }
  return parsed;
}

export function monthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthRange(month: string): { start: Date; end: Date } {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, mon - 1, 1));
  const end = new Date(Date.UTC(year, mon, 0));
  return { start, end };
}

export function advanceDueDate(date: Date, frequency: string): Date {
  const next = new Date(date);
  switch (frequency) {
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "biweekly":
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + 1);
      break;
    case "quarterly":
      next.setUTCMonth(next.getUTCMonth() + 3);
      break;
    case "yearly":
      next.setUTCFullYear(next.getUTCFullYear() + 1);
      break;
    default:
      next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next;
}
