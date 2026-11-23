import type { JobListing } from "../types";

export type JobDataSource = "live" | "fallback";

const REMOTIVE_URL =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";
const FALLBACK_URL = "/magang-fallback.json";

interface RemotiveResponse {
  jobs: JobListing[];
}

interface FallbackResponse {
  jobs: JobListing[];
}

function isJobListing(value: unknown): value is JobListing {
  if (typeof value !== "object" || value === null) return false;
  const job = value as Record<string, unknown>;
  return (
    typeof job.id === "number" &&
    typeof job.title === "string" &&
    typeof job.company_name === "string" &&
    typeof job.category === "string" &&
    typeof job.candidate_required_location === "string" &&
    typeof job.salary === "string" &&
    Array.isArray(job.tags) &&
    job.tags.every((tag: unknown) => typeof tag === "string")
  );
}

async function readJobs(
  response: Response,
  sourceName: string
): Promise<JobListing[]> {
  if (!response.ok) {
    throw new Error(`${sourceName} gagal dimuat (HTTP ${response.status}).`);
  }

  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("jobs" in data) ||
    !Array.isArray((data as RemotiveResponse | FallbackResponse).jobs)
  ) {
    throw new Error(`Format data ${sourceName} tidak valid.`);
  }

  const jobs = (data as RemotiveResponse | FallbackResponse).jobs;
  if (!jobs.every(isJobListing)) {
    throw new Error(`Data lowongan dari ${sourceName} tidak lengkap.`);
  }
  return jobs;
}

export async function fetchJobs(
  source: JobDataSource,
  signal: AbortSignal
): Promise<JobListing[]> {
  const url = source === "live" ? REMOTIVE_URL : FALLBACK_URL;
  const sourceName = source === "live" ? "Remotive API" : "Dataset lokal";
  const response = await fetch(url, { signal });
  return readJobs(response, sourceName);
}
