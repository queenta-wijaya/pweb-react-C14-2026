import { useState } from "react";
import type { Application } from "../types";
import {
  calculateOfferEvaluation,
  DEFAULT_OFFER_WEIGHTS,
  getWorkModeScore,
} from "../utils/offerScoreUtils";
import { getSkillMatch } from "../utils/skillMatchUtils";

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function OfferComparator({
  applications,
  kaptenSkills,
}: OfferComparatorProps) {
  const offerApplications = applications.filter(
    (app) => app.status === "OFFER"
  );

  const [selectedOfferAId, setSelectedOfferAId] = useState<string>("");
  const [selectedOfferBId, setSelectedOfferBId] = useState<string>("");

  if (offerApplications.length < 2) {
    return (
      <section className="panel offer-comparator" aria-label="Bandingkan Offer Magang">
        <div className="panel-header">
          <div>
            <span className="eyebrow">AMBIL KEPUTUSAN</span>
            <h2>Bandingkan Offer Magang</h2>
          </div>
        </div>
        <div className="empty-state offer-empty-state">
          <h3>Belum cukup offer untuk dibandingkan</h3>
          <p>
            Minimal dibutuhkan 2 lamaran berstatus <strong>OFFER</strong>.
            Saat ini tersedia {offerApplications.length} offer.
          </p>
        </div>
      </section>
    );
  }

  const offerA =
    offerApplications.find((app) => app.id === selectedOfferAId) ??
    offerApplications[0];

  const offerB =
    offerApplications.find(
      (app) => app.id === selectedOfferBId && app.id !== offerA.id
    ) ??
    offerApplications.find((app) => app.id !== offerA.id) ??
    offerApplications[1];

  const maxSalaryCompared = Math.max(
    offerA.salaryOffer ?? 0,
    offerB.salaryOffer ?? 0,
    1
  );

  const matchA = getSkillMatch(offerA.requiredSkills, kaptenSkills);
  const matchB = getSkillMatch(offerB.requiredSkills, kaptenSkills);

  const evalA = calculateOfferEvaluation(
    offerA,
    matchA.score,
    maxSalaryCompared,
    DEFAULT_OFFER_WEIGHTS
  );
  const evalB = calculateOfferEvaluation(
    offerB,
    matchB.score,
    maxSalaryCompared,
    DEFAULT_OFFER_WEIGHTS
  );

  const isABest = evalA.totalScore >= evalB.totalScore;
  const isBBest = evalB.totalScore > evalA.totalScore;

  return (
    <section className="panel offer-comparator" aria-label="Bandingkan Offer Magang">
      <div className="panel-header offer-comparator-header">
        <div>
          <span className="eyebrow">AMBIL KEPUTUSAN</span>
          <h2>Bandingkan Offer Magang</h2>
          <p className="muted-text">
            Bobot penilaian: Uang Saku 50% &bull; Mode Kerja 25% &bull;
            Kecocokan Skill 25%
          </p>
        </div>

        <div className="offer-selectors">
          <label className="offer-select">
            <span>Offer A</span>
            <select
              value={offerA.id}
              onChange={(e) => setSelectedOfferAId(e.target.value)}
            >
              {offerApplications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company} — {app.role}
                </option>
              ))}
            </select>
          </label>

          <span className="offer-versus">VS</span>

          <label className="offer-select">
            <span>Offer B</span>
            <select
              value={offerB.id}
              onChange={(e) => setSelectedOfferBId(e.target.value)}
            >
              {offerApplications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.company} — {app.role}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="offer-comparison-grid">
        <article className={`offer-card${isABest ? " offer-card-recommended" : ""}`}>
          <div className="offer-card-heading">
            <div>
              <span className="offer-card-label">PILIHAN A</span>
              <h3>{offerA.company}</h3>
              <p>{offerA.role}</p>
            </div>
            {isABest && <span className="recommendation-badge">Rekomendasi Terbaik</span>}
          </div>

          <div className="offer-metrics">
            <p className="offer-metric">
              <span>Uang saku / bulan</span>
              <strong>{formatRupiah(evalA.salaryOffer)}</strong>
              <small>{evalA.weightedSalaryPart.toFixed(1)} / 50 poin</small>
            </p>
            <p className="offer-metric">
              <span>Mode kerja</span>
              <strong>
                {offerA.workMode} ({getWorkModeScore(offerA.workMode)})
              </strong>{" "}
              <small>{evalA.weightedWorkModePart.toFixed(1)} / 25 poin</small>
            </p>
            <p className="offer-metric">
              <span>Kecocokan skill</span>
              <strong>
                {matchA.score}% ({matchA.matchedSkills.length} dari{" "}
                {offerA.requiredSkills.length} skill)
              </strong>{" "}
              <small>{evalA.weightedSkillMatchPart.toFixed(1)} / 25 poin</small>
            </p>
          </div>

          <div className="offer-total-score">
            <p>TOTAL SKOR BERBOBOT</p>
            <strong>{evalA.totalScore.toFixed(1)}<small> / 100</small></strong>
          </div>
        </article>

        <article className={`offer-card${isBBest ? " offer-card-recommended" : ""}`}>
          <div className="offer-card-heading">
            <div>
              <span className="offer-card-label">PILIHAN B</span>
              <h3>{offerB.company}</h3>
              <p>{offerB.role}</p>
            </div>
            {isBBest && <span className="recommendation-badge">Rekomendasi Terbaik</span>}
          </div>

          <div className="offer-metrics">
            <p className="offer-metric">
              <span>Uang saku / bulan</span>
              <strong>{formatRupiah(evalB.salaryOffer)}</strong>
              <small>{evalB.weightedSalaryPart.toFixed(1)} / 50 poin</small>
            </p>
            <p className="offer-metric">
              <span>Mode kerja</span>
              <strong>
                {offerB.workMode} ({getWorkModeScore(offerB.workMode)})
              </strong>{" "}
              <small>{evalB.weightedWorkModePart.toFixed(1)} / 25 poin</small>
            </p>
            <p className="offer-metric">
              <span>Kecocokan skill</span>
              <strong>
                {matchB.score}% ({matchB.matchedSkills.length} dari{" "}
                {offerB.requiredSkills.length} skill)
              </strong>{" "}
              <small>{evalB.weightedSkillMatchPart.toFixed(1)} / 25 poin</small>
            </p>
          </div>

          <div className="offer-total-score">
            <p>TOTAL SKOR BERBOBOT</p>
            <strong>{evalB.totalScore.toFixed(1)}<small> / 100</small></strong>
          </div>
        </article>
      </div>
    </section>
  );
}