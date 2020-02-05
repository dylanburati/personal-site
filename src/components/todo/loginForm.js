import React, { useState } from 'react';
import { useContextGateway } from './gatewayProvider';

function LoginForm({ handleLogin }) {
  const { login } = useContextGateway();
  const [error, setError] = useState(null);

  const handleSubmit = ev => {
    ev.preventDefault();
    const { username, password } = ev.target.elements;
    login(username.value, password.value).then(res => {
      if (res.success) {
        handleLogin();
      } else {
        setError(res.message ? res.message : 'Unknown error');
      }
    });
  };

  return (
    <div className="flex justify-center mt-6">
      <form onSubmit={handleSubmit}>
        <input
          name="username"
          placeholder="Username"
          type="text"
          autoComplete="off"
          className="block bg-paper-darker hover:bg-paper-dark rounded p-2 mb-2"
          onChange={() => setError(null)}
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          autoComplete="off"
          className="block bg-paper-darker hover:bg-paper-dark rounded p-2 mb-2"
          onChange={() => setError(null)}
        />
        {error !== null ? <p className="text-danger">{error}</p> : null}
        <button
          className="bg-accent-200 hover:bg-accent text-white py-2 px-4 rounded"
          type="submit"
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default LoginForm;
