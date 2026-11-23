import { useState } from "react";
import {
  Search,
  Clock,
  Trash2,
  Eye,
  AlertCircle,
  Plus,
  Briefcase,
} from "lucide-react";
import type { Application, ApplicationStatus } from "../types";
import { isRawanGhosting } from "../utils/ghostingUtils";
import { getSkillMatch } from "../utils/skillMatchUtils";

type StatusFilter = "ALL" | ApplicationStatus;
type SortOption = "newest" | "interview" | "offer";

interface WarRoomPipelineProps {
  applications: Application[];
  kaptenSkills: string[];
  onSimulateGhosting: (id: string) => void;
  onDeleteApplication: (id: string) => void;
  onSelectApplication: (app: Application) => void;
  onOpenManualModal: () => void;
}

const STATUS_OPTIONS: StatusFilter[] = [
  "ALL",
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

function getMatchBadgeClass(score: number): string {
  if (score >= 70) return "badge-green";
  if (score >= 40) return "badge-yellow";
  return "badge-red";
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WarRoomPipeline({
  applications,
  kaptenSkills,
  onSimulateGhosting,
  onDeleteApplication,
  onSelectApplication,
  onOpenManualModal,
}: WarRoomPipelineProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [onlyGhosting, setOnlyGhosting] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const filteredApplications = applications
    .filter((app) => {
      const keyword = searchQuery.trim().toLowerCase();
      const matchesText =
        keyword === "" ||
        app.company.toLowerCase().includes(keyword) ||
        app.role.toLowerCase().includes(keyword);
      const matchesStatus =
        statusFilter === "ALL" || app.status === statusFilter;
      const matchesGhosting = !onlyGhosting || isRawanGhosting(app);
      return matchesText && matchesStatus && matchesGhosting;
    })
    .sort((a, b) => {
      if (sortBy === "interview") {
        const timeA = a.interviewDateTime
          ? new Date(a.interviewDateTime).getTime()
          : Number.POSITIVE_INFINITY;
        const timeB = b.interviewDateTime
          ? new Date(b.interviewDateTime).getTime()
          : Number.POSITIVE_INFINITY;
        return timeA - timeB;
      }
      if (sortBy === "offer") {
        return (b.salaryOffer ?? 0) - (a.salaryOffer ?? 0);
      }
      return (
        new Date(b.lastUpdatedAt).getTime() -
        new Date(a.lastUpdatedAt).getTime()
      );
    });

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>War Room Pipeline Lamaran</h2>
          <p className="muted-text">
            Pantau progres seleksi, deteksi rawan ghosting (&gt;14 hari), dan
            kelola checklist persiapan.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={onOpenManualModal}
        >
          <Plus size={16} />
          Catat Lamaran
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder="Cari perusahaan atau posisi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter status lamaran"
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === "ALL" ? "Semua Status" : status}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          aria-label="Urutkan lamaran"
        >
          <option value="newest">Urutkan: Terbaru</option>
          <option value="interview">Jadwal Interview Terdekat</option>
          <option value="offer">Offer Tertinggi</option>
        </select>

        <label className="checkbox-pill">
          <input
            type="checkbox"
            checked={onlyGhosting}
            onChange={(e) => setOnlyGhosting(e.target.checked)}
          />
          <span>Hanya Rawan Ghosting</span>
        </label>
      </div>

      {applications.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={32} />
          <h3>Belum ada lamaran tersimpan</h3>
          <p>
            Simpan lowongan dari tab Eksplorasi Lowongan atau tambah lamaran
            secara manual.
          </p>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="empty-state">
          <h3>Tidak ada lamaran yang cocok dengan filter</h3>
          <p>Coba ubah kata kunci pencarian atau reset filter status.</p>
        </div>
      ) : (
        <div className="pipeline-list">
          {filteredApplications.map((app) => {
            const matchScore = getSkillMatch(
              app.requiredSkills,
              kaptenSkills
            ).score;
            const ghosting = isRawanGhosting(app);
            const doneCount = app.checklist.filter((item) => item.done).length;
            const totalChecklist = app.checklist.length;
            const canSimulateGhosting =
              app.status === "APPLIED" || app.status === "SCREENING";

            return (
              <article key={app.id} className="pipeline-card">
                <div className="pipeline-card-main">
                  <div className="pipeline-title-row">
                    <h3>{app.role}</h3>
                    <span className={`status-pill status-${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                    <span className={`match-pill ${getMatchBadgeClass(matchScore)}`}>
                      {matchScore}% Match
                    </span>
                    {ghosting && (
                      <span className="ghosting-pill">
                        <AlertCircle size={13} />
                        Rawan Ghosting
                      </span>
                    )}
                  </div>

                  <p className="company-meta">
                    <strong>{app.company}</strong> &bull; {app.workMode}
                    {app.cvVersion ? ` • CV: ${app.cvVersion}` : ""}
                    {app.interviewDateTime
                      ? ` • Interview: ${formatDateTime(app.interviewDateTime)}`
                      : ""}
                    {typeof app.salaryOffer === "number" && app.salaryOffer > 0
                      ? ` • Offer: Rp ${app.salaryOffer.toLocaleString("id-ID")}`
                      : ""}
                  </p>

                  <div className="pipeline-submeta">
                    <span>
                      Checklist: <strong>{doneCount}/{totalChecklist}</strong> selesai
                    </span>
                    <span>
                      Update terakhir: {formatDateTime(app.lastUpdatedAt)}
                    </span>
                  </div>
                </div>

                <div className="pipeline-actions">
                  {canSimulateGhosting && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onSimulateGhosting(app.id)}
                      title="Mundurkan lastUpdatedAt sebanyak 15 hari"
                    >
                      <Clock size={14} />
                      Simulasi +15 Hari
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onSelectApplication(app)}
                  >
                    <Eye size={14} />
                    Detail
                  </button>

                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => onDeleteApplication(app.id)}
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}