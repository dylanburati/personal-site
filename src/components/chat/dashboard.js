import React, { useState } from 'react';
import Table from '../table';
import DashActions from './dashActions';
import { navigate } from 'gatsby';

function Dashboard({ handleOpen }) {
  const { list } = { list: [] }; // todo http
  const [selected, setSelected] = useState([]);
  const withoutDeleted = selected.filter(e => list.includes(e));
  if (withoutDeleted.length < selected.length) {
    setSelected(withoutDeleted);
  }
  const handleSelect = (item, isSelected) => {
    setSelected([...selected, item].filter(e => isSelected || e !== item));
  };

  return (
    <div>
      <DashActions handleLogin={handleOpen} />
      <h3 className="border-b border-paper-dark py-2 mt-3">Past rooms</h3>
      <Table
        rows={[]}
        columns={[
          {
            field: 'title',
            label: 'Title',
            class: 'text-left',
          },
          {
            field: 'username',
            label: 'Your username',
            class: 'text-left',
          },
        ]}
        handleSelect={handleSelect}
        handleOpen={item => navigate(`/quip?room=${item.id}`)}
        keyField="id"
      />
    </div>
  );
}

Dashboard.propTypes = {};

export default Dashboard;
