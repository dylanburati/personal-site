import React, { useState, useMemo, useReducer, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
import { clamp, partition, takeWhile, zip } from 'lodash';
import { NodeGroup } from 'react-move';

export const gradientColor1 = '#ec4b5f';
export const gradientColor2 = '#b2305b';

/**
 * @template T
 * @param {T | (() => T)} init
 * @returns {[T, React.SetStateAction<T>]}
 */
export const useStateNoCmp = init => {
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
      stroke="#ffffff"
      tickStroke="rgba(255,255,255,0.5)"
      tickLabelProps={val => {
        const wordLengths = val.split(/\s/).map(e => e.length);
        const twoWordLengths = zip(
          wordLengths.slice(0, -1),
          wordLengths.slice(1)
        ).map(e => e.reduce((a, b) => a + b));
        const horizFactor = (clamp(Math.max(...wordLengths), 8, 16) - 8) / 40;
        const vertFactor =
          (clamp(1 + twoWordLengths.filter(n => n > 6).length, 3, 7) - 3) / 8;
        return {
          fill: '#ffffff',
          // scaleToFit: true,
          fontSize: 13 * (1 - horizFactor - vertFactor),
          width: xScale.step(),
          dy: '-0.3em',
          verticalAnchor: 'start',
          textAnchor: 'middle',
          className: 'select-none',
        };
      }}
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
  zRef,
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
        onDragStart={({ event, x, y }) => {
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
              setDragData(
                dragData.set(point.id, {
                  isNew:
                    !event.currentTarget ||
                    event.currentTarget.nodeName !== 'circle',
                  dy: 0,
                })
              );
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
              {zRef.current &&
                ReactDOM.createPortal(
                  <LinePath
                    curve={curveLinear}
                    data={series}
                    x={d => xScale(getX(d)) + xOffset}
                    y={d => yScale(getY(d)) + yOffset + getDragYOffset(d)}
                    stroke={stroke}
                    strokeWidth={1.5}
                    shapeRendering="geometricPrecision"
                  />,
                  zRef.current
                )}
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
                  focusable={shouldShowTooltip}
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
                      }, 800);
                    }
                  }}
                  onTouchStart={dragStart}
                  onTouchMove={dragMove}
                  onTouchEnd={dragEnd}
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
  marginBottom = 64,
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
  const zRef = useRef(null);

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
        <Group top={marginTop} left={marginLeft} innerRef={zRef} />
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
          zRef={zRef}
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
                  zRef={zRef}
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
          style={{
            ...defaultStyles,
            backgroundColor: 'var(--dark-color-paper)',
            color: 'var(--dark-color-pen)',
            minWidth: 60,
            width: 'max-content',
            lineHeight: 1.5,
            userSelect: 'none',
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
            {tooltipData.point.y.toFixed(
              3 - Math.round(Math.log10(rangeMax - rangeMin))
            )}
            {tooltipData.point.moreInfo && (
              <>
                <br />
                {tooltipData.point.moreInfo}
              </>
            )}
          </div>
        </Tooltip>
      )}
    </div>
  );
}

const LineGraphContainer = props => {
  return (
    <ParentSize className="touch-action-none">
      {parent => (
        <LineGraph width={parent.width} height={parent.height} {...props} />
      )}
    </ParentSize>
  );
};

export default LineGraphContainer;
