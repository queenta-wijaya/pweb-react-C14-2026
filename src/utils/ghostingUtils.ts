import type { Application } from "../types";

export const GHOSTING_THRESHOLD_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isRawanGhosting(application: Application): boolean {
  if (application.status !== "APPLIED" && application.status !== "SCREENING") {
    return false;
  }

  const lastUpdated = new Date(application.lastUpdatedAt).getTime();
  if (Number.isNaN(lastUpdated)) {
    return false;
  }

  return Date.now() - lastUpdated > GHOSTING_THRESHOLD_DAYS * MS_PER_DAY;
}

export function shiftDateBackwardDays(isoDate: string, days: number): string {
  const baseTime = new Date(isoDate).getTime();
  const validBase = Number.isNaN(baseTime) ? Date.now() : baseTime;
  return new Date(validBase - days * MS_PER_DAY).toISOString();
}