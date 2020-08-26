import React, { useRef } from 'react';
import { Animate } from 'react-move';

export function Modal({ showModal, closeModal, children }) {
  const dialogRef = useRef(null);

  return (
    <Animate
      show={showModal}
      start={() => ({ opacity: 0, dy: -100 })}
      enter={() => ({ opacity: [1], dy: [0] })}
      leave={() => [{ opacity: [0] }, { dy: [-200], timing: { delay: 100 } }]}
    >
      {({ opacity, dy }) => (
        <div
          className="fixed top-0 left-0 h-full w-full overflow-hidden outline-none"
          style={{
            transition: 'opacity .1s linear',
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
                transition: 'transform .1s ease-out',
                transform: `translate(0, ${dy}px)`,
              }}
              ref={dialogRef}
            >
              {children}
            </div>
          </div>
        </div>
      )}
    </Animate>
  );
}
