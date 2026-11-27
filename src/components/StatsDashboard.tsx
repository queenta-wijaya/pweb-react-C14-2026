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
    <section aria-label="Dashboard Statistik Lamaran">
      <div>
        <div>
          <p>TOTAL LAMARAN</p>
          <p>{totalApplications}</p>
          <p>{processedCount} sudah diproses</p>
        </div>

        <div>
          <p>RESPONSE RATE</p>
          <p>{responseRateText}</p>
          <p>
            {processedCount} dari {totalApplications} lamaran
          </p>
        </div>

        <div>
          <p>INTERVIEW RATE</p>
          <p>{interviewRateText}</p>
          <p>{interviewCount} masuk tahap interview/offer</p>
        </div>

        <div
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
          <p>RAWAN GHOSTING</p>
          <p>{ghostingCount}</p>
          <p>&gt; 14 hari tanpa kabar</p>
        </div>

        <div
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
          <p>TOTAL OFFER</p>
          <p>{offerCount}</p>
          <p>
            {offerCount >= 2
              ? "Siap dibandingkan"
              : "Minimal 2 offer untuk bandingkan"}
          </p>
        </div>
      </div>
    </section>
  );
}