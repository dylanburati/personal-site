import React, { useState, useMemo, useReducer, useEffect } from 'react';
import * as allCurves from '@vx/curve';
import { ParentSize } from '@vx/responsive';
import { Group } from '@vx/group';
import { Grid } from '@vx/grid';
import { LinePath } from '@vx/shape';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { scaleLinear, scaleBand } from '@vx/scale';
import { LinearGradient } from '@vx/gradient';
import { Drag } from '@vx/drag';
import { clamp, partition, takeWhile } from 'lodash';

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

export const LineGraphContainer = props => (
  <ParentSize>
    {parent => (
      <LineGraph width={parent.width} height={parent.height} {...props} />
    )}
  </ParentSize>
);

// const lineCount = 10;
// const seriesLength = 7;
// const buildList = (len, gen) => new Array(len).fill(null).map(gen);
// const randomPoint = (_, i) => ({
//   x: i,
//   y: Math.floor(Math.random() * 100),
// });
// const series = buildList(lineCount, () => buildList(seriesLength, randomPoint));
// const getX = d => d.x;
// const getY = d => d.y;
// const allData = series.reduce((rec, d) => rec.concat(d), []);
export const gradientColor1 = '#ec4b5f';
export const gradientColor2 = '#b2305b';

/**
 * @template T
 * @param {T | (() => T)} init
 * @returns {[T, React.SetStateAction<T>]}
 */
const useStateNoCmp = init => {
  const [state, setState] = useState(init);
  const [, rerender] = useReducer(n => n + 1, 0);

  return [
    state,
    value => {
      setState(value);
      rerender();
    },
  ];
};

export function LineGraph({
  width,
  height,
  marginTop = 24,
  marginRight = 16,
  marginBottom = 40,
  marginLeft = 48,
  rangeMin = 0,
  rangeMax = 1,
  keys,
  referenceData = [],
}) {
  const [curveType, setCurveType] = useState('curveLinear');
  const [series, setSeries] = useState([]);

  // update scale output ranges
  const xScale = useMemo(
    () =>
      scaleBand({
        domain: keys,
        padding: 0.2,
      }),
    [keys]
  );
  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [rangeMin, rangeMax],
      }),
    [rangeMax, rangeMin]
  );
  const keyToXIndex = useMemo(() => new Map(keys.map((k, idx) => [k, idx])), [
    keys,
  ]);
  const [cancelDragEvent, setCancelDragEvent] = useState(null);
  const [dragData, setDragData] = useStateNoCmp(new Map());
  const [hoveringItems, setHoveringItems] = useStateNoCmp(new Set());
  const xMax = width - marginRight - marginLeft;
  xScale.range([0, xMax]);
  const yMax = height - marginBottom - marginTop;
  yScale.range([yMax, 0]);
  const diff = ([v1, v2]) => v2 - v1;
  const yScaleFactor = diff(yScale.range()) / diff(yScale.domain());

  useEffect(() => {
    if (cancelDragEvent) setCancelDragEvent(null);
  }, [cancelDragEvent]);

  if (height < 10) return null;

  const getX = d => d.x;
  const getY = d => d.y;
  const getYWithDragOffset = d => d.y + (dragData.get(d.id) || 0);

  const getBandCenterX = d => xScale(getX(d)) + xScale.bandwidth() / 2;

  const [dragPoints, nonDragPoints] = partition(series, d =>
    dragData.has(d.id)
  );
  return (
    <div className="vx-curves-demo">
      <svg width={width} height={height}>
        <LinearGradient
          id="sunbather"
          from={gradientColor1}
          to={gradientColor2}
          rotate="-45"
        />
        <rect
          width={width}
          height={height}
          fill="url(#sunbather)"
          rx={14}
          ry={14}
        />
        <Grid
          top={marginTop}
          left={marginLeft}
          xScale={xScale}
          yScale={yScale}
          width={xMax}
          height={yMax}
          stroke="rgba(255,255,255,0.2)"
          xOffset={xScale.bandwidth() / 2}
        />
        {referenceData.map((lineData, seriesIdx) => (
          <Group key={`lines-${seriesIdx}`} top={marginTop} left={marginLeft}>
            <LinePath
              curve={allCurves[curveType]}
              data={lineData}
              x={d => getBandCenterX(d)}
              y={d => yScale(getY(d))}
              stroke="#ffffff"
              strokeWidth={1.5}
              shapeRendering="geometricPrecision"
            />
          </Group>
        ))}
        <AxisBottom
          top={height - marginBottom}
          left={marginLeft}
          scale={xScale}
          // tickFormat={formatDate}
          stroke="#ffffff"
          tickStroke="rgba(255,255,255,0.5)"
          tickLabelProps={() => ({
            fill: '#ffffff',
            fontSize: 14,
            textAnchor: 'middle',
            className: 'select-none',
          })}
        />
        <AxisLeft
          top={marginTop}
          left={marginLeft}
          scale={yScale}
          // tickFormat={formatDate}
          stroke="#ffffff"
          hideTicks
          numTicks={Math.round(height / 35)}
          tickStroke="rgba(255,255,255,0.5)"
          tickLabelProps={() => ({
            fill: '#ffffff',
            fontSize: 14,
            textAnchor: 'end',
            dy: '0.33em',
            className: 'select-none',
          })}
        />
        <Group top={marginTop} left={marginLeft} width={xMax} height={yMax}>
          <LinePath
            curve={allCurves[curveType]}
            data={series}
            x={d => getBandCenterX(d)}
            y={d => yScale(getYWithDragOffset(d))}
            stroke="#ffffff"
            strokeWidth={1.5}
            shapeRendering="geometricPrecision"
          />
          <Drag
            resetOnStart
            width={xMax}
            height={yMax}
            onDragStart={({ x, y }) => {
              const gridX = x - marginLeft;
              const offsetX =
                gridX -
                xScale.paddingOuter() * xScale.step() -
                0.5 * xScale.bandwidth();
              const offsetY = y - marginTop;
              const index = Math.round(offsetX / xScale.step());
              if (index < 0 || index >= keys.length) {
                return;
              }

              const pointIdx = series.findIndex(d => d.x === keys[index]);
              if (pointIdx >= 0) {
                const d = series[pointIdx];
                const xdist = getBandCenterX(d) - gridX;
                const ydist = yScale(getY(d)) - offsetY;
                console.log(xdist, ydist);
                if (xdist * xdist + Math.min(24, ydist * ydist) <= 49) {
                  d.y = yScale.invert(offsetY);
                  setDragData(dragData.set(d.id, 0));
                  setSeries([...series]);
                }
              } else {
                const d = {
                  id: index.toString(),
                  x: keys[index],
                  y: yScale.invert(offsetY),
                };
                const before = takeWhile(
                  series,
                  e => keyToXIndex.get(e.x) < index
                );
                setDragData(dragData.set(d.id, 0));
                setSeries([...before, d, ...series.slice(before.length)]);
              }
            }}
            onDragEnd={({ dx, dy }) => {
              const delta = dy / yScaleFactor;
              const [min, max] = yScale.domain();
              dragPoints.forEach(d => {
                d.y = clamp(d.y + delta, min, max);
                dragData.delete(d.id);
              });
              setSeries([...series]);
              setDragData(dragData);
            }}
          >
            {({ dragStart, dragEnd, dragMove, isDragging, dx, dy }) => {
              const delta = dy / yScaleFactor;
              if (isDragging) {
                let someChanged = false;
                dragData.forEach((prevDelta, k) => {
                  if (prevDelta !== delta) {
                    someChanged = true;
                    dragData.set(k, delta);
                  }
                });
                if (someChanged) setDragData(dragData);

                // if (cancelDragEvent) dragEnd(cancelDragEvent);
              }
              return (
                <g>
                  {dragPoints.map((d, i) => (
                    <circle
                      key={i}
                      r={5}
                      stroke="white"
                      fill="white"
                      transform={`translate(0, ${dy})`}
                      cx={getBandCenterX(d)}
                      cy={yScale(getY(d))}
                    />
                  ))}
                  <rect
                    width={xMax + 10}
                    height={yMax + 10}
                    transform="translate(-5, -5)"
                    fill="transparent"
                    onMouseDown={dragStart}
                    onMouseMove={dragMove}
                    onMouseUp={dragEnd}
                    onMouseLeave={ev => {
                      dragEnd(ev);
                      if (hoveringItems.size) {
                        hoveringItems.clear();
                        setHoveringItems(hoveringItems);
                      }
                    }}
                    onTouchStart={dragStart}
                    onTouchMove={dragMove}
                    onTouchEnd={ev => {
                      dragEnd(ev);
                      if (hoveringItems.size) {
                        hoveringItems.clear();
                        setHoveringItems(hoveringItems);
                      }
                    }}
                  />
                  {nonDragPoints.map((d, i) => (
                    <circle
                      key={i}
                      r={5}
                      cx={getBandCenterX(d)}
                      cy={yScale(getY(d))}
                      onMouseEnter={() =>
                        setHoveringItems(hoveringItems.add(d.id))
                      }
                      onMouseLeave={() => {
                        if (hoveringItems.delete(d.id))
                          setHoveringItems(hoveringItems);
                      }}
                      stroke={
                        hoveringItems.has(d.id)
                          ? 'rgba(255,255,255,0.8)'
                          : 'rgba(255,255,255,0.4)'
                      }
                      fill={
                        hoveringItems.has(d.id)
                          ? 'rgba(255,255,255,0.2)'
                          : 'transparent'
                      }
                      onMouseDown={dragStart}
                      onMouseMove={dragMove}
                      onMouseUp={dragEnd}
                      onTouchStart={dragStart}
                      onTouchMove={dragMove}
                      onTouchEnd={dragEnd}
                    />
                  ))}
                </g>
              );
            }}
          </Drag>
        </Group>
      </svg>
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
          className="flex-1 m-4 w-full sm:w-1/2"
          style={{ height: 'calc(min(50vh, 400px))' }}
        >
          <LineGraphContainer
            keys={ordinalKeys}
            rangeMin={0}
            rangeMax={1}
            referenceData={[
              ordinalKeys.map((x, i) => ({
                id: i.toString(),
                x,
                y: Math.random(),
              })),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
