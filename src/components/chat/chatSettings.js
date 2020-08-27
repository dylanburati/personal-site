import React, { useContext, useEffect, useState } from 'react';
import { Modal } from '../modal';
import { ChatContext } from './chatContext';

export function ChatSettings({ showModal, closeModal }) {
  const { roomId, nickname, sendMessage } = useContext(ChatContext);
  const [inputNickname, setInputNickname] = useState(nickname);
  const [errorMessage, setErrorMessage] = useState();
  useEffect(() => {
    if (showModal) setInputNickname(nickname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

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
    closeModal();
  };
  return (
    <Modal showModal={showModal} closeModal={closeModal}>
      <form onSubmit={handleSubmit}>
        <label className="block text-sm text-pen-light" htmlFor="roomId">
          Room code
        </label>
        <div className="mt-2 mb-4" name="roomId">
          {roomId}
        </div>
        <label className="block text-sm text-pen-light" htmlFor="nickname">
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
      {errorMessage && <p className="mt-2 mb-0 text-danger">{errorMessage}</p>}
    </Modal>
  );
}
