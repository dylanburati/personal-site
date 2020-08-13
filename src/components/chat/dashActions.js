import React, { useState, useContext, useEffect } from 'react';
import { useAsyncTask } from '../../hooks/useAsyncTask';
import { UserContext } from './userContext';
import { navigate } from 'gatsby';

function CreateForm({ handleLogin }) {
  const { authHttp } = useContext(UserContext);

  const [reqTitle, setReqTitle] = useState('');
  const [reqNickname, setReqNickname] = useState('');
  const [errorMessage, setErrorMessage] = useState();

  const create = useAsyncTask(async (title, nickname) => {
    if (!authHttp) return; // todo guest

    const json = await authHttp.post('/g', { title, nickname });
    if (json.success) {
      navigate(`/quip?room=${json.conversationId}`);
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
          placeholder="Enter a title for the room"
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
          placeholder="Enter a username for yourself"
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

function JoinForm({ handleLogin }) {
  const [reqCode, setReqCode] = useState('');

  const handleJoin = () => {
    navigate(`/quip?room=${reqCode}`);
  };

  return (
    <div className="flex flex-wrap mt-3">
      <input
        name="code"
        placeholder="Enter a code"
        type="text"
        autoComplete="off"
        className="w-full sm:w-auto flex-1 bg-paper-darker hover:bg-paper-dark rounded p-2 mb-2 sm:mb-0 mr-2"
        value={reqCode}
        onChange={ev => setReqCode(ev.currentTarget.value)}
      />
      <button
        className="w-full sm:w-auto bg-accent-200 hover:bg-accent text-white py-1 px-3 rounded"
        onClick={handleJoin}
      >
        Go!
      </button>
    </div>
  );
}

function DashActions({ handleLogin }) {
  const [tab, setTab] = useState(0);
  const mainView = [
    <JoinForm handleLogin={handleLogin} />,
    <CreateForm handleLogin={handleLogin} />,
  ][tab];
  const getClassNames = tabIdx => (tabIdx === tab ? 'border-b' : '');
  return (
    <div>
      <ul className="flex">
        <li className="mr-3 flex-1">
          <button
            className={
              'inline-block w-full text-center border-accent-200 hover:bg-paper-darker py-1 px-3 ' +
              getClassNames(0)
            }
            onClick={() => setTab(0)}
          >
            Join
          </button>
        </li>
        <li className="flex-1">
          <button
            className={
              'inline-block w-full text-center border-accent-200 hover:bg-paper-darker py-1 px-3 ' +
              getClassNames(1)
            }
            onClick={() => setTab(1)}
          >
            Create
          </button>
        </li>
      </ul>
      {mainView}
    </div>
  );
}

export default DashActions;
