import type { Application, InterviewConflict } from "../types";

export const CONFLICT_THRESHOLD_MINUTES = 60;
const MS_PER_MINUTE = 60 * 1000;

export function findInterviewConflicts(
  applications: Application[]
): InterviewConflict[] {
  const interviews = applications.filter(
    (app) => app.status === "INTERVIEW" && Boolean(app.interviewDateTime)
  );

  const conflicts: InterviewConflict[] = [];

  for (let i = 0; i < interviews.length; i++) {
    const first = interviews[i];
    const firstTime = new Date(first.interviewDateTime ?? "").getTime();
    if (Number.isNaN(firstTime)) continue;

    for (let j = i + 1; j < interviews.length; j++) {
      const second = interviews[j];
      const secondTime = new Date(second.interviewDateTime ?? "").getTime();
      if (Number.isNaN(secondTime)) continue;

      const diffMs = Math.abs(firstTime - secondTime);
      if (diffMs < CONFLICT_THRESHOLD_MINUTES * MS_PER_MINUTE) {
        const diffMinutes = Math.round(diffMs / MS_PER_MINUTE);
        conflicts.push({ first, second, diffMinutes });
      }
    }
  }

  return conflicts;
}