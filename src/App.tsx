import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import type { Application } from "./types";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { findInterviewConflicts } from "./utils/conflictUtils";
import { shiftDateBackwardDays } from "./utils/ghostingUtils";
import { WarRoomPipeline } from "./components/WarRoomPipeline";
import { UndoToast } from "./components/UndoToast";
import { JobExplorer } from "./components/JobExplorer";
import { SkillProfileSidebar } from "./components/SkillProfileSidebar";
import { ManualApplicationModal } from "./components/ManualApplicationModal";
import { hasDuplicateApplication } from "./utils/skillMatchUtils";
import type { JobListing, WorkMode } from "./types";
import type { JobDataSource } from "./services/jobService";

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
  const [jobSource, setJobSource] = useState<JobDataSource>("live");
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

  const handleAddApplication = (newApp: Application): boolean => {
    if (hasDuplicateApplication(applications, newApp.company, newApp.role)) {
      return false;
    }
    setApplications((prev) => [newApp, ...prev]);
    return true;
  };

  const handleSaveJob = (job: JobListing) => {
    const now = new Date().toISOString();
    const location = job.candidate_required_location.toLocaleLowerCase();
    const workMode: WorkMode = location.includes("remote")
      ? "Remote"
      : location.includes("hybrid")
        ? "Hybrid"
        : "Onsite";
    handleAddApplication({
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode,
      status: "WISHLIST",
      requiredSkills: [...job.tags],
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [{
        id: crypto.randomUUID(),
        timestamp: now,
        message: "Disimpan ke Wishlist dari Eksplorasi Lowongan.",
      }],
    });
  };

  const handleAddSkill = (skill: string): boolean => {
    if (kaptenSkills.some((item) => item.trim().toLocaleLowerCase() === skill.trim().toLocaleLowerCase())) {
      return false;
    }
    setKaptenSkills((prev) => [...prev, skill.trim()]);
    return true;
  };

  const handleRemoveSkill = (skill: string) => {
    setKaptenSkills((prev) => prev.filter((item) => item !== skill));
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
          <div className="explorer-layout">
            <SkillProfileSidebar
              skills={kaptenSkills}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              source={jobSource}
              onSourceChange={setJobSource}
            />
            <JobExplorer
              applications={applications}
              kaptenSkills={kaptenSkills}
              source={jobSource}
              onSourceChange={setJobSource}
              onSaveJob={handleSaveJob}
            />
          </div>
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
          <ManualApplicationModal
            applications={applications}
            onSubmit={handleAddApplication}
            onClose={() => setIsManualModalOpen(false)}
          />
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
          key={deletedBackup.app.id}
          company={deletedBackup.app.company}
          onUndo={handleUndoDelete}
          onDismiss={handleDismissToast}
        />
      )}
    </div>
  );
}

export default App;