import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, FilePlus, Trash2 } from 'react-feather';
import { useContextGateway } from './gatewayProvider';
import Table from '../table';

function Dashboard({
  bins,
  handleOpen,
  handleCreate,
  handleDelete,
  handleBack,
}) {
  const { user } = useContextGateway();
  const [selected, setSelected] = useState([]);
  const withoutDeleted = selected.filter(e => bins.includes(e));
  if (withoutDeleted.length < selected.length) {
    setSelected(withoutDeleted);
  }
  const handleSelect = (item, isSelected) => {
    setSelected([...selected, item].filter(e => isSelected || e !== item));
  };

  return (
    <div>
      <div className="flex items-center border-b pb-2">
        <button
          className="hover:bg-paper-darker text-accent p-1 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="stroke-current" />
        </button>
        <span className="flex-grow"></span>
        {selected.length > 0 && (
          <button
            className="hover:bg-paper-darker text-accent py-1 px-2 mb-1 rounded"
            onClick={() => handleDelete(selected)}
          >
            <Trash2 className="stroke-current inline" />
            <span className="font-bold text-sm uppercase mx-1">Delete</span>
          </button>
        )}
        <button
          className="hover:bg-paper-darker text-accent py-1 px-2 mb-1 rounded"
          onClick={handleCreate}
        >
          <FilePlus className="stroke-current inline" />
          <span className="font-bold text-sm uppercase mx-1">Create</span>
        </button>
      </div>
      <Table
        rows={bins}
        columns={[
          {
            field: 'name',
            label: 'Name',
            class: 'text-left',
            render: (name, { username }) =>
              user.username === username ? name : `@${username}/${name}`,
          },
          {
            field: 'updatedAt',
            label: 'Date modified',
            class: 'text-right',
            render: ts => new Date(ts).toLocaleString(),
          },
        ]}
        handleSelect={handleSelect}
        handleOpen={handleOpen}
        keyField="name"
        noDataText="Click create to start a sheet"
      />
    </div>
  );
}

Dashboard.propTypes = {
  bins: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ).isRequired,
  handleOpen: PropTypes.func.isRequired,
  handleCreate: PropTypes.func.isRequired,
  handleBack: PropTypes.func.isRequired,
};

export default Dashboard;
