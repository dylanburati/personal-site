import React, { useContext, useState } from 'react';
import { UserContext } from './UserContext';
import { useAsyncTask } from '../../hooks/useAsyncTask';

export function RegisterForm({ onSuccess, onCancel = null, allowGuest = true }) {
  const { createGuest, register } = useContext(UserContext);

  const [isGuest, setIsGuest] = useState(allowGuest);
  const [inputUsername, setInputUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState();

  const submit = useAsyncTask(async () => {
    let json;
    if (isGuest) {
      json = await createGuest();
    } else {
      json = await register(inputUsername, password);
    }

    if (json.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(json.message || 'Unknown error');
    }
  });
  const handleSubmit = ev => {
    ev.preventDefault();
    if (!isGuest) {
      if (inputUsername.length < 2 || inputUsername.length > 63) {
        setErrorMessage('Username must be 2-63 characters');
        return;
      }
      if (/[^A-Za-z0-9-_.]/.test(inputUsername)) {
        setErrorMessage('Username can not contain special characters');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long');
        return;
      }
    }

    if (!submit.loading) submit.run();
  };

  return (
    <form className="pt-1" onSubmit={handleSubmit}>
      {allowGuest && (
        <>
          <input
            className="mr-2 mb-3"
            type="checkbox"
            name="isGuest"
            checked={isGuest}
            onChange={ev => setIsGuest(ev.currentTarget.checked)}
          />
          <label
            className="inline-block text-sm text-pen-light"
            htmlFor="username"
          >
            Use guest account?
          </label>
        </>
      )}
      {!isGuest && (
        <>
          <label className="block text-sm text-pen-light" htmlFor="username">
            Username
          </label>
          <input
            name="username"
            type="text"
            autoComplete="off"
            className="bg-paper-dark rounded p-2 my-1 outline-none"
            value={inputUsername}
            onChange={ev => {
              setErrorMessage(undefined);
              setInputUsername(ev.currentTarget.value);
            }}
          />
          <label className="block text-sm text-pen-light" htmlFor="password">
            Password
          </label>
          <input
            name="password"
            type="password"
            autoComplete="off"
            className="bg-paper-dark rounded p-2 my-1 outline-none"
            value={password}
            onChange={ev => {
              setErrorMessage(undefined);
              setPassword(ev.currentTarget.value);
            }}
          />
        </>
      )}
      <div className="flex justify-end mt-3 -mx-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 hover:bg-gray-500 text-black py-1 px-3 m-1 rounded"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 m-1 rounded"
        >
          Register
        </button>
      </div>
      {errorMessage && <p className="mt-2 mb-0 text-danger">{errorMessage}</p>}
    </form>
  );
}

export function LoginForm({ onSuccess, onCancel = null }) {
  const { login } = useContext(UserContext);
  const [inputUsername, setInputUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState();

  const submit = useAsyncTask(async () => {
    const json = await login(inputUsername, password);
    if (json.success) {
      if (onSuccess) onSuccess();
    } else {
      setErrorMessage(json.message || 'Unknown error');
    }
  });
  const handleSubmit = ev => {
    ev.preventDefault();
    if (!submit.loading) submit.run();
  };

  return (
    <form className="pt-1" onSubmit={handleSubmit}>
      <label className="block text-sm text-pen-light" htmlFor="username">
        Username
      </label>
      <input
        name="username"
        type="text"
        autoComplete="off"
        className="bg-paper-dark rounded p-2 my-1 outline-none"
        value={inputUsername}
        onChange={ev => {
          setErrorMessage(undefined);
          setInputUsername(ev.currentTarget.value);
        }}
      />
      <label className="block text-sm text-pen-light" htmlFor="password">
        Password
      </label>
      <input
        name="password"
        type="password"
        autoComplete="off"
        className="bg-paper-dark rounded p-2 my-1 outline-none"
        value={password}
        onChange={ev => {
          setErrorMessage(undefined);
          setPassword(ev.currentTarget.value);
        }}
      />
      <div className="flex justify-end mt-3 -mx-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-400 hover:bg-gray-500 text-black py-1 px-3 m-1 rounded"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 m-1 rounded"
        >
          Log in
        </button>
      </div>
      {errorMessage && <p className="mt-2 mb-0 text-danger">{errorMessage}</p>}
    </form>
  );
}

// export function AccountModal({ showModal, closeModal, defaultTab }) {
//   const [activeTab, setActiveTab] = useState(defaultTab);
//   useEffect(() => {
//     if (showModal) setActiveTab(defaultTab);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [showModal]);
//   return (
//     <Modal showModal={showModal} closeModal={closeModal}>
//       <Tabs
//         className="mb-3"
//         itemClassName="hover:bg-paper-dark"
//         activeTab={activeTab}
//         setActiveTab={setActiveTab}
//         items={['Register', 'Log in']}
//       >
//         {activeTab === 0 && (
//           <RegisterForm onCancel={closeModal} onSuccess={closeModal} />
//         )}
//         {activeTab === 1 && (
//           <LoginForm onCancel={closeModal} onSuccess={closeModal} />
//         )}
//       </Tabs>
//     </Modal>
//   );
// }
