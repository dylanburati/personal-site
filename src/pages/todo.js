import React, { useEffect, useContext, useMemo } from 'react';
import { globalHistory, navigate } from '@reach/router';
import qs from 'querystring';
import Layout from '../components/layout';
import SEO from '../components/seo';
import Section from '../components/section';
import LoginForm from '../components/todo/loginForm';
import Dashboard from '../components/todo/dashboard';
import TodoTable from '../components/todo/todoTable';

import '../css/styles.css';
import { UserContext, UserProvider } from '../components/chat/userContext';
import { ChatProvider } from '../components/chat/chatContext';

const GET_MESSAGES_ARGS = { limit: 2 };
function TodoApp() {
  const { location } = globalHistory;
  const queryParams = qs.parse(location.search.replace(/^\?/, ''));
  const { user, userLoading, token, logout } = useContext(UserContext);
  const view = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (!token) return 'login';
    if (queryParams.id || queryParams.new != null) return 'sheet';
    return 'sheet-list';
  }, [queryParams.id, queryParams.new, token]);

  useEffect(() => {
    if (!user && !userLoading) {
      navigate('/todo');
    }
  }, [user, userLoading]);

  let mainView = null;
  if (view === 'login') {
    mainView = <LoginForm />;
  } else if (view === 'sheet-list') {
    const handleBack = () => {
      logout();
    };
    const handleCreate = () => {
      navigate('?new');
    };
    const handleOpen = item => {
      navigate(`?id=${item.id}`);
    };
    mainView = (
      <Dashboard
        handleBack={handleBack}
        handleCreate={handleCreate}
        handleOpen={handleOpen}
      />
    );
  } else if (view === 'sheet') {
    const handleClose = () => {
      navigate('/todo');
    };
    const handleName = id => {
      navigate(`?id=${id}`);
    };
    mainView = <TodoTable handleBack={handleClose} handleName={handleName} />;
  }

  return (
    <ChatProvider roomId={queryParams.id} getMessagesArgs={GET_MESSAGES_ARGS}>
      <Section className="px-5 mt-6">{mainView}</Section>
    </ChatProvider>
  );
}

const TodoPage = ({ location }) => {
  return (
    <Layout navLinks={[{ text: 'Blog', href: '/blog' }]}>
      <SEO title="Todo" />

      <UserProvider>
        <TodoApp />
      </UserProvider>
    </Layout>
  );
};

export default TodoPage;
