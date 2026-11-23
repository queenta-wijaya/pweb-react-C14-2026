import { useEffect, useMemo, useRef, useState } from "react";
import { Briefcase, MapPin, Search, Wifi, WifiOff } from "lucide-react";
import type { Application, JobListing } from "../types";
import { fetchJobs, type JobDataSource } from "../services/jobService";
import { useDebounce } from "../hooks/useDebounce";
import { getJobSkillMatch, hasDuplicateApplication } from "../utils/skillMatchUtils";

interface JobExplorerProps {
  applications: Application[];
  kaptenSkills: string[];
  source: JobDataSource;
  onSourceChange: (source: JobDataSource) => void;
  onSaveJob: (job: JobListing) => void;
}

type JobLoadState =
  | { requestKey: string; status: "loading" }
  | { requestKey: string; status: "success"; jobs: JobListing[] }
  | { requestKey: string; status: "error"; message: string };

const EMPTY_JOBS: JobListing[] = [];

function getMatchBadgeClass(score: number): string {
  if (score >= 70) return "badge-green";
  if (score >= 40) return "badge-yellow";
  return "badge-red";
}

export function JobExplorer({
  applications,
  kaptenSkills,
  source,
  onSourceChange,
  onSaveJob,
}: JobExplorerProps) {
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${source}:${retryCount}`;
  const [loadState, setLoadState] = useState<JobLoadState>({
    requestKey: "live:0",
    status: "loading",
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(source, controller.signal)
      .then((loadedJobs) => {
        setLoadState({ requestKey, status: "success", jobs: loadedJobs });
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }
        setLoadState({
          requestKey,
          status: "error",
          message: cause instanceof Error
            ? cause.message
            : "Terjadi kesalahan saat mengambil lowongan.",
        });
      });

    return () => controller.abort();
  }, [source, retryCount, requestKey]);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input, textarea, select, [contenteditable='true'], [role='dialog']"))
      ) {
        return;
      }

      event.preventDefault();
      searchInputRef.current?.focus();
    };

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, []);

  const currentLoadState: JobLoadState =
    loadState.requestKey === requestKey
      ? loadState
      : { requestKey, status: "loading" };
  const jobs =
    currentLoadState.status === "success"
      ? currentLoadState.jobs
      : EMPTY_JOBS;

  const categories = useMemo(
    () => [...new Set(jobs.map((job) => job.category))].sort((a, b) => a.localeCompare(b)),
    [jobs]
  );

  const visibleJobs = useMemo(() => {
    const keyword = debouncedSearch.trim().toLocaleLowerCase();
    return jobs
      .filter((job) => category === "ALL" || job.category === category)
      .filter((job) => {
        if (!keyword) return true;
        return [
          job.title,
          job.company_name,
          job.category,
          job.candidate_required_location,
          ...job.tags,
        ].some((value) => value.toLocaleLowerCase().includes(keyword));
      })
      .sort(
        (a, b) =>
          getJobSkillMatch(b, kaptenSkills).score -
          getJobSkillMatch(a, kaptenSkills).score
      );
  }, [jobs, category, debouncedSearch, kaptenSkills]);

  const switchToFallback = () => onSourceChange("fallback");

  return (
    <section className="panel job-explorer-panel">
      <div className="panel-header">
        <div>
          <span className="eyebrow">TEMUKAN PELUANG</span>
          <h2>Eksplorasi Lowongan</h2>
          <p className="muted-text">
            Lowongan diurutkan berdasarkan kecocokan skill tertinggi. Tekan{" "}
            <kbd>/</kbd> untuk mencari.
          </p>
        </div>
        <span className={`source-indicator ${source === "live" ? "source-live" : ""}`}>
          {source === "live" ? <Wifi size={14} /> : <WifiOff size={14} />}
          {source === "live" ? "LIVE API" : "DATA LOKAL"}
        </span>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} />
          <input
            ref={searchInputRef}
            type="search"
            placeholder="Cari posisi, perusahaan, atau skill..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Cari lowongan"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter kategori lowongan"
        >
          <option value="ALL">Semua kategori</option>
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {currentLoadState.status === "loading" ? (
        <div className="empty-state" role="status">
          <div className="loading-indicator" />
          <h3>Memuat lowongan...</h3>
          <p>Menghubungkan ke {source === "live" ? "Remotive API" : "dataset lokal"}.</p>
        </div>
      ) : currentLoadState.status === "error" ? (
        <div className="explorer-error" role="alert">
          <Briefcase size={24} />
          <div>
            <h3>Lowongan gagal dimuat</h3>
            <p>{currentLoadState.message}</p>
            <div className="explorer-error-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Coba Lagi
              </button>
              {source !== "fallback" && (
                <button type="button" className="btn-primary" onClick={switchToFallback}>
                  Gunakan Fallback Lokal
                </button>
              )}
              {source === "fallback" && (
                <button type="button" className="btn-secondary" onClick={() => onSourceChange("live")}>
                  Coba Remotive API
                </button>
              )}
            </div>
          </div>
        </div>
      ) : visibleJobs.length === 0 ? (
        <div className="empty-state">
          <Briefcase size={32} />
          <h3>{jobs.length === 0 ? "Belum ada lowongan" : "Lowongan tidak ditemukan"}</h3>
          <p>{jobs.length === 0 ? "Sumber data belum memiliki lowongan." : "Coba ubah kata kunci atau kategori."}</p>
        </div>
      ) : (
        <div className="job-list">
          {visibleJobs.map((job) => {
            const match = getJobSkillMatch(job, kaptenSkills);
            const alreadyApplied = hasDuplicateApplication(
              applications,
              job.company_name,
              job.title
            );
            return (
              <article className="job-card" key={`${source}-${job.id}`}>
                <div className="job-card-content">
                  <div className="job-card-heading">
                    <div>
                      <span className="eyebrow">{job.category}</span>
                      <h3>{job.title}</h3>
                      <p className="job-company">{job.company_name}</p>
                    </div>
                    <span className={`match-pill ${getMatchBadgeClass(match.score)}`}>
                      {match.score}% Match
                    </span>
                  </div>
                  <div className="job-meta">
                    <span><MapPin size={14} />{job.candidate_required_location}</span>
                    <span>{job.salary || "Gaji tidak dicantumkan"}</span>
                  </div>
                  <div className="job-skill-groups">
                    <div>
                      <span className="skill-group-label">Cocok</span>
                      <div className="job-skill-tags">
                        {match.matchedSkills.length > 0
                          ? match.matchedSkills.map((skill) => <span className="job-skill matched" key={skill}>{skill}</span>)
                          : <span className="muted-text">Belum ada</span>}
                      </div>
                    </div>
                    <div>
                      <span className="skill-group-label">Perlu dipelajari</span>
                      <div className="job-skill-tags">
                        {match.missingSkills.length > 0
                          ? match.missingSkills.map((skill) => <span className="job-skill missing" key={skill}>{skill}</span>)
                          : <span className="muted-text">Semua cocok</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={alreadyApplied ? "btn-secondary" : "btn-primary"}
                  disabled={alreadyApplied}
                  onClick={() => onSaveJob(job)}
                >
                  {alreadyApplied ? "Sudah Dilamar" : "Simpan ke Wishlist"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
