import React from 'react';
import { ArrowLeft } from 'react-feather';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { throttle } from 'lodash';
import TodoRow from './todoRow';

function getNextId(array, start) {
  return array.reduce((acc, cur) => {
    return Math.max(acc, parseInt(cur[0], 10) + 1);
  }, start);
}

class TodoTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      command: '',
      values: null,
      nextId: 0,
    };
    this.handleChange = this.handleChange.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
    this.setNextValues = this.setNextValues.bind(this);
    this.saveValues = throttle(this.saveValues, 2000, { leading: false }).bind(
      this
    );
    this.doCommand = this.doCommand.bind(this);
  }

  componentDidMount() {
    this.setInitialValues();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.sheet.name !== this.props.sheet.name) {
      if (this.props.sheet.status === 'saved') {
        this.setState({
          values: null,
        });
        this.setInitialValues();
      } else if (this.props.sheet.status === 'unsaved') {
        this.saveValues();
      }
    }
  }

  async setInitialValues() {
    if (this.props.sheet.status === 'saved') {
      const json = await this.props.load(this.props.sheet.name);
      if (!json.success) {
        if (json.message && json.message.startsWith('Network error')) {
          setTimeout(() => {
            if (this.state.values === null) this.setInitialValues();
          }, 4000);
        } else {
          this.props.handleBack();
        }
        return;
      }

      const values = json.data ? json.data.values : null;
      if (
        Array.isArray(values) &&
        values.every(this.props.sheet.schema.isValidRow)
      ) {
        this.setState({
          values,
          nextId: getNextId(values, this.state.nextId),
        });
        return;
      }
    }

    const numRows = this.props.sheet.schema.numRows || 50;
    this.setState({
      values: this.insertRows([], 0, numRows),
      nextId: numRows,
    });
  }

  handleChange(rowIndex, colIndex, val) {
    const nextValues = this.state.values.slice();
    nextValues[rowIndex] = nextValues[rowIndex].slice();
    nextValues[rowIndex][colIndex + 1] = val;
    this.setNextValues(nextValues);
  }

  onDragEnd(result, provided) {
    if (result.destination != null) {
      const src = result.source.index;
      const dst = result.destination.index;
      if (src !== dst) {
        const nextValues = this.state.values.slice();
        const [moved] = nextValues.splice(src, 1);
        nextValues.splice(dst, 0, moved);
        this.setNextValues(nextValues);
      }
    }
  }

  insertRows(array, index, count) {
    const nextValues = array.slice();
    const endOfArray = nextValues.splice(index);
    const emptyRows = new Array(count)
      .fill(getNextId(array, 0))
      .map((id, j) => this.props.sheet.schema.emptyRow(id + j));
    nextValues.push(...emptyRows);
    nextValues.push(...endOfArray);
    return nextValues;
  }

  setNextValues(nextValues) {
    this.setState({
      values: nextValues,
    });
    this.saveValues();
  }

  saveValues() {
    if (this.props.sheet.status !== 'unnamed') {
      // Sheet has name
      this.props
        .save(this.props.sheet.name, {
          data: {
            schema: {
              columns: this.props.sheet.schema.columns,
              version: this.props.sheet.schema.version,
            },
            values: this.state.values,
          },
        })
        .then(res => {
          if (res && res.success) {
            console.log('Saved');
          }
        });
    }
  }

  doCommand(ev) {
    if (ev.key === 'Enter') {
      const cmd = this.state.command;
      this.setState({ command: '' });

      if (cmd.startsWith(':w ') && this.props.sheet.status === 'unnamed') {
        const name = this.state.command.substring(3);
        if (name.length >= 2 && name.length <= 64) {
          this.props.handleName(name);
        }
      }
    }
  }

  render() {
    const values = this.state.values !== null ? this.state.values : [];
    const maxDigits = 1 + Math.floor(Math.log10(values.length));
    return (
      <DragDropContext onDragEnd={this.onDragEnd}>
        <div className="flex items-center mb-3">
          <button
            className="hover:bg-paper-darker text-accent p-1 rounded-full"
            onClick={this.props.handleBack}
          >
            <ArrowLeft className="stroke-current" />
          </button>
          <input
            className="p-2 font-mono text-sm flex-grow text-white ml-3"
            style={{ backgroundColor: 'var(--dark-color-paper-darker)' }}
            value={this.state.command}
            onChange={ev => this.setState({ command: ev.target.value })}
            onKeyDown={this.doCommand}
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
                  columns={this.props.sheet.schema.columns}
                  numWidth={maxDigits * 10}
                  values={e}
                  handleChange={(colIndex, val) =>
                    this.handleChange(rowIndex, colIndex, val)
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
}

TodoTable.propTypes = {
  sheet: PropTypes.shape({
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['unnamed', 'unsaved', 'saved']),
    schema: PropTypes.shape({
      columns: PropTypes.array.isRequired,
      version: PropTypes.number.isRequired,
    }).isRequired,
  }),
  load: PropTypes.func.isRequired,
  save: PropTypes.func.isRequired,
  handleBack: PropTypes.func,
  handleName: PropTypes.func,
};

export default TodoTable;
