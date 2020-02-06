import React, { useReducer, useEffect } from 'react';
import { ArrowLeft } from 'react-feather';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { takeRightWhile, times, throttle } from 'lodash';
import TodoRow from './todoRow';
import { parseFileCommand, parseLineCommand } from './commandParser';
import { useContextGateway } from './gatewayProvider';

/**
 * All schemas must create empty rows as arrays, starting with the numeric string `id`,
 * and containing the field values in the other elements.
 */
const schemas = [
  {
    name: 'todo',
    version: 1,
    columns: [{ label: 'Item' }, { label: 'Date' }],
    emptyRow: function(id) {
      return [id.toString(), '', ''];
    },
    isValidRow: function(row) {
      return row.length === 3 && Number.isInteger(parseInt(row[0], 10));
    },
  },
  {
    name: 'albums',
    version: 1,
    columns: [{ label: 'Artist' }, { label: 'Album' }],
    emptyRow: function(id) {
      return [id.toString(), '', ''];
    },
    isValidRow: function(row) {
      return row.length === 3 && Number.isInteger(parseInt(row[0], 10));
    },
  },
];

function getNextId(array, start) {
  return array.reduce((acc, cur) => {
    return Math.max(acc, parseInt(cur[0], 10) + 1);
  }, start);
}

function mergeRow(other, current) {
  if (current.length === other.length) {
    return current.slice();
  }
  if (current.length > other.length) {
    return current.slice(0, other.length);
  }
  return [...current.slice(), ...other.slice(current.length)];
}

function insertRows(array, index, toInsert) {
  const nextValues = array.slice();
  const endOfArray = nextValues.splice(index);
  nextValues.push(...toInsert);
  nextValues.push(...endOfArray);
  return nextValues;
}

function moveRows(array, srcStart, srcEnd, dstStart) {
  const nextValues = array.slice();
  const toMove = nextValues.splice(srcStart, srcEnd - srcStart);
  if (dstStart >= 0) {
    nextValues.splice(dstStart, 0, ...toMove);
  }
  return nextValues;
}

function delRows(array, start, end) {
  return moveRows(array, start, end, -1);
}

function reducer(state, action) {
  if (action.values && !action.valuesHistory) {
    action.valuesHistory = state.valuesHistory.slice();
    const tuple = [Date.now(), state.values.slice()];
    const prevTime = action.valuesHistory.length
      ? action.valuesHistory[action.valuesHistory.length - 1][0]
      : 0;
    if (tuple[0] - prevTime > 500) {
      action.valuesHistory.push(tuple);
      if (action.valuesHistory.length > 20) action.valuesHistory.splice(0, 10);
    }
  }
  return {
    ...state,
    ...action,
  };
}

function TodoTable({ name, status, handleBack, handleName }) {
  const [state, dispatch] = useReducer(reducer, {
    command: '',
    schema: null,
    values: null,
    valuesHistory: [],
    nextId: 0,
  });
  const { load, save } = useContextGateway();

  useEffect(() => {
    if (status === 'unnamed') {
      dispatch({
        schema: schemas[0],
        values: insertRows([], 0, times(50, schemas[0].emptyRow)),
        valuesHistory: [],
        nextId: 50,
      });
    }
    if (status !== 'saved') return;
    let ignore = false;

    load(name).then(json => {
      if (ignore) return;
      if (!json.success) {
        return handleBack();
      } else {
        const { schema: savedSchema, values } = json.data;
        const schema = schemas.find(e => e.name === savedSchema.name);
        if (Array.isArray(values) && values.every(schema.isValidRow)) {
          dispatch({
            schema,
            valuesHistory: [],
            values,
            nextId: getNextId(values, 0),
          });
        } else {
          handleBack();
        }
      }
    });

    return () => {
      ignore = true;
    };
  }, [handleBack, name, load, status]);

  useEffect(() => {
    let ignore = false;
    if (status !== 'unnamed' && state.schema && state.values) {
      save(name, {
        data: {
          schema: {
            name: state.schema.name,
            version: state.schema.version,
          },
          values: state.values,
        },
      }).then(res => {
        if (!ignore && res && res.success) {
          console.log('Saved');
        }
      });
    }

    return () => {
      ignore = true;
    };
  }, [name, save, state.schema, state.values, status]);

  const handleChange = (rowIndex, colIndex, val) => {
    const nextValues = state.values.slice();
    nextValues[rowIndex] = nextValues[rowIndex].slice();
    nextValues[rowIndex][colIndex + 1] = val;
    dispatch({ values: nextValues });
  };

  const onDragEnd = result => {
    if (result.destination != null) {
      const src = result.source.index;
      const dst = result.destination.index;
      if (src !== dst) {
        const nextValues = state.values.slice();
        const [moved] = nextValues.splice(src, 1);
        nextValues.splice(dst, 0, moved);
        dispatch({ values: nextValues });
      }
    }
  };

  const handleCmdlineKey = ev => {
    if (ev.key === 'z' && ev.ctrlKey) {
      ev.preventDefault();
      handleUndo();
    } else if (ev.key === 'Enter') handleCmd(state.command);
  };

  const handleUndo = () => {
    const past = state.valuesHistory.pop();
    if (past) {
      dispatch({
        values: past[1],
        valuesHistory: state.valuesHistory,
      });
    }
  };

  const handleCmd = cmd => {
    try {
      if (cmd === ':u') {
        return handleUndo();
      }

      const fileCmd = parseFileCommand(cmd);
      if (fileCmd) {
        if (fileCmd.error) {
          return;
        }
        if (fileCmd.command === 'w') {
          if (status === 'unnamed') {
            save(
              fileCmd.args[0],
              {
                data: {
                  schema: {
                    name: state.schema.name,
                    version: state.schema.version,
                  },
                  values: state.values,
                },
              },
              0
            ).then(res => {
              if (res && res.success) handleName(fileCmd.args[0]);
            });
          }
        } else if (fileCmd.command === 'schema') {
          const reqSchema = schemas.find(e => e.name === fileCmd.args[0]);
          if (reqSchema) {
            const emptyRow = reqSchema.emptyRow(0);
            dispatch({
              schema: reqSchema,
              values: state.values.map(e => mergeRow(emptyRow, e)),
            });
          }
        }
        return;
      }

      const trailingEmptyLines = takeRightWhile(
        state.values,
        e => '' === e.slice(1).join('')
      ).length;
      const lineCmd = parseLineCommand(cmd, {
        lastLine: state.values.length - Math.max(0, trailingEmptyLines - 1),
      });
      if (lineCmd) {
        if (lineCmd.error) {
          return;
        }
        if (lineCmd.command === 'i') {
          const count = lineCmd.args[0];
          dispatch({
            values: insertRows(
              state.values,
              lineCmd.range.start - 1,
              times(count, n => state.schema.emptyRow(state.nextId + n))
            ),
            nextId: state.nextId + count,
          });
        } else if (lineCmd.command === 'm') {
          dispatch({
            values: moveRows(
              state.values,
              lineCmd.range.start - 1,
              lineCmd.range.end,
              lineCmd.args[0] - 1
            ),
          });
        } else if (lineCmd.command === 'd') {
          dispatch({
            values: delRows(
              state.values,
              lineCmd.range.start - 1,
              lineCmd.range.end
            ),
          });
        }
      }
    } finally {
      dispatch({ command: '' });
    }
  };

  if (!state.schema || !state.values) {
    return <div></div>;
  }
  const maxDigits = 1 + Math.floor(Math.log10(state.values.length));
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex items-center mb-3">
        <button
          className="hover:bg-paper-darker text-accent p-1 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="stroke-current" />
        </button>
        <input
          className="p-2 font-mono text-sm flex-grow text-white ml-3"
          style={{ backgroundColor: 'var(--dark-color-paper-darker)' }}
          value={state.command}
          onChange={ev => dispatch({ command: ev.target.value })}
          onKeyDown={handleCmdlineKey}
        ></input>
      </div>
      <Droppable droppableId="main">
        {provided => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {state.values.map((e, rowIndex) => (
              <TodoRow
                key={e[0]}
                id={e[0]}
                index={rowIndex}
                columns={state.schema.columns}
                numWidth={maxDigits * 10}
                values={e}
                handleChange={(colIndex, val) =>
                  handleChange(rowIndex, colIndex, val)
                }
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

TodoTable.propTypes = {
  name: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['unnamed', 'unsaved', 'saved']).isRequired,
  handleBack: PropTypes.func.isRequired,
  handleName: PropTypes.func.isRequired,
};

export default TodoTable;
