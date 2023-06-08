import React, {
  useReducer,
  useEffect,
  useCallback,
  useContext,
  useMemo,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'react-feather';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { findLastIndex, takeRightWhile, times } from 'lodash';
import TodoRow from './TodoRow';
import { parseCommand } from './commandParser';
import { ChatContext } from '../chat/ChatContext';
import { UserContext } from '../chat/UserContext';
import { useAsyncTask } from '../../hooks/useAsyncTask';
import { assertUnreachable } from '../../helpers/lang';

interface Schema {
  name: string;
  version: number;
  columns: {
    label: string;
  }[];
  emptyRow(id: number): any[];
  isValidRow(row: any[]): boolean;
}

/**
 * All schemas must create empty rows as arrays, starting with the numeric string `id`,
 * and containing the field values in the other elements.
 */
const schemas: Schema[] = [
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

function getNextId(array: any[], start: number): number {
  return array.reduce((acc, cur) => {
    return Math.max(acc, parseInt(cur[0], 10) + 1);
  }, start);
}

function mergeRow(other: any[], current: any[]): any[] {
  if (current.length === other.length) {
    return current.slice();
  }
  if (current.length > other.length) {
    return current.slice(0, other.length);
  }
  return [...current.slice(), ...other.slice(current.length)];
}

function insertRows<T>(array: T[], index: number, toInsert: T[]): T[] {
  const nextValues = array.slice();
  const endOfArray = nextValues.splice(index);
  nextValues.push(...toInsert);
  nextValues.push(...endOfArray);
  return nextValues;
}

function moveRows<T>(array: T[], srcStart: number, srcEnd: number, dstStart: number): T[] {
  const nextValues = array.slice();
  const toMove = nextValues.splice(srcStart, srcEnd - srcStart);
  if (dstStart >= 0) {
    nextValues.splice(dstStart, 0, ...toMove);
  }
  return nextValues;
}

function delRows<T>(array: T[], start: number, end: number): T[] {
  return moveRows(array, start, end, -1);
}

type ValuesTuple = [number, any[][]]

type TodoTableState = {
  command: string;
  editCounter: number;
  name: string | null;
  schema: Schema | null;
  values: any[][] | null;
  valuesHistory: ValuesTuple[];
  nextId: number;
  revisionNum?: number;
}

type TodoTableAction = {
  kind: 'LOAD';
  name?: string;
  revisionNum: number;
  schema: Schema;
  values: any[][];
  nextId: number;
} | {
  kind: 'SET_VALUES';
  values: any[][];
  nextId?: number;
} | {
  kind: 'SET_NAME';
  name: string;
} | {
  kind: 'SET_COMMAND';
  command: string;
} | {
  kind: 'SET_SCHEMA';
  schema: Schema;
  values: any[][];
} | {
  kind: 'UNDO'
}

function reducer(state: TodoTableState, action: TodoTableAction): TodoTableState {
  if (action.kind === 'LOAD') {
    const stateWithHistory = reducer(state, {
      kind: 'SET_VALUES',
      values: action.values,
      nextId: action.nextId,
    });
    return {
      ...stateWithHistory,
      name: action.name || state.name,
      editCounter: 0,
      revisionNum: action.revisionNum,
      schema: action.schema,
    };
  } else if (action.kind === 'SET_NAME') {
    return {
      ...state,
      editCounter: state.editCounter + 1,
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
      editCounter: state.editCounter + 1,
      schema: action.schema,
      values: action.values,
      valuesHistory: [],
    };
  } else if (action.kind === 'SET_VALUES') {
    const valuesHistory = state.valuesHistory.slice();
    if (state.values && state.values.length) {
      const tuple: [number, any[][]] = [Date.now(), state.values.slice()];
      const prevTime = valuesHistory.length
        ? valuesHistory[valuesHistory.length - 1][0]
        : 0;
      if (tuple[0] - prevTime > 500) {
        valuesHistory.push(tuple);
        if (valuesHistory.length > 20) valuesHistory.splice(0, 10);
      }
    }
    const nextId = action.nextId ? action.nextId : state.nextId;
    return {
      ...state,
      editCounter: state.editCounter + 1,
      values: action.values,
      valuesHistory,
      nextId,
    };
  } else if (action.kind === 'UNDO') {
    const past = state.valuesHistory.pop();
    if (past) {
      return {
        ...state,
        editCounter: state.editCounter + 1,
        values: past[1],
        valuesHistory: state.valuesHistory,
      };
    }
    return state;
  } else {
    throw new Error('Unsupported action type');
  }
}

export type TodoTableProps = {
  handleBack: () => void;
  handleName: (name: string) => void;
}

export const TodoTable: React.FC<TodoTableProps> = ({ handleBack, handleName }) => {
  const [queryParams] = useSearchParams();
  const sheetId = queryParams.get("id")!;

  const [state, dispatch] = useReducer(reducer, {
    command: '',
    editCounter: 0,
    name: null,
    schema: null,
    values: null,
    valuesHistory: [],
    nextId: 0,
  });
  const { authHttp, user } = useContext(UserContext);
  if (!authHttp || !user) {
    throw new Error("TodoTable must be loaded from a logged in context");
  }
  const { errors, isConnected, messages, sendMessage } = useContext(
    ChatContext
  );

  useEffect(() => {
    const unauth = errors.find(
      e => e.message && e.message.startsWith('Unauthenticated')
    );
    const invalid = errors.find(
      e => e.message && e.message.startsWith('Invalid conversation id')
    );
    if (unauth || invalid) {
      handleBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors]);

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
    const { schema, values, revisionNum } = state;
    if (sheetId && schema && values && revisionNum != null && state.editCounter) {
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
            revisionNum: revisionNum + 1,
            schema: {
              name: schema.name,
              version: schema.version,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, state.name, state.editCounter, sheetId]);

  const handleFirstSave = useAsyncTask(async (title, nickname) => {
    if (!authHttp) return; // todo guest

    const json = await authHttp.post('/g', {
      title,
      nickname,
      tags: ['todo'],
      isPrivate: true,
    });
    if (json.success) {
      dispatch({ kind: 'SET_NAME', name: title });
      handleName(json.conversationId);
    } else {
      console.error(json.message || 'Unknown error');
    }
  });

  const handleChange = (rowIndex, colIndex, val) => {
    if (state.values === null) {
      return;
    }
    const nextValues = state.values.slice();
    nextValues[rowIndex] = nextValues[rowIndex].slice();
    nextValues[rowIndex][colIndex + 1] = val;
    dispatch({ kind: 'SET_VALUES', values: nextValues });
  };

  const handleShare = useAsyncTask(async username => {
    if (!authHttp || !sheetId) return;

    const json = await authHttp.post('/g/share', {
      conversationId: sheetId,
      usernames: [username],
    });
    if (!json.success) {
      console.error(json.message || 'Unknown error');
    }
  });

  const onDragEnd = result => {
    if (state.values != null && result.destination != null) {
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
  const { schema, values } = state;

  const handleCmd = cmd => {
    try {
      if (cmd === ':u') {
        return handleUndo();
      }

      const lastLine = 1 + findLastIndex(
        state.values,
        row => row.slice(1).some(s => s.length > 1)
      );
      const command = parseCommand(cmd, { lastLine });
      if (command.command === false || schema == null || values == null) {
        return;
      }
      switch (command.command) {
        case 'w':
          if (!sheetId) {
            handleFirstSave.run(command.arg, user.username);
          }
          break;
        case 'schema':
          const reqSchema = schemas.find(e => e.name === command.arg);
          if (reqSchema) {
            const emptyRow = reqSchema.emptyRow(0);
            dispatch({
              kind: 'SET_SCHEMA',
              schema: reqSchema,
              values: (state.values || []).map(e => mergeRow(emptyRow, e)),
            });
          }
          break;
        case 'share':
          handleShare.run(command.arg);
          break;
        case 'i':
          dispatch({
            kind: 'SET_VALUES',
            values: insertRows(
              state.values || [],
              command.range.start - 1,
              times(command.arg, n => schema.emptyRow(state.nextId + n))
            ),
            nextId: (state.nextId ?? 0) + command.arg,
          });
          break;
        case 'm':
          dispatch({
            kind: 'SET_VALUES',
            values: moveRows(
              state.values || [],
              command.range.start - 1,
              command.range.end,
              command.arg
            ),
          });
          break;
        case 'd':
          dispatch({
            kind: 'SET_VALUES',
            values: delRows(
              state.values || [],
              command.range.start - 1,
              command.range.end
            ),
          });
          break;
        default:
          assertUnreachable(command);
      }
    } finally {
      dispatch({ kind: 'SET_COMMAND', command: '' });
    }
  };

  if (!schema || !values) {
    return <div></div>;
  }
  const maxDigits = 1 + Math.floor(Math.log10(values.length));
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
              {values.map((e, rowIndex) => (
                <TodoRow
                  key={e[0]}
                  id={e[0]}
                  index={rowIndex}
                  columns={schema.columns}
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
