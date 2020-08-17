import React, { useState, useContext, useMemo, useEffect } from 'react';
import { Check, FastForward } from 'react-feather';
import { findLast, findLastIndex } from 'lodash';
import { ChatContext } from './chatContext';
import { UserContext } from './userContext';
import LineGraphContainer, {
  gradientColor1,
  gradientColor2,
} from '../guessr/lineGraphContainer';

export const lineColors = ['#5fe984', '#67f8f0', '#3097f5', '#7b82fa'];

const GuessMachine = () => {
  const { user } = useContext(UserContext);
  const { isConnected, messages, roomUsers, sendMessage } = useContext(
    ChatContext
  );

  // 0 = waiting, 1 = title, 2 = graph, 3 = result
  const [step, setStep] = useState(0);
  const [question, setQuestion] = useState(null);
  const [series, setSeries] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [progress, setProgress] = useState(null);

  const keys = question ? question.data.map(e => e.key) : [];
  const allPointsDone = series.length && series.length === keys.length;

  const referenceData = useMemo(() => {
    return answers.map((a, i) => {
      const colorIdx = (answers.length - i - 1) % lineColors.length;
      const isSelf = a.userId === user.id;
      const responder = roomUsers[a.userId];
      const nick = responder ? responder.nickname : a.name;
      return {
        name: isSelf ? 'You' : nick,
        showTooltip: true,
        stroke: isSelf ? 'white' : lineColors[colorIdx],
        fill: isSelf ? 'white' : lineColors[colorIdx],
        series: a.series,
      };
    });
  }, [answers, roomUsers, user]);

  const gameMessages = messages.filter(m => m.target.startsWith('guessr'));
  useEffect(() => {
    const startIdx = findLastIndex(
      gameMessages,
      m => m.target === 'guessr:start'
    );
    if (startIdx >= 0) {
      const start = gameMessages[startIdx];
      const reveal = findLast(
        gameMessages.slice(startIdx),
        m => m.target === 'guessr:reveal' || m.target === 'guessr:cancel'
      );
      if (reveal) {
        if (reveal.target === 'guessr:cancel') {
          setStep(0);
          setQuestion(null);
          setProgress(null);
          setSeries([]);
          setAnswers([]);
        } else if (Date.now() - reveal.time < 10 * 60 * 1000) {
          setStep(3);
          setQuestion(start.content);
          setProgress(null);
          setSeries([]);
          const answers = reveal.content.result.map(a => ({
            ...a,
            series: a.series.map((pt, i) => ({ ...pt, id: i.toString() })),
          }));
          setAnswers(answers);
        }
      } else {
        const progress = findLast(
          gameMessages.slice(startIdx),
          m => m.target === 'guessr:progress'
        );
        if (progress) {
          setProgress(progress.content);
        } else {
          setProgress(null);
        }
        const nextQuestion = { id: start.id, ...start.content };
        if (!question || question.id !== nextQuestion.id) {
          setStep(1);
          setQuestion(nextQuestion);
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

  const Icon =
    progress && progress.submittedUserIds.includes(user.id)
      ? Check
      : FastForward;
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
            className="rounded-xl h-full p-2 text-white"
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
        <div className="absolute bottom-0 right-0 overflow-hidden flex items-center rounded-tl rounded-br-xl opacity-50 hover:opacity-100 bg-gray-900 text-white">
          {progress && (
            <span className="cursor-default text-sm px-2">{`${progress.progress} / ${progress.total}`}</span>
          )}
          <button
            className="hover:bg-accent"
            style={{ padding: '0.25rem 12px 0.25rem 8px' }}
            onClick={handleForward}
          >
            <Icon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuessMachine;
