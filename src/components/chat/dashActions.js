import React, { useState, useContext, useMemo } from 'react';
import { navigate } from 'gatsby';
import { Tabs } from '../tabs';
import { UserContext } from './userContext';
import { useAsyncTask } from '../../hooks/useAsyncTask';

function CreateForm() {
  const { authHttp } = useContext(UserContext);

  const [reqTitle, setReqTitle] = useState('');
  const [reqNickname, setReqNickname] = useState('');
  const [errorMessage, setErrorMessage] = useState();

  const create = useAsyncTask(async (title, nickname) => {
    if (!authHttp) return; // todo guest

    const json = await authHttp.post('/g', { title, nickname });
    if (json.success) {
      navigate(`/chat?room=${json.conversationId}`);
    } else {
      setErrorMessage(json.message || 'Unknown error');
    }
  });

  const handleCreate = ev => {
    ev.preventDefault();
    if (!create.loading) create.run(reqTitle, reqNickname);
  };

  return (
    <div>
      <form onSubmit={handleCreate} className="flex flex-wrap -m-1 mt-2">
        <input
          name="title"
          placeholder="Room title"
          type="text"
          autoComplete="off"
          className="w-full sm:w-auto flex-1 bg-paper-darker hover:bg-paper-dark rounded p-2 m-1"
          value={reqTitle}
          onChange={ev => {
            setErrorMessage(undefined);
            setReqTitle(ev.currentTarget.value);
          }}
        />
        <input
          name="nickname"
          placeholder="Your nickname in the room"
          type="text"
          autoComplete="off"
          className="w-full sm:w-auto flex-1 bg-paper-darker hover:bg-paper-dark rounded p-2 m-1"
          value={reqNickname}
          onChange={ev => {
            setErrorMessage(undefined);
            setReqNickname(ev.currentTarget.value);
          }}
        />
        <button
          type="submit"
          className="w-full sm:w-auto bg-accent-200 hover:bg-accent text-white py-1 px-3 m-1 rounded"
        >
          Go!
        </button>
      </form>
      {errorMessage && <p className="mt-2 mb-0 text-danger">{errorMessage}</p>}
    </div>
  );
}

function JoinForm() {
  const [reqCode, setReqCode] = useState('');

  const handleJoin = ev => {
    ev.preventDefault();
    navigate(`/chat?room=${reqCode}`);
  };

  return (
    <form onSubmit={handleJoin} className="flex flex-wrap -m-1 mt-2">
      <input
        name="code"
        placeholder="Enter a code"
        type="text"
        autoComplete="off"
        className="w-full sm:w-auto flex-1 bg-paper-darker hover:bg-paper-dark rounded p-2 m-1"
        value={reqCode}
        onChange={ev => setReqCode(ev.currentTarget.value)}
      />
      <button
        type="submit"
        className="w-full sm:w-auto bg-accent-200 hover:bg-accent text-white py-1 px-3 rounded m-1"
      >
        Go!
      </button>
    </form>
  );
}

function DashActions() {
  const { user } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState(0);
  const tabItems = useMemo(() => {
    if (user) return ['Join', 'Create'];
    return ['Join'];
  }, [user]);
  return (
    <Tabs activeTab={activeTab} setActiveTab={setActiveTab} items={tabItems}>
      {activeTab === 0 && <JoinForm />}
      {activeTab === 1 && <CreateForm />}
    </Tabs>
  );
}

export default DashActions;
