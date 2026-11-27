import { useEffect, useState } from "react";

interface InterviewPrepTimerProps {
  role?: string;
  company?: string;
}

const INITIAL_SECONDS = 120; // 02:00

const INTERVIEW_QUESTIONS: string[] = [
  "Ceritakan proyek atau tugas kuliah teknis yang paling menantang bagi kamu dan bagaimana cara kamu menyelesaikannya.",
  "Bagaimana cara kamu melakukan debugging saat menemukan bug yang tidak muncul di lokal atau sulit direproduksi?",
  "Jelaskan perbedaan pengelolaan state lokal, derived state, dan efek samping (side effect) di React.",
  "Bagaimana alur kerja kamu menggunakan Git (branch, commit, pull/push, dan resolusi konflik) saat bekerja dalam tim?",
  "Jika diberi tugas baru dengan stack teknologi yang belum pernah kamu pakai sebelumnya, apa langkah pertama yang kamu lakukan?",
  "Ceritakan pengalaman kerja sama tim saat jadwal atau prioritas tugas berubah mendadak.",
];

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function InterviewPrepTimer({
  role,
  company,
}: InterviewPrepTimerProps) {
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [secondsLeft, setSecondsLeft] = useState<number>(INITIAL_SECONDS);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isRunning]);

  const handleToggleStartPause = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(INITIAL_SECONDS);
      setIsRunning(true);
      return;
    }
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
  };

  const handleNextQuestion = () => {
    setIsRunning(false);
    setSecondsLeft(INITIAL_SECONDS);
    setQuestionIndex((prev) => (prev + 1) % INTERVIEW_QUESTIONS.length);
  };

  const currentQuestion = INTERVIEW_QUESTIONS[questionIndex];

  return (
    <section aria-label="Latihan Interview">
      <div>
        <div>
          <p>LATIHAN INTERVIEW</p>
          {(role || company) && (
            <p>
              {role ?? "Posisi Magang"}
              {company ? ` — ${company}` : ""}
            </p>
          )}
        </div>
        <span>
          Soal {questionIndex + 1} / {INTERVIEW_QUESTIONS.length}
        </span>
      </div>

      <p>“{currentQuestion}”</p>

      <div>
        <span aria-live="polite">{formatCountdown(secondsLeft)}</span>

        <div>
          <button type="button" onClick={handleToggleStartPause}>
            {isRunning ? "Jeda" : "Mulai"}
          </button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
          <button type="button" onClick={handleNextQuestion}>
            Soal Berikutnya
          </button>
        </div>
      </div>
    </section>
  );
}