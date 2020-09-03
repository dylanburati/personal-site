import React, { useState, useEffect, useContext, useCallback } from 'react';
import WSClient from '../../services/wsClient';
import { UserContext } from './userContext';
import { useAsyncTask } from '../../hooks/useAsyncTask';
import { navigate } from 'gatsby';

export const ChatContext = React.createContext({
  roomId: null,
  roomTitle: null,
  roomUsers: null,
  nickname: null,
  isLoading: false,
  isConnected: false,
  isFirstLogin: false,
  setFirstLogin: () => {},
  sendMessage: () => {},
  messages: [],
});

const wsUrl = 'ws://localhost:7000/ws';
export function ChatProvider({ children, roomId, getMessagesArgs = {} }) {
  const { token, user } = useContext(UserContext);
  const [roomTitle, setRoomTitle] = useState('');
  const [nickname, setNickname] = useState('');
  const [roomUsers, setRoomUsers] = useState({});
  const [isFirstLogin, setFirstLogin] = useState(false);
  const [messages, setMessages] = useState([]);

  const mergeMessages = useCallback(toAdd => {
    setMessages(messages => {
      const ids = new Map(messages.map((m, i) => [m.id, i]));
      const next = [...messages];
      toAdd.forEach(m => {
        const replaceIdx = ids.get(m.id);
        if (replaceIdx === undefined) {
          next.push(m);
          ids.set(m.id, undefined);
        } else {
          next[replaceIdx] = m;
        }
      });
      setMessages(next);
    });
  }, []);

  const [wsClient, setWsClient] = useState();
  const connect = useAsyncTask(
    useCallback(
      async client => {
        const msg = await client.sendAndListen({
          action: 'login',
          data: { token },
        });
        setWsClient(client);
        setRoomTitle(msg.title);
        setNickname(msg.nickname);
        setFirstLogin(msg.isFirstLogin);
        client.send({
          action: 'getMessages',
          data: getMessagesArgs,
        });
      },
      [getMessagesArgs, token]
    )
  );
  useEffect(() => {
    if (roomId && user && token) {
      const nextClient = new WSClient(`${wsUrl}/${roomId}`, connect.run);
      const lk = nextClient.addListener(message => {
        if (message.type === 'message') {
          mergeMessages([message.data]);
        } else if (message.type === 'getMessages') {
          mergeMessages(message.data);
        }
      });
      nextClient.connect();

      return () => {
        nextClient.disconnect();
        nextClient.removeListener(lk);
        setWsClient(current => (current === nextClient ? undefined : current));
        setMessages([]);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user, token]);
  useEffect(() => {
    if (wsClient) wsClient.setConnector(connect.run);
  }, [connect.run, wsClient]);

  const sendMessage = m => {
    if (wsClient) wsClient.send(m);
  };

  useEffect(() => {
    if (!wsClient) return;

    const lk = wsClient.addListener(message => {
      if (message.type === 'error') {
        if (typeof message.message === 'string') {
          if (message.message.startsWith('Unauthenticated')) wsClient.connect();
          else if (message.message.startsWith('Invalid conversation id'))
            navigate('/chat');
        }
      }
    });

    return () => {
      if (wsClient) wsClient.removeListener(lk);
    };
  }, [wsClient]);
  useEffect(() => {
    if (!wsClient) return;

    const lk = wsClient.addListener(message => {
      if (message.type === 'setNickname') {
        const { userId, nickname } = message.data;
        if (userId === user.id) {
          setNickname(nickname);
        }
        setRoomUsers(state => ({
          ...state,
          [userId]: {
            ...state[userId],
            nickname,
          },
        }));
        setMessages(messages =>
          messages.map(m => {
            const mc = { ...m };
            if (mc.sender.userId === userId) mc.sender.nickname = nickname;
            return mc;
          })
        );
      }
    });

    return () => {
      if (wsClient) wsClient.removeListener(lk);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsClient]);

  return (
    <ChatContext.Provider
      value={{
        roomId,
        roomTitle,
        roomUsers,
        nickname,
        isLoading: connect.loading,
        isConnected: wsClient != null,
        isFirstLogin,
        setFirstLogin,
        sendMessage,
        messages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
