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
      <section aria-label="Bandingkan Offer Magang">
        <h2>Bandingkan Offer Magang</h2>
        <p>
          Belum cukup offer untuk dibandingkan. Minimal dibutuhkan 2 lamaran
          berstatus <strong>OFFER</strong> (saat ini baru tersedia{" "}
          {offerApplications.length} offer).
        </p>
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
    <section aria-label="Bandingkan Offer Magang">
      <div>
        <div>
          <h2>Bandingkan Offer Magang</h2>
          <p>
            Bobot penilaian: Uang Saku 50% &bull; Mode Kerja 25% &bull;
            Kecocokan Skill 25%
          </p>
        </div>

        <div>
          <label>
            Offer A:{" "}
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

          <span> vs </span>

          <label>
            Offer B:{" "}
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

      <div>
        {/* Kartu Offer A */}
        <article>
          <div>
            <div>
              <h3>{offerA.company}</h3>
              <p>{offerA.role}</p>
            </div>
            {isABest && <span>Rekomendasi Terbaik</span>}
          </div>

          <div>
            <p>
              Uang Saku / Bulan: <strong>{formatRupiah(evalA.salaryOffer)}</strong>{" "}
              ({evalA.weightedSalaryPart.toFixed(1)} / 50)
            </p>
            <p>
              Mode Kerja:{" "}
              <strong>
                {offerA.workMode} ({getWorkModeScore(offerA.workMode)})
              </strong>{" "}
              ({evalA.weightedWorkModePart.toFixed(1)} / 25)
            </p>
            <p>
              Kecocokan Skill:{" "}
              <strong>
                {matchA.score}% ({matchA.matchedSkills.length} dari{" "}
                {offerA.requiredSkills.length} skill)
              </strong>{" "}
              ({evalA.weightedSkillMatchPart.toFixed(1)} / 25)
            </p>
          </div>

          <div>
            <p>TOTAL SKOR BERBOBOT</p>
            <p>{evalA.totalScore.toFixed(1)}</p>
          </div>
        </article>

        {/* Kartu Offer B */}
        <article>
          <div>
            <div>
              <h3>{offerB.company}</h3>
              <p>{offerB.role}</p>
            </div>
            {isBBest && <span>Rekomendasi Terbaik</span>}
          </div>

          <div>
            <p>
              Uang Saku / Bulan: <strong>{formatRupiah(evalB.salaryOffer)}</strong>{" "}
              ({evalB.weightedSalaryPart.toFixed(1)} / 50)
            </p>
            <p>
              Mode Kerja:{" "}
              <strong>
                {offerB.workMode} ({getWorkModeScore(offerB.workMode)})
              </strong>{" "}
              ({evalB.weightedWorkModePart.toFixed(1)} / 25)
            </p>
            <p>
              Kecocokan Skill:{" "}
              <strong>
                {matchB.score}% ({matchB.matchedSkills.length} dari{" "}
                {offerB.requiredSkills.length} skill)
              </strong>{" "}
              ({evalB.weightedSkillMatchPart.toFixed(1)} / 25)
            </p>
          </div>

          <div>
            <p>TOTAL SKOR BERBOBOT</p>
            <p>{evalB.totalScore.toFixed(1)}</p>
          </div>
        </article>
      </div>
    </section>
  );
}