import React, { useContext } from 'react';
import { ArrowLeft } from 'react-feather';
import { ChatCompose } from './chatCompose';
import { ChatPanel } from './chatPanel';
import { navigate } from 'gatsby';
import { ChatContext } from './chatContext';
import '../../css/chat.css';

function Chat() {
  const { roomTitle, sendChat } = useContext(ChatContext);

  const handleSend = async (text, attachments) => {
    let data = { text };
    // if (attachments && attachments.length) {
    //   const formdata = new FormData();
    //   attachments.forEach(a => {
    //     formdata.append('attachments', a);
    //   });
    //   const attachmentLinks = await active.upload(formdata);
    //   if (!attachmentLinks.success) {
    //     console.error(attachmentLinks.message || 'Unknown error');
    //     return false;
    //   }
    //   data.attachments = attachmentLinks.data.map(att => ({
    //     type: 'imgur',
    //     link: att.link,
    //     tag: att.type.startsWith('image') ? 'img' : 'video',
    //   }));
    // }
    sendChat(data);
    return true;
  };

  const handleBack = () => {
    navigate(`/quip`);
  };

  return (
    <div className="flex flex-col h-full pt-4 pb-6">
      <div className="flex items-center border-b pb-2">
        <button
          className="hover:bg-paper-darker text-accent p-1 mr-3 rounded-full"
          onClick={handleBack}
        >
          <ArrowLeft className="stroke-current" />
        </button>
        <h2 className="mb-1">{roomTitle || 'Loading...'}</h2>
        <span className="flex-grow"></span>
        {/* info */}
      </div>
      <ChatPanel />
      <ChatCompose send={handleSend} />
    </div>
  );
}

Chat.propTypes = {};

export default Chat;
