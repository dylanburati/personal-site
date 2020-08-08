import React, { useState, useRef } from 'react';
import { Send, Image, X as XIcon } from 'react-feather';

export function ChatCompose({ send }) {
  const textareaRef = useRef(null);
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);

  const handleSend = () => {
    if (attachments.length || /[^\s]/.test(text)) {
      send(text, attachments);
      setText('');
      setAttachments([]);
      textareaRef.current.style.height = 'auto';
    }
  };

  const removeAttachment = a => {
    setAttachments(attachments.filter(att => att !== a));
  };

  return (
    <div>
      <ul className="text-sm">
        {attachments.map((a, i) => (
          <li
            key={`attachment-${i}`}
            className="flex border border-paper-dark mb-1"
          >
            <button
              className="hover:bg-paper-darker text-pen-light hover:text-pen-lighter p-px mx-1 rounded-full"
              onClick={() => removeAttachment(a)}
            >
              <XIcon size={16} className="stroke-current" />
            </button>
            {a.name}
          </li>
        ))}
      </ul>
      <div className="flex items-start">
        <div className="flex-1 relative mr-3">
          <textarea
            className="w-full resize-none border border-paper-dark bg-paper-darker outline-none placeholder-pen-lighter leading-tight"
            style={{ padding: '0.3125rem' }}
            placeholder="Type a message..."
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={ev => {
              ev.currentTarget.style.height = 'auto';
              const height = Math.min(122, ev.currentTarget.scrollHeight);
              if (height > 24) {
                ev.currentTarget.style.height = `${height + 2}px`;
              }
              setText(ev.currentTarget.value);
            }}
            onKeyDown={ev => {
              if (ev.key === 'Enter' && !ev.shiftKey && !ev.ctrlKey) {
                ev.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="absolute h-full right-0 top-0">
            <div className="text-pen-light hover:text-pen-lighter relative pt-2 pr-2">
              <Image size={16} className="stroke-current" />
              <input
                className="w-full h-full absolute bottom-0 right-0 opacity-0 cursor-pointer"
                title="Add photos"
                accept="image/*,video/mp4,video/webm,video/x-matroska,video/quicktime,video/x-flv,video/x-msvideo,video/x-ms-wmv,video/mpeg"
                type="file"
                name="attachments[]"
                multiple
                onChange={ev =>
                  setAttachments(Array.from(ev.currentTarget.files))
                }
              />
            </div>
          </div>
        </div>
        <button
          className="bg-accent-200 hover:bg-accent text-white p-1 rounded"
          onClick={handleSend}
        >
          <Send className="stroke-current" />
        </button>
      </div>
    </div>
  );
}
