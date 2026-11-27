import type { Application, WorkMode } from "../types";

export interface OfferScoreWeights {
  salary: number; // default 0.5
  workMode: number; // default 0.25
  skillMatch: number; // default 0.25
}

export interface OfferEvaluation {
  applicationId: string;
  salaryOffer: number;
  normalizedSalaryScore: number; // skala 0 - 100
  workModeScore: number; // skala 0 - 100
  skillMatchScore: number; // skala 0 - 100
  weightedSalaryPart: number;
  weightedWorkModePart: number;
  weightedSkillMatchPart: number;
  totalScore: number;
}

export const DEFAULT_OFFER_WEIGHTS: OfferScoreWeights = {
  salary: 0.5,
  workMode: 0.25,
  skillMatch: 0.25,
};

export function getWorkModeScore(workMode: WorkMode): number {
  switch (workMode) {
    case "Remote":
      return 100;
    case "Hybrid":
      return 75;
    case "Onsite":
      return 50;
  }
}

export function normalizeSalaryScore(
  salaryOffer: number,
  maxSalary: number
): number {
  if (!Number.isFinite(salaryOffer) || salaryOffer <= 0 || maxSalary <= 0) {
    return 0;
  }
  const ratio = Math.min(salaryOffer / maxSalary, 1);
  return Number((ratio * 100).toFixed(1));
}

export function calculateOfferEvaluation(
  application: Application,
  skillMatchPercent: number,
  maxSalaryCompared: number,
  weights: OfferScoreWeights = DEFAULT_OFFER_WEIGHTS
): OfferEvaluation {
  const salaryOffer = application.salaryOffer ?? 0;
  const normalizedSalaryScore = normalizeSalaryScore(salaryOffer, maxSalaryCompared);
  const workModeScore = getWorkModeScore(application.workMode);
  const clampedSkillMatch = Math.max(0, Math.min(100, skillMatchPercent));

  const weightedSalaryPart = Number(
    (normalizedSalaryScore * weights.salary).toFixed(1)
  );
  const weightedWorkModePart = Number(
    (workModeScore * weights.workMode).toFixed(1)
  );
  const weightedSkillMatchPart = Number(
    (clampedSkillMatch * weights.skillMatch).toFixed(1)
  );

  const totalScore = Number(
    (weightedSalaryPart + weightedWorkModePart + weightedSkillMatchPart).toFixed(1)
  );

  return {
    applicationId: application.id,
    salaryOffer,
    normalizedSalaryScore,
    workModeScore,
    skillMatchScore: clampedSkillMatch,
    weightedSalaryPart,
    weightedWorkModePart,
    weightedSkillMatchPart,
    totalScore,
  };
}