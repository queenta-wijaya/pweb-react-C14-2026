import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import type { JobDataSource } from "../services/jobService";

interface SkillProfileSidebarProps {
  skills: string[];
  onAddSkill: (skill: string) => boolean;
  onRemoveSkill: (skill: string) => void;
  source: JobDataSource;
  onSourceChange: (source: JobDataSource) => void;
}

export function SkillProfileSidebar({
  skills,
  onAddSkill,
  onRemoveSkill,
  source,
  onSourceChange,
}: SkillProfileSidebarProps) {
  const [newSkill, setNewSkill] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const skill = newSkill.trim();
    if (!skill) {
      setError("Nama skill tidak boleh kosong.");
      return;
    }
    if (!onAddSkill(skill)) {
      setError("Skill tersebut sudah ada di profil.");
      return;
    }
    setNewSkill("");
    setError("");
  };

  return (
    <aside className="skill-sidebar">
      <div className="explorer-section-heading">
        <span className="eyebrow">PROFIL KAPTEN</span>
        <h3>Skill yang dikuasai</h3>
      </div>
      <form className="skill-add-form" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="new-skill">
          Tambah skill
        </label>
        <input
          id="new-skill"
          value={newSkill}
          onChange={(event) => setNewSkill(event.target.value)}
          placeholder="Contoh: Docker"
        />
        <button type="submit" className="btn-primary" aria-label="Tambah skill">
          <Plus size={16} />
        </button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="skill-chip-list" aria-label="Daftar skill Kapten">
        {skills.map((skill) => (
          <span className="skill-chip" key={skill}>
            {skill}
            <button
              type="button"
              onClick={() => onRemoveSkill(skill)}
              aria-label={`Hapus skill ${skill}`}
            >
              <X size={13} />
            </button>
          </span>
        ))}
        {skills.length === 0 && (
          <p className="muted-text">Belum ada skill. Tambahkan skill agar skor cocok dapat dihitung.</p>
        )}
      </div>

      <div className="explorer-source-control">
        <label htmlFor="job-source">Sumber data lowongan</label>
        <select
          id="job-source"
          value={source}
          onChange={(event) =>
            onSourceChange(event.target.value as JobDataSource)
          }
        >
          <option value="live">Remotive API (Live)</option>
          <option value="fallback">Dataset Magang ID</option>
        </select>
      </div>
    </aside>
  );
}
