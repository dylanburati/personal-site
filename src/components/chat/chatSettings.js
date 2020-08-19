import React, { useContext, useEffect, useState, useRef } from 'react';
import { Animate } from 'react-move';
import { ChatContext } from './chatContext';

export function ChatSettings({ showModal, closeModal }) {
  const { nickname, sendMessage } = useContext(ChatContext);
  const [inputNickname, setInputNickname] = useState(nickname);
  const [errorMessage, setErrorMessage] = useState();
  useEffect(() => {
    if (showModal) setInputNickname(nickname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);
  const dialogRef = useRef(null);

  const handleSubmit = ev => {
    ev.preventDefault();
    if (inputNickname.length < 2 || inputNickname.length > 63) {
      setErrorMessage('Nickname must be 2-63 characters');
      return;
    }
    if (/^(\s)*$/.test(inputNickname)) {
      setErrorMessage('Nickname can not be all spaces');
      return;
    }
    sendMessage({ action: 'setNickname', data: inputNickname });
    console.log(26, inputNickname);
    closeModal();
  };
  return (
    <Animate
      show={showModal}
      start={() => ({ opacity: 0, dy: -100 })}
      enter={() => ({ opacity: [1], dy: [0] })}
      leave={() => [{ opacity: [0] }, { dy: [-200], timing: { delay: 150 } }]}
    >
      {({ opacity, dy }) => (
        <div
          className="fixed top-0 left-0 h-full w-full overflow-hidden outline-none"
          style={{
            transition: 'opacity .15s linear',
            background: `rgba(0, 0, 0, 0.35)`,
            opacity: opacity,
          }}
          onClick={ev => {
            if (dialogRef.current && !dialogRef.current.contains(ev.target)) {
              closeModal();
            }
          }}
        >
          <div className="my-5 px-5 mx-auto max-w-md flex flex-col justify-center items-center h-full">
            <div
              className="bg-paper-darker rounded card modal-dialog p-4"
              style={{
                minWidth: `calc(min(100%, 20rem))`,
                transition: 'transform .2s ease-out',
                transform: `translate(0, ${dy}px)`,
              }}
              ref={dialogRef}
            >
              <form onSubmit={handleSubmit}>
                <label
                  className="block text-sm text-pen-light"
                  htmlFor="nickname"
                >
                  Nickname
                </label>
                <input
                  name="nickname"
                  type="text"
                  autoComplete="off"
                  className="bg-paper-dark rounded p-2 my-1 outline-none"
                  value={inputNickname}
                  onChange={ev => {
                    setErrorMessage(undefined);
                    setInputNickname(ev.currentTarget.value);
                  }}
                />
                <div className="flex justify-end mt-3 -mx-1">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-400 hover:bg-gray-500 text-black py-1 px-3 m-1 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 m-1 rounded"
                  >
                    Apply
                  </button>
                </div>
              </form>
              {errorMessage && (
                <p className="mt-2 mb-0 text-danger">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Animate>
  );
}
