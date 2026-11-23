import type { JobListing } from "../types";

export interface SkillMatch {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function getSkillMatch(
  requiredSkills: string[],
  kaptenSkills: string[]
): SkillMatch {
  const ownedSkills = new Set(
    kaptenSkills.map((skill) => skill.trim().toLocaleLowerCase())
  );
  const matchedSkills = requiredSkills.filter((skill) =>
    ownedSkills.has(skill.trim().toLocaleLowerCase())
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !ownedSkills.has(skill.trim().toLocaleLowerCase())
  );

  return {
    score:
      requiredSkills.length === 0
        ? 100
        : Math.round((matchedSkills.length / requiredSkills.length) * 100),
    matchedSkills,
    missingSkills,
  };
}

export function getJobSkillMatch(
  job: JobListing,
  kaptenSkills: string[]
): SkillMatch {
  return getSkillMatch(job.tags, kaptenSkills);
}

export function hasDuplicateApplication(
  applications: ReadonlyArray<{ company: string; role: string }>,
  company: string,
  role: string
): boolean {
  const normalizedCompany = company.trim().toLocaleLowerCase();
  const normalizedRole = role.trim().toLocaleLowerCase();
  return applications.some(
    (application) =>
      application.company.trim().toLocaleLowerCase() === normalizedCompany &&
      application.role.trim().toLocaleLowerCase() === normalizedRole
  );
}
