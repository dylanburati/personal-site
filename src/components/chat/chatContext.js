import React, { useState, useEffect, useContext, useReducer } from 'react';
import { UserContext } from './userContext';
import { globalHistory } from '@reach/router';
import WSClient from '../../services/wsClient';
import { useAsyncTask } from '../../hooks/useAsyncTask';
import qs from 'querystring';

export const ChatContext = React.createContext({
  roomId: null,
  roomTitle: null,
  nickname: null,
  isLoading: false,
  isConnected: false,
  sendChat: () => {},
  messages: [],
});
const wsUrl = 'ws://localhost:7000/ws';
export function ChatProvider({ children }) {
  const { location } = globalHistory;
  const { token } = useContext(UserContext);
  const [roomId] = useState(() => {
    const { room } = qs.parse(location.search.replace(/^\?/, ''));
    return room;
  });
  const [roomTitle, setRoomTitle] = useState('');
  const [nickname, setNickname] = useState('');

  const [, onConnect] = useReducer(n => n + 1, 0);
  const [wsClient, setWsClient] = useState();
  const connect = useAsyncTask(async (nickname = null) => {
    const nextClient = new WSClient(`${wsUrl}/${roomId}`, onConnect, onConnect);
    const msg = await nextClient.sendAndListen({
      action: 'login',
      data: { token, nickname },
    });
    setWsClient(nextClient);
    setRoomTitle(msg.title);
    setNickname(msg.nickname);
  });
  useEffect(() => {
    if (roomId && token && !wsClient && !connect.loading) {
      connect.run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, token]);

  const sendChat = content => {
    if (wsClient)
      wsClient.send({
        action: 'chat',
        data: content,
      });
  };

  const [messages, setMessages] = useState([]);
  useEffect(() => {
    if (!wsClient) return;

    const lk = wsClient.addListener(message => {
      const toAdd = [];
      if (message.type === 'message') {
        toAdd.push(message.data);
      } else if (message.type === 'getMessages') {
        toAdd.push(...message.data);
      }
      if (toAdd.length) {
        setMessages(messages => {
          const ids = new Set(messages.map(m => m.id));
          const next = [...messages];
          toAdd.forEach(m => {
            if (!ids.has(m.id)) {
              next.push(m);
              ids.add(m.id);
            }
          });
          setMessages(next);
        });
      }
    });
    wsClient.send({
      action: 'getMessages',
      data: {},
    });

    return () => {
      if (wsClient) {
        wsClient.disconnect();
        wsClient.removeListener(lk);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsClient]);
  useEffect(() => {
    if (!wsClient) return;

    const lk = wsClient.addListener(message => {
      if (message.type === 'error') {
        if (
          typeof message.message === 'string' &&
          message.message.startsWith('Unauthenticated')
        ) {
          connect.run();
        }
      }
    });

    return () => {
      if (wsClient) wsClient.removeListener(lk);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsClient]);
  useEffect(() => {
    if (!wsClient) return;

    const lk = wsClient.addListener(message => {
      if (message.type === 'status') {
        console.log(message.data);
      }
    });

    return () => {
      if (wsClient) wsClient.removeListener(lk);
    };
  }, [wsClient]);

  return (
    <ChatContext.Provider
      value={{
        roomId,
        roomTitle,
        nickname,
        isLoading: connect.loading,
        isConnected: wsClient != null,
        sendChat,
        messages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
