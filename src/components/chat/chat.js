import React, { useContext, useState, useEffect } from 'react';
import { ArrowLeft, Settings } from 'react-feather';
import { ChatCompose } from './chatCompose';
import { ChatPanel } from './chatPanel';
import { ChatSettings } from './chatSettings';
import { navigate } from 'gatsby';
import { ChatContext } from './chatContext';
import { UserContext } from './userContext';
import { AccountModal } from './accountModal';
import GuessMachine from './guessMachine';
import '../../css/chat.css';

function Chat() {
  const { authHttp, user, userLoading } = useContext(UserContext);
  const { isFirstLogin, setFirstLogin, roomTitle, sendMessage } = useContext(
    ChatContext
  );
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    if (!user && !userLoading) {
      setShowAccountModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  useEffect(() => {
    if (isFirstLogin) {
      setShowSettings(true);
      setFirstLogin(false);
    }
  }, [isFirstLogin, setFirstLogin]);

  const handleSend = async (text, attachments) => {
    if (text === '/guessr:refresh') {
      if (authHttp) {
        authHttp.get('/guessr/q/refresh').then(console.log);
      } else {
        console.log('guessr refresh failed - http client not initialized');
      }
      return;
    }
    const data = { text };
    if (authHttp && attachments && attachments.length) {
      const formdata = new FormData();
      attachments.forEach(a => {
        formdata.append('attachments', a);
      });
      const attachmentLinks = await authHttp.postForm('/imgur', formdata);
      if (!attachmentLinks.success) {
        console.error(attachmentLinks.message || 'Unknown error');
        return false;
      }
      data.attachments = attachmentLinks.data.map(att => ({
        type: 'imgur',
        link: att.link,
        tag: att.type.startsWith('image') ? 'img' : 'video',
      }));
    }
    sendMessage({ action: 'chat', data });
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
        <button
          className="hover:bg-paper-darker p-1 rounded-full"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="stroke-current" size={16} />
        </button>
      </div>
      <GuessMachine />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatPanel />
        <ChatCompose send={handleSend} />
      </div>
      <ChatSettings
        showModal={showSettings}
        closeModal={() => setShowSettings(false)}
      />
      <AccountModal
        showModal={showAccountModal}
        closeModal={() => setShowAccountModal(false)}
        defaultTab={0}
      />
    </div>
  );
}

Chat.propTypes = {};

export default Chat;
