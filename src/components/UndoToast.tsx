import { useEffect, useState } from "react";
import { RotateCcw, X } from "lucide-react";

interface UndoToastProps {
  company: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ company, onUndo, onDismiss }: UndoToastProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(5);

  useEffect(() => {
    setSecondsLeft(5);
    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [company]);

  return (
    <div className="undo-toast" role="status" aria-live="polite">
      <span>
        Lamaran <strong>{company}</strong> telah dihapus.
      </span>
      <button type="button" className="btn-undo" onClick={onUndo}>
        <RotateCcw size={14} />
        Undo ({secondsLeft}d)
      </button>
      <button
        type="button"
        className="btn-icon-subtle"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
      >
        <X size={14} />
      </button>
    </div>
  );
}