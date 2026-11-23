import { useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Application, WorkMode } from "../types";
import { hasDuplicateApplication } from "../utils/skillMatchUtils";

interface ManualApplicationModalProps {
  applications: Application[];
  onSubmit: (application: Application) => boolean;
  onClose: () => void;
}

type FieldName = "company" | "role" | "requiredSkills" | "cvVersion" | "appliedDate";
type FieldErrors = Partial<Record<FieldName, string>>;

export function ManualApplicationModal({
  applications,
  onSubmit,
  onClose,
}: ManualApplicationModalProps) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("Remote");
  const [status, setStatus] = useState<"WISHLIST" | "APPLIED">("WISHLIST");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [cvVersion, setCvVersion] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const skillsRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const focusFirstError = (nextErrors: FieldErrors) => {
    if (nextErrors.company) companyRef.current?.focus();
    else if (nextErrors.role) roleRef.current?.focus();
    else if (nextErrors.requiredSkills) skillsRef.current?.focus();
    else if (nextErrors.cvVersion) cvRef.current?.focus();
    else if (nextErrors.appliedDate) dateRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {};
    const parsedSkills = [...new Set(
      requiredSkills.split(",").map((skill) => skill.trim()).filter(Boolean)
    )];
    if (!company.trim()) nextErrors.company = "Masukkan nama perusahaan.";
    if (!role.trim()) nextErrors.role = "Masukkan posisi yang dilamar.";
    if (parsedSkills.length === 0) {
      nextErrors.requiredSkills = "Masukkan minimal satu skill.";
    }
    if (status === "APPLIED" && !cvVersion.trim()) {
      nextErrors.cvVersion = "Versi CV wajib diisi untuk status APPLIED.";
    }
    if (status === "APPLIED" && !appliedDate) {
      nextErrors.appliedDate = "Tanggal melamar wajib diisi.";
    }
    if (
      company.trim() &&
      role.trim() &&
      hasDuplicateApplication(applications, company, role)
    ) {
      nextErrors.company = "Pasangan perusahaan dan posisi ini sudah ada.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      focusFirstError(nextErrors);
      return;
    }

    const now = new Date().toISOString();
    const application: Application = {
      id: crypto.randomUUID(),
      company: company.trim(),
      role: role.trim(),
      workMode,
      status,
      requiredSkills: parsedSkills,
      ...(status === "APPLIED" ? { cvVersion: cvVersion.trim(), appliedDate } : {}),
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [{
        id: crypto.randomUUID(),
        timestamp: now,
        message: `Lamaran dicatat dengan status ${status}.`,
      }],
    };

    if (onSubmit(application)) onClose();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="modal-card manual-application-modal" role="dialog" aria-modal="true" aria-labelledby="manual-modal-title">
        <div className="modal-title-row">
          <div>
            <span className="eyebrow">CATAT PELUANG</span>
            <h2 id="manual-modal-title">Tambah Lamaran Manual</h2>
          </div>
          <button type="button" className="btn-icon-subtle modal-close-button" onClick={onClose} aria-label="Tutup form">
            <X size={18} />
          </button>
        </div>
        <form className="manual-application-form" onSubmit={handleSubmit} noValidate>
          <label>
            Perusahaan
            <input ref={companyRef} value={company} onChange={(event) => setCompany(event.target.value)} aria-invalid={Boolean(errors.company)} />
            {errors.company && <span className="form-error">{errors.company}</span>}
          </label>
          <label>
            Posisi / Role
            <input ref={roleRef} value={role} onChange={(event) => setRole(event.target.value)} aria-invalid={Boolean(errors.role)} />
            {errors.role && <span className="form-error">{errors.role}</span>}
          </label>
          <div className="manual-form-row">
            <label>
              Mode Kerja
              <select value={workMode} onChange={(event) => setWorkMode(event.target.value as WorkMode)}>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </label>
            <label>
              Status Awal
              <select value={status} onChange={(event) => setStatus(event.target.value as "WISHLIST" | "APPLIED")}>
                <option value="WISHLIST">WISHLIST</option>
                <option value="APPLIED">APPLIED</option>
              </select>
            </label>
          </div>
          <label>
            Required Skills <span className="muted-text">(pisahkan dengan koma)</span>
            <input ref={skillsRef} value={requiredSkills} onChange={(event) => setRequiredSkills(event.target.value)} placeholder="React, TypeScript, CSS" aria-invalid={Boolean(errors.requiredSkills)} />
            {errors.requiredSkills && <span className="form-error">{errors.requiredSkills}</span>}
          </label>
          {status === "APPLIED" && (
            <div className="manual-form-row">
              <label>
                Versi CV
                <input ref={cvRef} value={cvVersion} onChange={(event) => setCvVersion(event.target.value)} aria-invalid={Boolean(errors.cvVersion)} />
                {errors.cvVersion && <span className="form-error">{errors.cvVersion}</span>}
              </label>
              <label>
                Tanggal Melamar
                <input ref={dateRef} type="date" value={appliedDate} onChange={(event) => setAppliedDate(event.target.value)} aria-invalid={Boolean(errors.appliedDate)} />
                {errors.appliedDate && <span className="form-error">{errors.appliedDate}</span>}
              </label>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary">Simpan Lamaran</button>
          </div>
        </form>
      </section>
    </div>
  );
}
