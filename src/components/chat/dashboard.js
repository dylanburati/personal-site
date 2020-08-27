import React, { useState, useContext, useEffect, useCallback } from 'react';
import { navigate } from 'gatsby';
import Table from '../table';
import DashActions from './dashActions';
import { UserContext } from './userContext';
import { useAsyncTask } from '../../hooks/useAsyncTask';
import { AccountModal } from './accountModal';

function Dashboard({ handleOpen }) {
  const { user, userLoading, authHttp, logout } = useContext(UserContext);
  const [list, setList] = useState([]);
  const getRooms = useAsyncTask(
    useCallback(async client => {
      const data = await client.get('/g');
      if (data.success) setList(data.conversations);
    }, [])
  );
  useEffect(() => {
    if (user && authHttp) getRooms.run(authHttp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHttp, user]);
  const [selected, setSelected] = useState([]);
  const withoutDeleted = selected.filter(e => list.includes(e));
  if (withoutDeleted.length < selected.length) {
    setSelected(withoutDeleted);
  }
  const handleSelect = (item, isSelected) => {
    setSelected([...selected, item].filter(e => isSelected || e !== item));
  };
  const [showModal, setShowModal] = useState(false);
  const [defaultModalTab, setDefaultModalTab] = useState(0);

  return (
    <div>
      <DashActions />
      <div className="flex items-center justify-between border-b border-paper-dark py-2 mt-8">
        <h3>Past rooms</h3>
        {user && (
          <button
            className="hover:bg-paper-darker text-accent py-1 px-2 mb-1 rounded"
            onClick={logout}
          >
            <span className="font-bold text-sm uppercase">Log out</span>
          </button>
        )}
      </div>
      {user || userLoading ? (
        <Table
          rows={list}
          columns={[
            {
              field: 'title',
              label: 'Title',
              class: 'text-left',
            },
            {
              field: 'nickname',
              label: 'Your nickname',
              class: 'text-left',
            },
          ]}
          handleSelect={handleSelect}
          handleOpen={item => navigate(`/chat?room=${item.id}`)}
          keyField="id"
        />
      ) : (
        <p>
          You aren't logged in. You can{' '}
          <button
            className="text-accent hover:text-accent-700 hover:underline"
            onClick={() => {
              setDefaultModalTab(0);
              setShowModal(true);
            }}
          >
            create a guest account
          </button>{' '}
          or{' '}
          <button
            className="text-accent hover:text-accent-700 hover:underline"
            onClick={() => {
              setDefaultModalTab(1);
              setShowModal(true);
            }}
          >
            sign in
          </button>{' '}
          if you have a previous account.
        </p>
      )}
      <AccountModal
        showModal={showModal}
        closeModal={() => setShowModal(false)}
        defaultTab={defaultModalTab}
      />
    </div>
  );
}

Dashboard.propTypes = {};

export default Dashboard;
