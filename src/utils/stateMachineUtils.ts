import type { ApplicationStatus, WorkMode } from "../types";

export interface StatusTransitionPayload {
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
  workMode?: WorkMode;
}

export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  WISHLIST: ["APPLIED", "REJECTED"],
  APPLIED: ["SCREENING", "REJECTED", "GHOSTED"],
  SCREENING: ["INTERVIEW", "REJECTED", "GHOSTED"],
  INTERVIEW: ["OFFER", "REJECTED", "GHOSTED"],
  GHOSTED: ["SCREENING"],
  OFFER: [],
  REJECTED: [],
};

export function getAllowedNextStatuses(
  currentStatus: ApplicationStatus
): ApplicationStatus[] {
  return ALLOWED_TRANSITIONS[currentStatus];
}

export function isTerminalStatus(status: ApplicationStatus): boolean {
  return status === "OFFER" || status === "REJECTED";
}

export function canTransitionStatus(
  from: ApplicationStatus,
  to: ApplicationStatus
): boolean {
  if (from === to) {
    return false;
  }
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function validateStatusTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
  payload: StatusTransitionPayload
): TransitionValidationResult {
  if (!canTransitionStatus(from, to)) {
    if (isTerminalStatus(from)) {
      return {
        valid: false,
        error: `Status ${from} bersifat final dan tidak dapat diubah lagi.`,
      };
    }
    return {
      valid: false,
      error: `Perpindahan status dari ${from} ke ${to} tidak diizinkan.`,
    };
  }

  if (to === "APPLIED") {
    if (!payload.cvVersion?.trim()) {
      return {
        valid: false,
        error: "Versi CV (cvVersion) wajib diisi sebelum pindah ke APPLIED.",
      };
    }
    if (!payload.appliedDate?.trim()) {
      return {
        valid: false,
        error: "Tanggal lamaran (appliedDate) wajib diisi sebelum pindah ke APPLIED.",
      };
    }
  }

  if (to === "INTERVIEW") {
    if (!payload.interviewDateTime?.trim()) {
      return {
        valid: false,
        error: "Jadwal interview (interviewDateTime) wajib diisi sebelum pindah ke INTERVIEW.",
      };
    }
  }

  if (to === "OFFER") {
    const salary = payload.salaryOffer ?? 0;
    if (!Number.isFinite(salary) || salary <= 0) {
      return {
        valid: false,
        error: "Nominal gaji/uang saku (salaryOffer) wajib lebih dari 0 untuk status OFFER.",
      };
    }
    if (!payload.workMode) {
      return {
        valid: false,
        error: "Mode kerja (workMode) wajib dipilih untuk status OFFER.",
      };
    }
  }

  return { valid: true };
}
