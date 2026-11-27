import type { Application } from "../types";
import { isRawanGhosting } from "../utils/ghostingUtils";

interface StatsDashboardProps {
  applications: Application[];
  onSelectFilterStatus?: (status: "ALL" | "OFFER") => void;
  onToggleGhostingOnly?: () => void;
}

function formatPercent(numerator: number, denominator: number): string {
  if (denominator <= 0) {
    return "0%";
  }
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function StatsDashboard({
  applications,
  onSelectFilterStatus,
  onToggleGhostingOnly,
}: StatsDashboardProps) {
  const totalApplications = applications.length;

  const processedCount = applications.filter(
    (app) => app.status !== "WISHLIST"
  ).length;

  const interviewCount = applications.filter(
    (app) => app.status === "INTERVIEW" || app.status === "OFFER"
  ).length;

  const ghostingCount = applications.filter((app) =>
    isRawanGhosting(app)
  ).length;

  const offerCount = applications.filter(
    (app) => app.status === "OFFER"
  ).length;

  const responseRateText = formatPercent(processedCount, totalApplications);
  const interviewRateText = formatPercent(interviewCount, totalApplications);

  return (
    <section className="stats-dashboard" aria-label="Dashboard Statistik Lamaran">
      <div className="stats-grid">
        <article className="stats-card">
          <p className="stats-label">TOTAL LAMARAN</p>
          <p className="stats-value">{totalApplications}</p>
          <p className="stats-caption">{processedCount} sudah diproses</p>
        </article>

        <article className="stats-card">
          <p className="stats-label">RESPONSE RATE</p>
          <p className="stats-value">{responseRateText}</p>
          <p className="stats-caption">
            {processedCount} dari {totalApplications} lamaran
          </p>
        </article>

        <article className="stats-card">
          <p className="stats-label">INTERVIEW RATE</p>
          <p className="stats-value">{interviewRateText}</p>
          <p className="stats-caption">
            {interviewCount} masuk tahap interview/offer
          </p>
        </article>

        <article
          className={`stats-card stats-card-ghosting${onToggleGhostingOnly ? " stats-card-interactive" : ""}`}
          role={onToggleGhostingOnly ? "button" : undefined}
          tabIndex={onToggleGhostingOnly ? 0 : undefined}
          onClick={onToggleGhostingOnly}
          onKeyDown={(e) => {
            if (onToggleGhostingOnly && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              onToggleGhostingOnly();
            }
          }}
        >
          <p className="stats-label">RAWAN GHOSTING</p>
          <p className="stats-value">{ghostingCount}</p>
          <p className="stats-caption">&gt; 14 hari tanpa kabar</p>
        </article>

        <article
          className={`stats-card stats-card-offers${onSelectFilterStatus ? " stats-card-interactive" : ""}`}
          role={onSelectFilterStatus ? "button" : undefined}
          tabIndex={onSelectFilterStatus ? 0 : undefined}
          onClick={() => onSelectFilterStatus?.("OFFER")}
          onKeyDown={(e) => {
            if (
              onSelectFilterStatus &&
              (e.key === "Enter" || e.key === " ")
            ) {
              e.preventDefault();
              onSelectFilterStatus("OFFER");
            }
          }}
        >
          <p className="stats-label">TOTAL OFFER</p>
          <p className="stats-value">{offerCount}</p>
          <p className="stats-caption">
            {offerCount >= 2
              ? "Siap dibandingkan"
              : "Minimal 2 offer untuk bandingkan"}
          </p>
        </article>
      </div>
    </section>
  );
}