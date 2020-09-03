import React, { useState, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ArrowLeft, FilePlus, Trash2 } from 'react-feather';
import Table from '../table';
import { UserContext } from '../chat/userContext';
import { useAsyncTask } from '../../hooks/useAsyncTask';

function Dashboard({ handleOpen, handleCreate, handleBack }) {
  const { authHttp, user, userLoading } = useContext(UserContext);
  const [bins, setBins] = useState([]);
  const [selected, setSelected] = useState([]);
  const withoutDeleted = selected.filter(e => bins.includes(e));
  if (withoutDeleted.length < selected.length) {
    setSelected(withoutDeleted);
  }
  const handleSelect = (item, isSelected) => {
    setSelected([...selected, item].filter(e => isSelected || e !== item));
  };

  const getBins = useAsyncTask(
    useCallback(async client => {
      const data = await client.get('/g/todo');
      if (data.success) setBins(data.conversations);
    }, [])
  );
  useEffect(() => {
    if (!user && !userLoading) handleBack();
  }, [handleBack, user, userLoading]);
  useEffect(() => {
    if (user && authHttp) getBins.run(authHttp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHttp, user]);

  const deleteBins = async () => {
    const data = await authHttp.del('/g', {
      ids: selected.map(item => item.id),
    });
    if (data.success) {
      setBins(arr => arr.filter(item => !selected.some(e => e.id === item.id)));
    }
  };

  return (
    <div>
      <h2 className="mb-3">Todo App</h2>
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
            onClick={deleteBins}
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
            field: 'title',
            label: 'Name',
            class: 'text-left',
          },
          {
            field: 'updatedAt',
            label: 'Date modified',
            class: 'text-right',
            render: ts => (ts ? new Date(ts).toLocaleString() : '-'),
          },
        ]}
        handleSelect={handleSelect}
        handleOpen={handleOpen}
        keyField="id"
        noDataText="Click create to start a sheet"
      />
    </div>
  );
}

Dashboard.propTypes = {
  handleOpen: PropTypes.func.isRequired,
  handleCreate: PropTypes.func.isRequired,
  handleBack: PropTypes.func.isRequired,
};

export default Dashboard;
