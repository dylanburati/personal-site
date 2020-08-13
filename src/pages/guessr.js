import React, { useState, useMemo, useReducer, useRef, useEffect } from 'react';
import { curveLinear } from '@vx/curve';
import { ParentSize } from '@vx/responsive';
import { Group } from '@vx/group';
import { Grid } from '@vx/grid';
import { LinePath } from '@vx/shape';
import { AxisBottom, AxisLeft } from '@vx/axis';
import { scaleLinear, scaleBand } from '@vx/scale';
import { LinearGradient } from '@vx/gradient';
import { Drag } from '@vx/drag';
import { Tooltip, defaultStyles, useTooltip } from '@vx/tooltip';
import { clamp, partition, takeWhile } from 'lodash';
import { NodeGroup } from 'react-move';

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

export const LineGraphContainer = props => {
  const [series, setSeries] = useState([]);
  const allPointsDone = series.length === props.keys.length;
  const { referenceData, ...restProps } = props;

  return (
    <ParentSize className="touch-action-none">
      {parent => (
        <LineGraph
          width={parent.width}
          height={parent.height}
          series={series}
          setSeries={setSeries}
          referenceData={allPointsDone ? referenceData : []}
          {...restProps}
        />
      )}
    </ParentSize>
  );
};

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

const useHoverStates = ({ keyAccessor }) => {
  const [hoveringItems, setHoveringItems] = useStateNoCmp(new Set());
  return {
    handleMouseEnter: d => ev => {
      setHoveringItems(hoveringItems.add(keyAccessor(d)));
    },
    handleMouseLeave: d => ev => {
      if (hoveringItems.delete(keyAccessor(d))) setHoveringItems(hoveringItems);
    },
    getHoverState: d => hoveringItems.has(keyAccessor(d)),
    clearHoverStates: () => {
      if (hoveringItems.size) setHoveringItems(new Set());
    },
  };
};

export const GridAndAxes = ({ top, left, width, height, xScale, yScale }) => (
  <Group top={top} left={left}>
    <Grid
      xScale={xScale}
      yScale={yScale}
      width={width}
      height={height}
      stroke="rgba(255,255,255,0.2)"
      xOffset={xScale.bandwidth() / 2}
    />
    <AxisBottom
      top={height}
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
      scale={yScale}
      // tickFormat={formatDate}
      stroke="#ffffff"
      hideTicks
      numTicks={Math.round(height / 35)}
      tickLabelProps={() => ({
        fill: '#ffffff',
        fontSize: 14,
        textAnchor: 'end',
        dy: '0.33em',
        className: 'select-none',
      })}
    />
  </Group>
);

const pointRadius = 5;
/**
 * @param {import('@vx/drag/lib/Drag').DragProps & { enabled: boolean }} param0 props
 */
export const DragContainer = ({
  enabled,
  width,
  height,
  onDragStart,
  onDragEnd,
  children,
}) => {
  if (!enabled) {
    return (
      <>
        {children({
          dragStart: () => {},
          dragEnd: () => {},
          dragMove: () => {},
          isDragging: false,
          dx: 0,
          dy: 0,
        })}
      </>
    );
  }

  return (
    <Drag
      resetOnStart
      width={width}
      height={height}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {children}
    </Drag>
  );
};

export const LineSeries = ({
  top,
  left,
  width,
  height,
  opacity,
  xScale,
  yScale,
  stroke,
  fill,
  name,
  series,
  setSeries,
  getX,
  getY,
  xOffset = 0,
  yOffset = 0,
  enableDrag = false,
  shouldShowPoints = true,
  shouldShowTooltip = false,
  tooltip = {},
}) => {
  const {
    handleMouseEnter,
    handleMouseLeave,
    getHoverState,
    clearHoverStates,
  } = useHoverStates({
    keyAccessor: d => d.id,
  });
  const { tooltipTimeout, hideTooltip, showTooltip } = tooltip;
  const [dragData, setDragData] = useStateNoCmp(new Map());
  useEffect(() => {
    if (!enableDrag && dragData.size) setDragData(new Map());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableDrag]);
  const keys = xScale.domain();
  const keyToXIndex = useMemo(() => new Map(keys.map((k, idx) => [k, idx])), [
    keys,
  ]);
  const diff = ([v1, v2]) => v2 - v1;
  const yScaleFactor = diff(yScale.range()) / diff(yScale.domain());

  const scaleInvert = ({ x, y }) => {
    const gridX = x - left;
    const rangeX =
      gridX - xScale.paddingOuter() * xScale.step() - 0.5 * xScale.bandwidth();
    const rangeY = y - top;
    const index = Math.round(rangeX / xScale.step());
    return {
      xIndex: index,
      x: index >= 0 && index < keys.length ? keys[index] : undefined,
      y: yScale.invert(rangeY),
    };
  };
  const getMouseDistance = ({ d, x, y }) => {
    const gridX = x - left;
    const gridY = y - top;
    const xdist = xScale(getX(d)) + xOffset - gridX;
    const ydist = yScale(getY(d)) + yOffset - gridY;
    return { xdist, ydist };
  };

  const [newPoints, establishedPoints] = partition(
    shouldShowPoints ? series : [],
    d => (dragData.get(d.id) || {}).isNew
  );
  const getDragYOffset = d => (dragData.get(d.id) || { dy: 0 }).dy;
  return (
    <Group top={top} left={left} opacity={opacity}>
      <DragContainer
        top={top}
        left={left}
        width={width}
        height={height}
        enabled={enableDrag}
        onDragStart={({ x, y }) => {
          const location = scaleInvert({ x, y });
          if (location.x === undefined) return;

          const before = takeWhile(
            series,
            e => keyToXIndex.get(e.x) < location.xIndex
          );
          let point =
            before.length < series.length ? series[before.length] : null;
          if (!point || point.x !== location.x) {
            const d = {
              id: location.xIndex.toString(),
              x: location.x,
              y: location.y,
            };
            setDragData(dragData.set(d.id, { isNew: true, dy: 0 }));
            setSeries([...before, d, ...series.slice(before.length)]);
          } else {
            const { xdist, ydist } = getMouseDistance({ d: point, x, y });
            if (xdist * xdist + Math.min(24, ydist * ydist) <= 49) {
              point.y = location.y;
              setDragData(dragData.set(point.id, { dy: 0 }));
              setSeries([...series]);
            }
          }
        }}
        onDragEnd={({ dx, dy }) => {
          const delta = dy / yScaleFactor;
          const [min, max] = yScale.domain();
          const dragPoints = series.filter(d => dragData.has(d.id));
          dragPoints.forEach(d => {
            d.y = clamp(d.y + delta, min, max);
            dragData.delete(d.id);
          });
          setSeries([...series]);
          setDragData(dragData);
        }}
      >
        {({ dragStart, dragEnd, dragMove, isDragging, dx, dy }) => {
          if (isDragging) {
            let someChanged = false;
            dragData.forEach((prev, k) => {
              if (prev.dy !== dy) {
                someChanged = true;
                dragData.set(k, { ...prev, dy });
              }
            });
            if (someChanged) setDragData(dragData);
          }
          return (
            <>
              <LinePath
                curve={curveLinear}
                data={series}
                x={d => xScale(getX(d)) + xOffset}
                y={d => yScale(getY(d)) + yOffset + getDragYOffset(d)}
                stroke={stroke}
                strokeWidth={1.5}
                shapeRendering="geometricPrecision"
              />
              {newPoints.map((d, i) => (
                <circle
                  key={`dragging-${i}`}
                  r={pointRadius}
                  cx={xScale(getX(d)) + xOffset}
                  cy={yScale(getY(d)) + yOffset}
                  transform={`translate(0, ${dy})`}
                  stroke={stroke}
                  fill={fill}
                />
              ))}
              {enableDrag && (
                <rect
                  width={width + 2 * pointRadius}
                  height={height + 2 * pointRadius}
                  transform={`translate(${-pointRadius}, ${-pointRadius})`}
                  fill="transparent"
                  onMouseDown={dragStart}
                  onMouseMove={dragMove}
                  onMouseUp={dragEnd}
                  onMouseLeave={ev => {
                    dragEnd(ev);
                    clearHoverStates();
                  }}
                  onTouchStart={dragStart}
                  onTouchMove={dragMove}
                  onTouchEnd={ev => {
                    dragEnd(ev);
                    clearHoverStates();
                  }}
                />
              )}
              {establishedPoints.map((d, i) => (
                <circle
                  key={i}
                  r={pointRadius}
                  cx={xScale(getX(d)) + xOffset}
                  cy={yScale(getY(d)) + yOffset}
                  transform={
                    dragData.has(d.id) ? `translate(0, ${dy})` : undefined
                  }
                  onMouseDown={dragStart}
                  onMouseUp={dragEnd}
                  onMouseEnter={handleMouseEnter(d)}
                  onMouseMove={ev => {
                    dragMove(ev);
                    if (!shouldShowTooltip) return;
                    if (tooltipTimeout && tooltipTimeout.current) {
                      clearTimeout(tooltipTimeout.current);
                      tooltipTimeout.current = null;
                    }
                    showTooltip({
                      tooltipLeft: xScale(getX(d)) + xOffset,
                      tooltipTop: yScale(getY(d)) + yOffset + 24,
                      tooltipData: {
                        name,
                        stroke,
                        fill,
                        point: d,
                      },
                    });
                  }}
                  onMouseLeave={ev => {
                    handleMouseLeave(d)(ev);
                    if (tooltipTimeout) {
                      tooltipTimeout.current = window.setTimeout(() => {
                        hideTooltip();
                      }, 300);
                    }
                  }}
                  onTouchStart={dragStart}
                  onTouchMove={dragMove}
                  onTouchEnd={dragEnd}
                  onFocus={ev => {
                    if (!shouldShowTooltip) return;
                    if (tooltipTimeout && tooltipTimeout.current) {
                      clearTimeout(tooltipTimeout.current);
                      tooltipTimeout.current = null;
                    }
                    showTooltip({
                      tooltipLeft: xScale(getX(d)) + xOffset,
                      tooltipTop: yScale(getY(d)) + yOffset + 24,
                      tooltipData: {
                        name,
                        stroke,
                        fill,
                        point: d,
                      },
                    });
                  }}
                  onBlur={ev => {
                    if (shouldShowTooltip) {
                      tooltipTimeout.current = window.setTimeout(() => {
                        hideTooltip();
                      }, 0);
                    }
                  }}
                  stroke={stroke}
                  strokeOpacity={
                    dragData.has(d.id) || getHoverState(d) ? 1 : 0.7
                  }
                  fill={fill}
                  fillOpacity={
                    dragData.has(d.id) ? 1 : getHoverState(d) ? 0.4 : 0.1
                  }
                />
              ))}
            </>
          );
        }}
      </DragContainer>
    </Group>
  );
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
  series,
  setSeries,
}) {
  const tooltipHookReturn = useTooltip();
  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
  } = tooltipHookReturn;
  const tooltipTimeout = useRef(null);
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
  const xMax = width - marginRight - marginLeft;
  xScale.range([0, xMax]);
  const yMax = height - marginBottom - marginTop;
  yScale.range([yMax, 0]);

  if (height < 10) return null;

  const getX = d => d.x;
  const getY = d => d.y;

  return (
    <div className="relative">
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
        <GridAndAxes
          top={marginTop}
          left={marginLeft}
          width={xMax}
          height={yMax}
          xScale={xScale}
          yScale={yScale}
        />
        <LineSeries
          name="Editable"
          top={marginTop}
          left={marginLeft}
          width={xMax}
          height={yMax}
          xScale={xScale}
          yScale={yScale}
          getX={getX}
          getY={getY}
          xOffset={xScale.bandwidth() / 2}
          stroke="white"
          fill="white"
          series={series}
          setSeries={setSeries}
          enableDrag={!referenceData.length}
        />
        <NodeGroup
          data={referenceData}
          keyAccessor={e => e.name}
          start={() => ({ opacity: 0 })}
          enter={() => ({ opacity: [1], timing: { duration: 500 } })}
        >
          {nodes => (
            <>
              {nodes.map(({ key, data, state }) => (
                <LineSeries
                  key={`reference-${key}`}
                  name={data.name}
                  opacity={state.opacity}
                  top={marginTop}
                  left={marginLeft}
                  width={xMax}
                  height={yMax}
                  xScale={xScale}
                  yScale={yScale}
                  getX={getX}
                  getY={getY}
                  xOffset={xScale.bandwidth() / 2}
                  stroke={data.stroke}
                  fill={data.fill}
                  series={data.series}
                  shouldShowTooltip={data.showTooltip}
                  tooltip={{ ...tooltipHookReturn, tooltipTimeout }}
                />
              ))}
            </>
          )}
        </NodeGroup>
      </svg>
      {tooltipOpen && tooltipData && (
        <Tooltip
          top={tooltipTop}
          left={tooltipLeft}
          className="bg-paper"
          style={{
            ...defaultStyles,
            backgroundColor: 'var(--dark-color-paper)',
            color: 'var(--dark-color-pen)',
            minWidth: 60,
            lineHeight: 1.5,
          }}
        >
          <div>
            <strong
              style={{
                color: tooltipData.fill || 'inherit',
              }}
            >
              {tooltipData.name}:
            </strong>{' '}
            {Math.round(tooltipData.point.y * 1000) / 1000}
          </div>
        </Tooltip>
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
