import React, { useEffect, useRef, useContext } from 'react';
import { ChatContext } from './chatContext';
import { UserContext } from './userContext';
import { useStateNoCmp } from '../../hooks/useStateNoCmp';

function ChatMessage({ from, content, isSelf, isConsecutive }) {
  return (
    <div
      className={
        isSelf
          ? 'chat-message self-end chat-message-mine'
          : 'chat-message self-start chat-message-theirs'
      }
    >
      {!isConsecutive && (
        <label className="mb-1 text-xs text-pen-light">{from}</label>
      )}
      {content.text && (
        <p className="mb-2 rounded" style={{ padding: '0 8px 2px' }}>
          {content.text}
        </p>
      )}
      {(content.attachments || []).map((att, i) => {
        if (att.type === 'imgur') {
          if (att.tag === 'img')
            return (
              <img
                alt={content.text}
                className="mb-2 rounded"
                src={att.link}
                key={`msg-attachment-${i}`}
              />
            );
          if (att.tag === 'video')
            return (
              <video
                className="mb-2 rounded"
                src={att.link}
                key={`msg-attachment-${i}`}
              />
            );
        }
        return null;
      })}
    </div>
  );
}

export function ChatPanel() {
  const { user = {} } = useContext(UserContext);
  const { messages } = useContext(ChatContext);

  const chats = messages
    .filter(m => m.target === 'chat' && m.content)
    .map((m, i, arr) => {
      const isConsecutive =
        i > 0 && arr[i - 1].sender.userId === m.sender.userId;
      return { ...m, isConsecutive };
    });

  const panelDiv = useRef(document.createElement('div'));
  useEffect(() => {
    const array = [...panelDiv.current.children];
    if (array.length) array[array.length - 1].scrollIntoView();
  }, [chats.length]);

  return (
    <div className="flex-1 my-2 px-4 overflow-auto scrollbar-dark">
      <div className="flex min-h-full flex-col justify-end" ref={panelDiv}>
        {chats.map(m => (
          <ChatMessage
            key={m.id}
            content={m.content}
            from={m.sender.nickname}
            isSelf={m.sender.userId === user.id}
            isConsecutive={m.isConsecutive}
          />
        ))}
      </div>
    </div>
  );
}
