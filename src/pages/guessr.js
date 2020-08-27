import React, { useState } from 'react';
import LineGraphContainer from '../components/guessr/lineGraphContainer';

import '../css/styles.css';

export function CircleButton({ onClick, active, disabled, children }) {
  let classes = 'bg-paper-darker hover:bg-paper-dark';
  if (disabled) classes = 'bg-paper-darker pointer-events-none text-pen-light';
  else if (active) classes = 'bg-accent';
  return (
    <button className={`rounded-full w-auto h-7 ${classes}`} onClick={onClick}>
      {children}
    </button>
  );
}

export const FlagImage = ({ code, name }) => (
  <div className="mw-8 h-12 flex flex-col items-center justify-between">
    <img
      style={{ width: '2rem' }}
      alt={name}
      src={`https://cdn.staticaly.com/gh/hjnilsson/country-flags/master/png250px/${code.toLowerCase()}.png`}
    ></img>
    <label className="block text-sm">{name}</label>
  </div>
);

export function RankGrid({ rows, columns }) {
  const theRows = rows || columns.map((_, i) => i + 1);
  const theCells = theRows.flatMap((r, i) =>
    columns.map(col => ({
      column: col,
      rowIndex: i,
      value: r,
    }))
  );

  const [selections, setSelections] = useState(theRows.map(() => null));
  const handleClick = cell => {
    setSelections(
      selections.map((prev, i) => {
        if (i === cell.rowIndex) return prev ? null : cell.column;
        else if (prev === cell.column) return null;
        else return prev;
      })
    );
  };
  return (
    <div
      style={{
        display: 'grid',
        gridGap: '1rem',
        gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
      }}
    >
      {theCells.map((cell, i) => (
        <CircleButton
          key={i.toString()}
          active={selections[cell.rowIndex] === cell.column}
          disabled={
            selections[cell.rowIndex] !== null &&
            selections[cell.rowIndex] !== cell.column
          }
          onClick={() => handleClick(cell)}
        >
          {cell.value}
        </CircleButton>
      ))}
      {columns.map((col, i) =>
        typeof col === 'string' ? (
          <span key={`column-${i}`} className="text-center">
            {col}
          </span>
        ) : (
          <React.Fragment key={`column-${i}`}>{col.render()}</React.Fragment>
        )
      )}
    </div>
  );
}

export default function GuessrPage() {
  const ordinalKeys = ['Northeastern', '1975', '1990', '2005', '2020'];
  return (
    <div className="container px-5 mx-auto pt-6">
      <div className="flex flex-wrap -m-4">
        <div className="flex-1 m-4" style={{ minWidth: 240, maxWidth: 360 }}>
          <RankGrid
            columns={[
              {
                value: 'USA',
                render: () => <FlagImage name="USA" code="US" />,
              },
              {
                value: 'CHN',
                render: () => <FlagImage name="China" code="CN" />,
              },
              {
                value: 'RUS',
                render: () => <FlagImage name="Russia" code="RU" />,
              },
              {
                value: 'JP',
                render: () => <FlagImage name="Japan" code="JP" />,
              },
            ]}
          />
        </div>
        <div
          className="flex-1 m-4"
          style={{
            height: 'calc(min(50vh, 400px))',
            minWidth: 'calc(min(92%, 400px))',
          }}
        >
          <LineGraphContainer
            keys={ordinalKeys}
            rangeMin={0}
            rangeMax={1}
            referenceData={[
              {
                name: 'Source',
                showTooltip: true,
                stroke: '#62ea86',
                fill: '#62ea86',
                series: ordinalKeys.map((x, i) => ({
                  id: `source${i}`,
                  x,
                  y: Math.random(),
                })),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
