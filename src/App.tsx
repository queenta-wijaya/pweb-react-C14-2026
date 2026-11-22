import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import type { Application } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { findInterviewConflicts } from "./utils/conflictUtils";
import { shiftDateBackwardDays } from "./utils/ghostingUtils";
import { WarRoomPipeline } from "./components/WarRoomPipeline";
import { UndoToast } from "./components/UndoToast";

type ActiveTab = "explorer" | "pipeline" | "comparator";

interface DeletedBackup {
  app: Application;
  index: number;
}

const DEFAULT_SKILLS = ["React", "TypeScript", "CSS"];

function formatShortSchedule(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function App() {
  const [applications, setApplications] = useLocalStorage<Application[]>(
    "amm_applications",
    []
  );
  const [kaptenSkills, setKaptenSkills] = useLocalStorage<string[]>(
    "amm_kapten_skills",
    DEFAULT_SKILLS
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>("pipeline");
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  const [deletedBackup, setDeletedBackup] = useState<DeletedBackup | null>(
    null
  );
  const deleteTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (deleteTimerRef.current !== null) {
        window.clearTimeout(deleteTimerRef.current);
      }
    };
  }, []);

  const conflicts = findInterviewConflicts(applications);
  const offerCount = applications.filter(
    (app) => app.status === "OFFER"
  ).length;
  const selectedApplication =
    applications.find((app) => app.id === selectedApplicationId) ?? null;

  const handleAddApplication = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
  };

  const handleUpdateApplication = (updatedApp: Application) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === updatedApp.id ? updatedApp : app))
    );
  };

  const handleSimulateGhosting = (id: string) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              lastUpdatedAt: shiftDateBackwardDays(app.lastUpdatedAt, 15),
            }
          : app
      )
    );
  };

  const handleDeleteApplication = (id: string) => {
    const targetIndex = applications.findIndex((app) => app.id === id);
    if (targetIndex === -1) return;

    const targetApp = applications[targetIndex];
    setApplications((prev) => prev.filter((app) => app.id !== id));

    if (selectedApplicationId === id) {
      setSelectedApplicationId(null);
    }

    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current);
    }

    setDeletedBackup({ app: targetApp, index: targetIndex });
    deleteTimerRef.current = window.setTimeout(() => {
      setDeletedBackup(null);
      deleteTimerRef.current = null;
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedBackup) return;

    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }

    const { app, index } = deletedBackup;
    setApplications((prev) => {
      if (prev.some((item) => item.id === app.id)) return prev;
      const next = [...prev];
      const insertIndex = Math.min(index, next.length);
      next.splice(insertIndex, 0, app);
      return next;
    });
    setDeletedBackup(null);
  };

  const handleDismissToast = () => {
    if (deleteTimerRef.current !== null) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setDeletedBackup(null);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">AM</span>
          <div>
            <h1>Aku Mw Magang</h1>
            <span className="brand-sub">Internship Application War Room</span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Navigasi utama">
          <button
            type="button"
            className={activeTab === "explorer" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("explorer")}
          >
            Eksplorasi Lowongan
          </button>
          <button
            type="button"
            className={activeTab === "pipeline" ? "tab-btn active" : "tab-btn"}
            onClick={() => setActiveTab("pipeline")}
          >
            Pipeline Lamaran ({applications.length})
          </button>
          <button
            type="button"
            className={
              activeTab === "comparator" ? "tab-btn active" : "tab-btn"
            }
            onClick={() => setActiveTab("comparator")}
          >
            Bandingkan Offer ({offerCount})
          </button>
        </nav>

        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsManualModalOpen(true)}
        >
          <Plus size={16} />
          Catat Lamaran
        </button>
      </header>

      <main className="main-container">
        {conflicts.length > 0 && (
          <div className="conflict-banner" role="alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Jadwal Interview Bentrok: </strong>
              {conflicts.map((conflict, idx) => (
                <span key={`${conflict.first.id}-${conflict.second.id}`}>
                  {conflict.first.company} (
                  {formatShortSchedule(conflict.first.interviewDateTime ?? "")})
                  dan {conflict.second.company} (
                  {formatShortSchedule(conflict.second.interviewDateTime ?? "")}
                  ) berselisih {conflict.diffMinutes} menit (&lt; 60 menit)
                  {idx < conflicts.length - 1 ? "; " : "."}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Slot Anggota 3: <StatsDashboard applications={applications} /> */}

        {activeTab === "explorer" && (
          <section className="panel">
            <h2>Eksplorasi Lowongan &amp; Profil Skill Kapten</h2>
            <p className="muted-text">
              Slot komponen Anggota 2 (SkillProfileSidebar &amp; JobExplorer).
              Skill aktif saat ini: {kaptenSkills.join(", ")}.
            </p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setKaptenSkills((prev) => prev)}
            >
              Sinkronisasi Profil Skill ({kaptenSkills.length} skill)
            </button>
          </section>
        )}

        {activeTab === "pipeline" && (
          <WarRoomPipeline
            applications={applications}
            kaptenSkills={kaptenSkills}
            onSimulateGhosting={handleSimulateGhosting}
            onDeleteApplication={handleDeleteApplication}
            onSelectApplication={(app) => setSelectedApplicationId(app.id)}
            onOpenManualModal={() => setIsManualModalOpen(true)}
          />
        )}

        {activeTab === "comparator" && (
          <section className="panel">
            <h2>Offer Comparator</h2>
            <p className="muted-text">
              Slot komponen Anggota 3 (OfferComparator). Total offer siap
              dibandingkan: {offerCount}.
            </p>
          </section>
        )}

        {isManualModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h3>Form Tambah Lamaran Manual (Slot Anggota 2)</h3>
              <p className="muted-text">
                Anggota 2 akan mengganti modal ini dengan ManualApplicationModal
                dan memanggil handleAddApplication.
              </p>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsManualModalOpen(false)}
                >
                  Tutup
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    handleAddApplication({
                      id: crypto.randomUUID(),
                      company: "GoTo Financial",
                      role: "Frontend Engineer Intern",
                      workMode: "Hybrid",
                      status: "WISHLIST",
                      requiredSkills: ["React", "TypeScript", "CSS", "Git"],
                      lastUpdatedAt: new Date().toISOString(),
                      checklist: [],
                      activityLogs: [
                        {
                          id: crypto.randomUUID(),
                          timestamp: new Date().toISOString(),
                          message: "Disimpan ke Wishlist",
                        },
                      ],
                    });
                    setIsManualModalOpen(false);
                  }}
                >
                  Tambah Contoh Lamaran
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedApplication && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <h3>
                Detail Lamaran: {selectedApplication.role} &mdash;{" "}
                {selectedApplication.company}
              </h3>
              <p className="muted-text">
                Slot komponen Anggota 3 (ApplicationDetailModal &amp;
                InterviewPrepTimer). Status saat ini:{" "}
                <strong>{selectedApplication.status}</strong>.
              </p>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() =>
                    handleUpdateApplication({
                      ...selectedApplication,
                      lastUpdatedAt: new Date().toISOString(),
                    })
                  }
                >
                  Refresh Timestamp
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setSelectedApplicationId(null)}
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {deletedBackup && (
        <UndoToast
          company={deletedBackup.app.company}
          onUndo={handleUndoDelete}
          onDismiss={handleDismissToast}
        />
      )}
    </div>
  );
}

export default App;