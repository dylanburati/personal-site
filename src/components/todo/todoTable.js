import React, {
  useReducer,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { globalHistory } from '@reach/router';
import qs from 'querystring';
import { ArrowLeft } from 'react-feather';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { takeRightWhile, times } from 'lodash';
import TodoRow from './todoRow';
import { parseFileCommand, parseLineCommand } from './commandParser';
import { ChatContext } from '../chat/chatContext';
import { UserContext } from '../chat/userContext';
import { useAsyncTask } from '../../hooks/useAsyncTask';

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
  if (action.kind === 'LOAD') {
    return {
      ...state,
      name: action.name,
      revisionNum: action.revisionNum,
      schema: action.schema,
      values: action.values,
      nextId: action.nextId,
    };
  } else if (action.kind === 'SET_NAME') {
    return {
      ...state,
      name: action.name,
    };
  } else if (action.kind === 'SET_COMMAND') {
    return {
      ...state,
      command: action.command,
    };
  } else if (action.kind === 'SET_SCHEMA') {
    return {
      ...state,
      schema: action.schema,
      values: action.values,
      valuesHistory: [],
    };
  } else if (action.kind === 'SET_VALUES') {
    const valuesHistory = state.valuesHistory.slice();
    const tuple = [Date.now(), state.values.slice()];
    const prevTime = valuesHistory.length
      ? valuesHistory[valuesHistory.length - 1][0]
      : 0;
    if (tuple[0] - prevTime > 500) {
      valuesHistory.push(tuple);
      if (valuesHistory.length > 20) valuesHistory.splice(0, 10);
    }
    const nextId = action.nextId ? action.nextId : state.nextId;
    return {
      ...state,
      values: action.values,
      valuesHistory,
      nextId,
    };
  } else if (action.kind === 'UNDO') {
    const past = state.valuesHistory.pop();
    if (past) {
      return {
        ...state,
        values: past[1],
        valuesHistory: state.valuesHistory,
      };
    }
    return state;
  } else {
    throw new Error('Unsupported action type');
  }
}

function TodoTable({ handleBack, handleName }) {
  const { location } = globalHistory;
  const sheetId = useMemo(() => {
    const { id } = qs.parse(location.search.replace(/^\?/, ''));
    return id;
  }, [location.search]);

  const [state, dispatch] = useReducer(reducer, {
    command: '',
    name: null,
    schema: null,
    values: null,
    valuesHistory: [],
    nextId: 0,
  });
  const { authHttp, user } = useContext(UserContext);
  const { messages, sendMessage } = useContext(ChatContext);

  const snapshots = messages.filter(m => m.target === 'todo:save' && m.content);

  const handleLoad = useCallback(
    data => {
      const { schema: savedSchema, name, values, revisionNum } = data;
      const schema = schemas.find(e => e.name === savedSchema.name);
      if (!schema) {
        console.error(`Schema ${savedSchema.name} was deleted`);
        return;
      }
      if (Array.isArray(values) && values.every(schema.isValidRow)) {
        dispatch({
          kind: 'LOAD',
          name,
          revisionNum,
          schema,
          values,
          nextId: getNextId(values, 0),
        });
      } else {
        handleBack();
      }
    },
    [handleBack]
  );

  useEffect(() => {
    if (snapshots.length) {
      const toLoad = snapshots[snapshots.length - 1];
      handleLoad(toLoad.content);
      // TODO attempt merge with current values
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLoad, snapshots.length]);

  useEffect(() => {
    if (!sheetId) {
      dispatch({
        kind: 'LOAD',
        revisionNum: 1,
        schema: schemas[0],
        values: insertRows([], 0, times(50, schemas[0].emptyRow)),
        nextId: 50,
      });
    }
  }, [sheetId]);

  useEffect(() => {
    if (sheetId && state.schema && state.values) {
      let ignore = false;
      const run = async () => {
        await new Promise(resolve =>
          setTimeout(resolve, snapshots.length ? 2000 : 0)
        );
        if (ignore) return;
        sendMessage({
          action: 'todo:save',
          data: {
            name: state.name,
            revisionNum: state.revisionNum + 1,
            schema: {
              name: state.schema.name,
              version: state.schema.version,
            },
            values: state.values,
          },
        });
      };

      run();
      return () => {
        ignore = true;
      };
    }
    // Use state.valuesHistory to track when local changes are entered
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleLoad, state.name, state.valuesHistory, sheetId]);

  const handleFirstSave = useAsyncTask(async (title, nickname) => {
    if (!authHttp) return; // todo guest

    const json = await authHttp.post('/g', { title, nickname, tags: ['todo'] });
    if (json.success) {
      dispatch({ kind: 'SET_NAME', name: title });
      handleName(json.conversationId);
    } else {
      console.error(json.message || 'Unknown error');
    }
  });

  const handleChange = (rowIndex, colIndex, val) => {
    const nextValues = state.values.slice();
    nextValues[rowIndex] = nextValues[rowIndex].slice();
    nextValues[rowIndex][colIndex + 1] = val;
    dispatch({ kind: 'SET_VALUES', values: nextValues });
  };

  const onDragEnd = result => {
    if (result.destination != null) {
      const src = result.source.index;
      const dst = result.destination.index;
      if (src !== dst) {
        const nextValues = state.values.slice();
        const [moved] = nextValues.splice(src, 1);
        nextValues.splice(dst, 0, moved);
        dispatch({ kind: 'SET_VALUES', values: nextValues });
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
    dispatch({ kind: 'UNDO' });
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
          if (!sheetId) {
            handleFirstSave.run(fileCmd.args[0], user.username);
          }
        } else if (fileCmd.command === 'schema') {
          const reqSchema = schemas.find(e => e.name === fileCmd.args[0]);
          if (reqSchema) {
            const emptyRow = reqSchema.emptyRow(0);
            dispatch({
              kind: 'SET_SCHEMA',
              schema: reqSchema,
              values: state.values.map(e => mergeRow(emptyRow, e)),
            });
          }
        } else if (fileCmd.command === 'share') {
          // const username = fileCmd.args[0];
          // if (status === 'saved' && !name.includes('/')) {
          //   share(name, username);
          // }
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
            kind: 'SET_VALUES',
            values: insertRows(
              state.values,
              lineCmd.range.start - 1,
              times(count, n => state.schema.emptyRow(state.nextId + n))
            ),
            nextId: state.nextId + count,
          });
        } else if (lineCmd.command === 'm') {
          dispatch({
            kind: 'SET_VALUES',
            values: moveRows(
              state.values,
              lineCmd.range.start - 1,
              lineCmd.range.end,
              lineCmd.args[0] - 1
            ),
          });
        } else if (lineCmd.command === 'd') {
          dispatch({
            kind: 'SET_VALUES',
            values: delRows(
              state.values,
              lineCmd.range.start - 1,
              lineCmd.range.end
            ),
          });
        }
      }
    } finally {
      dispatch({ kind: 'SET_COMMAND', command: '' });
    }
  };

  if (!state.schema || !state.values) {
    return <div></div>;
  }
  const maxDigits = 1 + Math.floor(Math.log10(state.values.length));
  return (
    <div>
      <h2 className="mb-3">{state.name || 'New sheet'}</h2>
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
            onChange={ev =>
              dispatch({ kind: 'SET_COMMAND', command: ev.target.value })
            }
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
    </div>
  );
}

TodoTable.propTypes = {
  handleBack: PropTypes.func.isRequired,
  handleName: PropTypes.func.isRequired,
};

export default TodoTable;
