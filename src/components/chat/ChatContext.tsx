import React, { useState, useEffect, useContext, useCallback } from 'react';
import { UserContext } from './UserContext';
import WSClient from '../../services/wsClient';
import { useAsyncTask } from '../../hooks/useAsyncTask';

export type ChatContextType = {
  roomId: string | null;
  roomTitle: string | null;
  roomUsers: {
    [id: string]: {
      id: string;
      nickname: string;
    }
  }
  nickname: string | null;
  isLoading: boolean;
  isConnected: boolean;
  isFirstLogin: boolean;
  setFirstLogin: (value: boolean) => void;
  sendMessage: (message: any) => void;
  messages: any[];
  errors: any[];
}

export const ChatContext = React.createContext<ChatContextType>({
  roomId: null,
  roomTitle: null,
  roomUsers: {},
  nickname: null,
  isLoading: false,
  isConnected: false,
  isFirstLogin: false,
  setFirstLogin: () => {},
  sendMessage: () => {},
  messages: [],
  errors: [],
});

const wsUrl = 'wss://datagame.live/ws';
export function ChatProvider({ children, roomId, getMessagesArgs = {} }) {
  const { token, user } = useContext(UserContext);
  const [roomTitle, setRoomTitle] = useState('');
  const [nickname, setNickname] = useState('');
  const [roomUsers, setRoomUsers] = useState({});
  const [isFirstLogin, setFirstLogin] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);

  const mergeMessages = useCallback(toAdd => {
    setMessages(messages => {
      const ids = new Map(messages.map((m, i) => [m.id, i]));
      const next = [...messages];
      toAdd.forEach(m => {
        const replaceIdx = ids.get(m.id);
        if (replaceIdx === undefined) {
          next.push(m);
        } else {
          next[replaceIdx] = m;
        }
      });
      return next;
    });
  }, []);

  const [wsClient, setWsClient] = useState<WSClient>();
  const connect = useAsyncTask(
    useCallback(
      async client => {
        try {
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
        } catch (err) {
          console.error(err.message);
          if (err.originalMessage) {
            setErrors(prev => [...prev, err.originalMessage]);
          }
        }
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
        setErrors([]);
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
        setErrors(prev => [...prev, message]);
      }
    });

    return () => {
      if (wsClient) wsClient.removeListener(lk);
    };
  }, [wsClient]);
  useEffect(() => {
    if (!wsClient || !user) return;

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
        errors,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
