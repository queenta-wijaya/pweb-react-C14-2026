import { useState, type FormEvent } from "react";
import type {
  ActivityLog,
  Application,
  ApplicationStatus,
  ChecklistItem,
  WorkMode,
} from "../types";
import { shiftDateBackwardDays } from "../utils/ghostingUtils";
import {
  getAllowedNextStatuses,
  isTerminalStatus,
  validateStatusTransition,
} from "../utils/stateMachineUtils";
import { InterviewPrepTimer } from "./InterviewPrepTimer";

interface ApplicationDetailModalProps {
  application: Application;
  onClose: () => void;
  onUpdateApplication: (updated: Application) => void;
  onDeleteApplication?: (id: string) => void;
}

function createLog(message: string): ActivityLog {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    message,
  };
}

export function ApplicationDetailModal({
  application,
  onClose,
  onUpdateApplication,
  onDeleteApplication,
}: ApplicationDetailModalProps) {
  const allowedNextStatuses = getAllowedNextStatuses(application.status);

  const [targetStatus, setTargetStatus] = useState<ApplicationStatus | "">(
    allowedNextStatuses[0] ?? ""
  );
  const [cvVersion, setCvVersion] = useState<string>(
    application.cvVersion ?? ""
  );
  const [appliedDate, setAppliedDate] = useState<string>(
    application.appliedDate ?? new Date().toISOString().slice(0, 10)
  );
  const [interviewDateTime, setInterviewDateTime] = useState<string>(
    application.interviewDateTime ?? ""
  );
  const [salaryOfferInput, setSalaryOfferInput] = useState<string>(
    application.salaryOffer ? String(application.salaryOffer) : ""
  );
  const [offerWorkMode, setOfferWorkMode] = useState<WorkMode>(
    application.workMode
  );
  const [transitionError, setTransitionError] = useState<string>("");

  const [newChecklistText, setNewChecklistText] = useState<string>("");
  const [manualNote, setManualNote] = useState<string>("");

  const completedChecklistCount = application.checklist.filter(
    (item) => item.done
  ).length;
  const totalChecklistCount = application.checklist.length;
  const checklistProgressPercent =
    totalChecklistCount > 0
      ? Math.round((completedChecklistCount / totalChecklistCount) * 100)
      : 0;

  const handleConfirmTransition = (e: FormEvent) => {
    e.preventDefault();
    if (!targetStatus) {
      return;
    }

    const parsedSalary = Number(salaryOfferInput);
    const validation = validateStatusTransition(
      application.status,
      targetStatus,
      {
        cvVersion,
        appliedDate,
        interviewDateTime,
        salaryOffer: parsedSalary,
        workMode: offerWorkMode,
      }
    );

    if (!validation.valid) {
      setTransitionError(validation.error ?? "Transisi status tidak valid.");
      return;
    }

    setTransitionError("");
    const nowIso = new Date().toISOString();

    let logMessage = `Pindah status dari ${application.status} ke ${targetStatus}`;
    if (targetStatus === "APPLIED") {
      logMessage = `Lamaran dikirim (CV: ${cvVersion.trim()}, tanggal: ${appliedDate})`;
    } else if (targetStatus === "INTERVIEW") {
      logMessage = `Pindah ke INTERVIEW (jadwal: ${interviewDateTime.replace("T", " ")})`;
    } else if (targetStatus === "OFFER") {
      logMessage = `Offer diterima (${offerWorkMode}, Rp ${parsedSalary.toLocaleString("id-ID")})`;
    }

    const updatedApplication: Application = {
      ...application,
      status: targetStatus,
      workMode: targetStatus === "OFFER" ? offerWorkMode : application.workMode,
      cvVersion:
        targetStatus === "APPLIED" ? cvVersion.trim() : application.cvVersion,
      appliedDate:
        targetStatus === "APPLIED" ? appliedDate : application.appliedDate,
      interviewDateTime:
        targetStatus === "INTERVIEW"
          ? interviewDateTime
          : application.interviewDateTime,
      salaryOffer:
        targetStatus === "OFFER" ? parsedSalary : application.salaryOffer,
      lastUpdatedAt: nowIso,
      activityLogs: [createLog(logMessage), ...application.activityLogs],
    };

    onUpdateApplication(updatedApplication);

    const nextOptions = getAllowedNextStatuses(targetStatus);
    setTargetStatus(nextOptions[0] ?? "");
  };

  const handleSimulate15Days = () => {
    const shiftedDate = shiftDateBackwardDays(application.lastUpdatedAt, 15);
    onUpdateApplication({
      ...application,
      lastUpdatedAt: shiftedDate,
      activityLogs: [
        createLog("Simulasi +15 hari dijalankan pada lastUpdatedAt"),
        ...application.activityLogs,
      ],
    });
  };

  const handleAddChecklist = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = newChecklistText.trim();
    if (!trimmed) {
      return;
    }

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text: trimmed,
      done: false,
    };

    onUpdateApplication({
      ...application,
      checklist: [...application.checklist, newItem],
    });
    setNewChecklistText("");
  };

  const handleToggleChecklist = (itemId: string) => {
    const updatedChecklist = application.checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );

    onUpdateApplication({
      ...application,
      checklist: updatedChecklist,
    });
  };

  const handleDeleteChecklist = (itemId: string) => {
    const updatedChecklist = application.checklist.filter(
      (item) => item.id !== itemId
    );

    onUpdateApplication({
      ...application,
      checklist: updatedChecklist,
    });
  };

  const handleAddManualNote = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = manualNote.trim();
    if (!trimmed) {
      return;
    }

    onUpdateApplication({
      ...application,
      activityLogs: [
        createLog(`Catatan: ${trimmed}`),
        ...application.activityLogs,
      ],
    });
    setManualNote("");
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Detail Lamaran">
      <div>
        {/* Header Detail Lamaran */}
        <header>
          <div>
            <h2>
              {application.role} — {application.company}
            </h2>
            <p>
              Mode: {application.workMode} • Status:{" "}
              <strong>{application.status}</strong>
              {application.cvVersion ? ` • CV: ${application.cvVersion}` : ""}
              {application.interviewDateTime
                ? ` • Jadwal Interview: ${application.interviewDateTime.replace("T", " ")}`
                : ""}
            </p>
          </div>

          <div>
            {(application.status === "APPLIED" ||
              application.status === "SCREENING") && (
              <button type="button" onClick={handleSimulate15Days}>
                Simulasi +15 Hari
              </button>
            )}
            {onDeleteApplication && (
              <button
                type="button"
                onClick={() => {
                  onDeleteApplication(application.id);
                  onClose();
                }}
              >
                Hapus
              </button>
            )}
            <button type="button" onClick={onClose}>
              Tutup
            </button>
          </div>
        </header>

        {/* Bagian 1: Tahap Seleksi (State Machine) */}
        <section aria-label="Tahap Seleksi">
          <h3>Tahap Seleksi</h3>

          {isTerminalStatus(application.status) ? (
            <p>
              Status saat ini adalah <strong>{application.status}</strong>{" "}
              (final, tidak dapat berpindah status lagi).
            </p>
          ) : (
            <form onSubmit={handleConfirmTransition}>
              <div>
                <span>Pindahkan status ke: </span>
                {allowedNextStatuses.map((statusOption) => (
                  <button
                    key={statusOption}
                    type="button"
                    aria-pressed={targetStatus === statusOption}
                    onClick={() => {
                      setTargetStatus(statusOption);
                      setTransitionError("");
                    }}
                  >
                    {statusOption}
                  </button>
                ))}
              </div>

              {targetStatus === "APPLIED" && (
                <div>
                  <label>
                    Versi CV:{" "}
                    <input
                      type="text"
                      placeholder="Contoh: Kapten-CV-v2.pdf"
                      value={cvVersion}
                      onChange={(e) => setCvVersion(e.target.value)}
                    />
                  </label>
                  <label>
                    Tanggal Melamar:{" "}
                    <input
                      type="date"
                      value={appliedDate}
                      onChange={(e) => setAppliedDate(e.target.value)}
                    />
                  </label>
                </div>
              )}

              {targetStatus === "INTERVIEW" && (
                <div>
                  <label>
                    Jadwal Interview:{" "}
                    <input
                      type="datetime-local"
                      value={interviewDateTime}
                      onChange={(e) => setInterviewDateTime(e.target.value)}
                    />
                  </label>
                </div>
              )}

              {targetStatus === "OFFER" && (
                <div>
                  <label>
                    Uang Saku / Gaji (Rp):{" "}
                    <input
                      type="number"
                      min={1}
                      placeholder="Contoh: 5500000"
                      value={salaryOfferInput}
                      onChange={(e) => setSalaryOfferInput(e.target.value)}
                    />
                  </label>
                  <label>
                    Mode Kerja:{" "}
                    <select
                      value={offerWorkMode}
                      onChange={(e) =>
                        setOfferWorkMode(e.target.value as WorkMode)
                      }
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Onsite">Onsite</option>
                    </select>
                  </label>
                </div>
              )}

              {transitionError && <p role="alert">{transitionError}</p>}

              <button type="submit" disabled={!targetStatus}>
                Konfirmasi Pindah Status
              </button>
            </form>
          )}
        </section>

        {/* Bagian 2: Nested Checklist */}
        <section aria-label="Daftar Persiapan">
          <div>
            <h3>Daftar Persiapan</h3>
            <span>
              {completedChecklistCount} / {totalChecklistCount} selesai (
              {checklistProgressPercent}%)
            </span>
          </div>

          <progress
            value={completedChecklistCount}
            max={Math.max(totalChecklistCount, 1)}
          />

          {application.checklist.length === 0 ? (
            <p>Belum ada item checklist persiapan.</p>
          ) : (
            <ul>
              {application.checklist.map((item) => (
                <li key={item.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggleChecklist(item.id)}
                    />
                    <span>{item.text}</span>
                  </label>
                  <button
                    type="button"
                    aria-label={`Hapus ${item.text}`}
                    onClick={() => handleDeleteChecklist(item.id)}
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={handleAddChecklist}>
            <input
              type="text"
              placeholder="Tambah tugas persiapan baru..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
            />
            <button type="submit">Tambah</button>
          </form>
        </section>

        {/* Bagian 3: Interview Prep Timer */}
        <InterviewPrepTimer
          role={application.role}
          company={application.company}
        />

        {/* Bagian 4: Riwayat Aktivitas */}
        <section aria-label="Riwayat Aktivitas">
          <h3>Riwayat Aktivitas</h3>

          <form onSubmit={handleAddManualNote}>
            <input
              type="text"
              placeholder="Tulis catatan manual (misal: hasil follow-up HRD)..."
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
            />
            <button type="submit">Simpan Catatan</button>
          </form>

          {application.activityLogs.length === 0 ? (
            <p>Belum ada riwayat aktivitas.</p>
          ) : (
            <ul>
              {application.activityLogs.map((log) => (
                <li key={log.id}>
                  <small>
                    {new Date(log.timestamp).toLocaleString("id-ID")}
                  </small>{" "}
                  — <span>{log.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}