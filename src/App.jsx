import { useState, useCallback } from 'react';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalise(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

export default function App() {
  const [screen, setScreen] = useState('start');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);

  const startQuiz = useCallback((qs, doShuffle) => {
    const ordered = doShuffle ? shuffle(qs) : qs;
    setQuestions(ordered);
    setCurrent(0);
    setScore(0);
    setResults([]);
    setScreen('quiz');
  }, []);

  const submitAnswer = useCallback((spokenText, questionObj) => {
    const keywords = questionObj.keywords || [questionObj.answer];
    const correct = keywords.some(k => normalise(spokenText).includes(normalise(k)));
    if (correct) setScore(s => s + 1);
    setResults(r => [...r, {
      question: questionObj.question,
      answer: questionObj.answer,
      spoken: spokenText,
      correct,
    }]);
    return correct;
  }, []);

  const goNext = useCallback((nextIndex) => {
    if (nextIndex >= questions.length) {
      setScreen('result');
    } else {
      setCurrent(nextIndex);
    }
  }, [questions.length]);

  const restart = useCallback(() => {
    setScreen('start');
  }, []);

  const progressCurrent = screen === 'quiz' ? current : screen === 'result' ? questions.length : 0;
  const progressTotal = screen === 'start' ? 0 : questions.length;

  return (
    <div className="app">
      <header>
        <h1>Speech Quiz</h1>
        {progressTotal > 0 && (
          <>
            <div className="progress-bar-wrap">
              <div
                className="progress-bar"
                style={{ width: `${(progressCurrent / progressTotal) * 100}%` }}
              />
            </div>
            <div className="progress-label">{progressCurrent} / {progressTotal}</div>
          </>
        )}
      </header>

      {screen === 'start' && <StartScreen onStart={startQuiz} />}
      {screen === 'quiz' && (
        <QuizScreen
          key={current}
          question={questions[current]}
          questionIndex={current}
          totalQuestions={questions.length}
          onSubmit={submitAnswer}
          onNext={() => goNext(current + 1)}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          score={score}
          total={questions.length}
          results={results}
          onRestart={restart}
        />
      )}
    </div>
  );
}
