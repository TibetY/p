import { useState, useRef } from 'react';

export default function QuizScreen({ question, questionIndex, totalQuestions, onSubmit, onNext }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setTranscript('Speech recognition not supported. Try Chrome on Android.');
      return;
    }

    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = true;
    r.maxAlternatives = 3;
    r.continuous = false;
    recognitionRef.current = r;

    let final = '';
    setListening(true);

    r.onresult = (e) => {
      clearTimeout(silenceTimerRef.current);
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim = e.results[i][0].transcript;
      }
      setTranscript(final + interim);
      if (final) {
        silenceTimerRef.current = setTimeout(() => r.stop(), 1500);
      }
    };

    r.onerror = (e) => {
      clearTimeout(silenceTimerRef.current);
      setListening(false);
      if (e.error === 'no-speech') setTranscript('(no speech detected — try again)');
    };

    r.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setListening(false);
      const spoken = final.trim();
      if (spoken) {
        const isCorrect = onSubmit(spoken, question);
        setCorrect(isCorrect);
        setAnswered(true);
        setTranscript(spoken);
      }
    };

    r.start();
  };

  const handleMic = () => {
    if (answered) return;
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    startListening();
  };

  return (
    <div className="screen">
      <div className="question-card">
        <div className="question-number">
          Question {questionIndex + 1} of {totalQuestions}
        </div>
        <div className="question-text">{question.question}</div>
      </div>

      <button
        className={`mic-btn${listening ? ' listening' : ''}`}
        onClick={handleMic}
        aria-label={listening ? 'Stop listening' : 'Tap to answer'}
        disabled={answered}
      >
        🎤
      </button>

      <div className="mic-hint">
        {listening ? 'Listening… tap to stop' : answered ? '\u00A0' : 'Tap to answer'}
      </div>

      <div className={`transcript-box${!transcript ? ' placeholder' : ''}`}>
        {transcript || 'Your answer will appear here…'}
      </div>

      {answered && (
        <div className={`result-feedback ${correct ? 'correct' : 'wrong'}`}>
          <span className="feedback-icon">{correct ? '✅' : '❌'}</span>
          <div>
            <div>
              <strong>{correct ? 'Correct!' : 'Incorrect.'}</strong>
              {!correct && ` You said: "${transcript || '…'}"`}
            </div>
            {!correct && (
              <div className="feedback-correct-ans">
                Correct answer: {question.answer}
              </div>
            )}
          </div>
        </div>
      )}

      {answered && (
        <button className="btn btn-next" onClick={onNext}>
          {questionIndex + 1 < totalQuestions ? 'Next question →' : 'See results'}
        </button>
      )}
    </div>
  );
}
