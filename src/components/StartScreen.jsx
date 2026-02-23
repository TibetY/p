import { useState, useRef } from 'react';

const hasSpeechAPI =
  typeof window !== 'undefined' &&
  !!(window.SpeechRecognition || window.webkitSpeechRecognition);

export default function StartScreen({ onStart }) {
  const [customQuestions, setCustomQuestions] = useState(null);
  const [loadedName, setLoadedName] = useState('');
  const [doShuffle, setDoShuffle] = useState(true);
  const fileRef = useRef(null);

  const handleStart = async () => {
    let qs = customQuestions;
    if (!qs) {
      try {
        const res = await fetch('/questions.json');
        if (!res.ok) throw new Error();
        qs = await res.json();
      } catch {
        alert('Could not load questions.json.');
        return;
      }
    }
    onStart(qs, doShuffle);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data) || !data[0]?.question) throw new Error();
        setCustomQuestions(data);
        setLoadedName(file.name);
      } catch {
        alert('Invalid JSON. Expected [{question, answer, keywords?}]');
      }
    };
    reader.readAsText(file);
    // reset so the same file can be re-loaded
    e.target.value = '';
  };

  return (
    <div className="screen">
      <div className="start-icon">🎤</div>
      <h2>Ready to be quizzed?</h2>
      <p>Speak your answers aloud. The app checks them and gives you a final score.</p>

      {!hasSpeechAPI && (
        <div className="browser-warn">
          Your browser may not support the Web Speech API. For best results, use
          <strong> Chrome or Edge on Android</strong>.
        </div>
      )}

      <button className="btn btn-primary" onClick={handleStart}>
        Start Quiz
      </button>

      <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>
        {loadedName ? `✓ ${loadedName}` : 'Load custom JSON'}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <label className="shuffle-label">
        <input
          type="checkbox"
          checked={doShuffle}
          onChange={(e) => setDoShuffle(e.target.checked)}
        />
        Shuffle questions
      </label>
    </div>
  );
}
