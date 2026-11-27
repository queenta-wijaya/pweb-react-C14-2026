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
    <div
      className="modal-backdrop application-detail-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal-card application-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-detail-title"
      >
        <header className="application-detail-header">
          <div className="application-detail-heading">
            <span className="eyebrow">WAR ROOM LAMARAN</span>
            <h2 id="application-detail-title">
              {application.role} — {application.company}
            </h2>
            <div className="application-detail-meta">
              <span>{application.workMode}</span>
              <span className={`status-pill status-${application.status.toLowerCase()}`}>
                {application.status}
              </span>
              {application.cvVersion ? ` • CV: ${application.cvVersion}` : ""}
              {application.interviewDateTime && (
                <span>
                  Jadwal interview: {application.interviewDateTime.replace("T", " ")}
                </span>
              )}
            </div>
          </div>

          <div className="application-detail-actions">
            {(application.status === "APPLIED" ||
              application.status === "SCREENING") && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSimulate15Days}
              >
                Simulasi +15 Hari
              </button>
            )}
            {onDeleteApplication && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => {
                  onDeleteApplication(application.id);
                  onClose();
                }}
              >
                Hapus
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>
              Tutup
            </button>
          </div>
        </header>

        <section className="detail-section" aria-label="Tahap Seleksi">
          <div className="detail-section-heading">
            <div>
              <span className="eyebrow">STATUS</span>
              <h3>Tahap Seleksi</h3>
            </div>
            <p className="muted-text">Perpindahan mengikuti state machine lamaran.</p>
          </div>

          {isTerminalStatus(application.status) ? (
            <p className="detail-terminal-message">
              Status saat ini adalah <strong>{application.status}</strong>{" "}
              (final, tidak dapat berpindah status lagi).
            </p>
          ) : (
            <form
              className="transition-form"
              onSubmit={handleConfirmTransition}
              noValidate
            >
              <div className="transition-options">
                <span className="transition-label">Pindahkan status ke:</span>
                {allowedNextStatuses.map((statusOption) => (
                  <button
                    key={statusOption}
                    type="button"
                    className={`transition-choice${targetStatus === statusOption ? " selected" : ""}`}
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
                <div className="transition-fields">
                  <label>
                    Versi CV:{" "}
                    <input
                      type="text"
                      className="detail-input"
                      placeholder="Contoh: Kapten-CV-v2.pdf"
                      value={cvVersion}
                      onChange={(e) => setCvVersion(e.target.value)}
                    />
                  </label>
                  <label>
                    Tanggal Melamar:{" "}
                    <input
                      type="date"
                      className="detail-input"
                      value={appliedDate}
                      onChange={(e) => setAppliedDate(e.target.value)}
                    />
                  </label>
                </div>
              )}

              {targetStatus === "INTERVIEW" && (
                <div className="transition-fields">
                  <label>
                    Jadwal Interview:{" "}
                    <input
                      type="datetime-local"
                      className="detail-input"
                      value={interviewDateTime}
                      onChange={(e) => setInterviewDateTime(e.target.value)}
                    />
                  </label>
                </div>
              )}

              {targetStatus === "OFFER" && (
                <div className="transition-fields">
                  <label>
                    Uang Saku / Gaji (Rp):{" "}
                    <input
                      type="number"
                      className="detail-input"
                      min={1}
                      placeholder="Contoh: 5500000"
                      value={salaryOfferInput}
                      onChange={(e) => setSalaryOfferInput(e.target.value)}
                    />
                  </label>
                  <label>
                    Mode Kerja:{" "}
                    <select
                      className="detail-input"
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

              {transitionError && (
                <p className="form-error detail-transition-error" role="alert">
                  {transitionError}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={!targetStatus}
              >
                Konfirmasi Pindah Status
              </button>
            </form>
          )}
        </section>

        <section className="detail-section" aria-label="Daftar Persiapan">
          <div className="detail-section-heading">
            <div>
              <span className="eyebrow">PERSIAPAN</span>
              <h3>Daftar Persiapan</h3>
            </div>
            <span className="checklist-progress-label">
              {completedChecklistCount} / {totalChecklistCount} selesai (
              {checklistProgressPercent}%)
            </span>
          </div>

          <progress
            className="detail-progress"
            value={completedChecklistCount}
            max={Math.max(totalChecklistCount, 1)}
          />

          {application.checklist.length === 0 ? (
            <p>Belum ada item checklist persiapan.</p>
          ) : (
            <ul className="checklist-list">
              {application.checklist.map((item) => (
                <li className="checklist-item" key={item.id}>
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
                    className="btn-icon-subtle checklist-remove"
                    aria-label={`Hapus ${item.text}`}
                    onClick={() => handleDeleteChecklist(item.id)}
                  >
                    Hapus
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="detail-inline-form" onSubmit={handleAddChecklist}>
            <input
              className="detail-input"
              type="text"
              placeholder="Tambah tugas persiapan baru..."
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
            />
            <button type="submit" className="btn-secondary">Tambah</button>
          </form>
        </section>

        <div className="detail-section detail-timer-section">
          <InterviewPrepTimer
            role={application.role}
            company={application.company}
          />
        </div>

        <section className="detail-section" aria-label="Riwayat Aktivitas">
          <div className="detail-section-heading">
            <div>
              <span className="eyebrow">CATATAN</span>
              <h3>Riwayat Aktivitas</h3>
            </div>
          </div>

          <form className="detail-inline-form" onSubmit={handleAddManualNote}>
            <input
              className="detail-input"
              type="text"
              placeholder="Tulis catatan manual (misal: hasil follow-up HRD)..."
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
            />
            <button type="submit" className="btn-secondary">Simpan Catatan</button>
          </form>

          {application.activityLogs.length === 0 ? (
            <p>Belum ada riwayat aktivitas.</p>
          ) : (
            <ul className="activity-log-list">
              {application.activityLogs.map((log) => (
                <li className="activity-log-entry" key={log.id}>
                  <small className="activity-log-date">
                    {new Date(log.timestamp).toLocaleString("id-ID")}
                  </small>{" "}
                  — <span>{log.message}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </div>
  );
}