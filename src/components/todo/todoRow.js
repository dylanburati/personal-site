import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

class TodoRow extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.id !== this.props.id ||
      nextProps.index !== this.props.index ||
      nextProps.columns !== this.props.columns ||
      nextProps.numWidth !== this.props.numWidth ||
      nextProps.values !== this.props.values
    );
  }

  render() {
    return (
      <Draggable draggableId={this.props.id} index={this.props.index}>
        {provided => (
          <div
            className="flex items-stretch shadow-md-dark mb-2 bg-paper transition-linear-150"
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            tabIndex="-1"
            ref={provided.innerRef}
          >
            <span
              className="my-2 mx-3 flex-shrink-0"
              style={{ width: this.props.numWidth }}
            >
              {this.props.index + 1}
            </span>
            {this.props.columns.map((cell, index) => (
              <input
                type={cell.type || 'text'}
                className="flex-grow min-w-0 p-2 ml-1 bg-paper-darker hover:bg-paper-dark transition-linear-150"
                key={cell.label}
                onChange={ev => this.props.handleChange(index, ev.target.value)}
                value={this.props.values[index + 1]}
                placeholder={cell.label}
              />
            ))}
          </div>
        )}
      </Draggable>
    );
  }
}
export default TodoRow;
