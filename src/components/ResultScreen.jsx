import { useEffect, useRef } from 'react';

const CIRCUMFERENCE = 263.9;

export default function ResultScreen({ score, total, results, onRestart }) {
  const pct = Math.round((score / total) * 100);
  const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';
  const ringRef = useRef(null);

  useEffect(() => {
    if (!ringRef.current) return;
    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * pct) / 100;
    ringRef.current.style.stroke = color;
    requestAnimationFrame(() => {
      if (ringRef.current) ringRef.current.style.strokeDashoffset = offset;
    });
  }, [pct, color]);

  const heading =
    pct >= 80 ? '🎉 Excellent work!' : pct >= 50 ? '👍 Not bad!' : '📚 Keep practising!';

  const missed = results.filter((r) => !r.correct);

  return (
    <div className="screen result-screen">
      <div className="score-ring">
        <svg viewBox="0 0 100 100">
          <circle className="ring-bg" cx="50" cy="50" r="42" />
          <circle
            ref={ringRef}
            className="ring-fill"
            cx="50"
            cy="50"
            r="42"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE}
          />
        </svg>
        <div className="score-label">
          <span className="score-pct" style={{ color }}>{pct}%</span>
          <span className="score-fraction">{score} / {total}</span>
        </div>
      </div>

      <h2>{heading}</h2>

      {missed.length > 0 && (
        <div className="wrong-list-wrap">
          <h3>Missed questions</h3>
          <div className="wrong-list">
            {missed.map((r, i) => (
              <div key={i} className="wrong-item">
                <div className="wrong-q">{r.question}</div>
                <div className="wrong-your-ans">You said: &ldquo;{r.spoken || '(nothing)'}&rdquo;</div>
                <div className="wrong-correct-ans">Correct: {r.answer}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary" onClick={onRestart}>
        Try again
      </button>
    </div>
  );
}
