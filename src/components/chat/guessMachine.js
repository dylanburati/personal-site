import React, { useState, useContext, useMemo, useEffect } from 'react';
import { FastForward } from 'react-feather';
import { findLast, findLastIndex } from 'lodash';
import { ChatContext } from './chatContext';
import LineGraphContainer, {
  gradientColor1,
  gradientColor2,
} from '../guessr/lineGraphContainer';

export const lineColors = ['#5fe984', '#67f8f0', '#3097f5', '#7b82fa'];

const GuessMachine = () => {
  const { isConnected, nickname, messages, sendMessage } = useContext(
    ChatContext
  );

  // 0 = waiting, 1 = title, 2 = graph, 3 = result
  const [step, setStep] = useState(0);
  const [question, setQuestion] = useState(null);
  const [series, setSeries] = useState([]);
  const [answers, setAnswers] = useState([]);

  const keys = question ? question.data.map(e => e.key) : [];
  const allPointsDone = series.length && series.length === keys.length;

  const referenceData = useMemo(() => {
    return answers.map((a, i) => {
      const colorIdx = (answers.length - i - 1) % lineColors.length;
      return {
        name: a.name === nickname ? 'You' : a.name,
        showTooltip: true,
        stroke: a.name === nickname ? 'white' : lineColors[colorIdx],
        fill: a.name === nickname ? 'white' : lineColors[colorIdx],
        series: a.series,
      };
    });
  }, [answers, nickname]);

  const gameMessages = messages.filter(
    m => m.target.startsWith('guessr') && m.content
  );
  useEffect(() => {
    const startIdx = findLastIndex(
      gameMessages,
      m => m.target === 'guessr:start'
    );
    if (startIdx >= 0) {
      const start = gameMessages[startIdx];
      const reveal = findLast(
        gameMessages.slice(startIdx),
        m => m.target === 'guessr:reveal'
      );
      if (reveal) {
        if (Date.now() - reveal.time < 10 * 60 * 1000) {
          setStep(3);
          setQuestion(start.content);
          setSeries([]);
          const answers = reveal.content.result.map(a => ({
            ...a,
            series: a.series.map((pt, i) => ({ ...pt, id: i.toString() })),
          }));
          setAnswers(answers);
        }
      } else {
        if (Date.now() - start.time < 10 * 60 * 1000) {
          setStep(1);
          setQuestion(start.content);
          setSeries([]);
          setAnswers([]);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMessages.length]);

  const handleForward = ev => {
    if (step === 0 || step === 3) {
      sendMessage({ action: 'guessr:start', data: { type: 'LineGraph' } });
      setQuestion(null);
      setSeries([]);
      setAnswers([]);
    } else if (step === 1) {
      setStep(2);
    } else if (step === 2 && allPointsDone) {
      sendMessage({ action: 'guessr:submit', data: { series } });
    }
  };

  if (!isConnected) return null;

  return (
    <div>
      <div
        className="relative mx-auto"
        style={{
          height: 'calc(min(40vh, 400px))',
          width: 'calc(min(100%, 540px))',
        }}
      >
        {step < 2 && (
          <div
            className="rounded-lg h-full p-2 text-white"
            style={{
              background: `linear-gradient(45deg, ${gradientColor1}, ${gradientColor2})`,
            }}
          >
            {step === 0 && (
              <>
                <h3>Press the button to begin</h3>
              </>
            )}
            {step === 1 && (
              <>
                <h3>{question.title}</h3>
                <span>{question.subtitle}</span>
              </>
            )}
          </div>
        )}
        {step >= 2 && (
          <LineGraphContainer
            keys={keys}
            rangeMin={-100}
            rangeMax={100}
            series={series}
            setSeries={setSeries}
            referenceData={referenceData}
          />
        )}
        <div className="absolute right-0" style={{ top: 'calc(100% - 32px)' }}>
          <button
            className="bg-gray-900 hover:bg-accent text-white p-1 m-1 rounded"
            onClick={handleForward}
          >
            <FastForward size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuessMachine;
