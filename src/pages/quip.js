import React, { useState, useEffect } from 'react';
import { globalHistory } from '@reach/router';
import Layout from '../components/layout';
import SEO from '../components/seo';
import Section from '../components/section';
import ScreenWrapper from '../components/screenWrapper';
import Chat from '../components/chat/chat';
import Dashboard from '../components/chat/dashboard';
import qs from 'querystring';
import { UserProvider } from '../components/chat/userContext';

import '../css/styles.css';
import { ChatProvider } from '../components/chat/chatContext';

function QuipApp() {
  const { location } = globalHistory;
  const [roomId, setRoomId] = useState();

  useEffect(() => {
    const { room } = qs.parse(location.search.replace(/^\?/, ''));
    setRoomId(room);
  }, [location.search]);

  if (typeof window === 'undefined') return null;
  if (!roomId) {
    return (
      <Section className="px-5 mt-6">
        <Dashboard />
      </Section>
    );
  }
  return (
    <ScreenWrapper className="px-5" innerClassName="container mx-auto">
      <ChatProvider>
        <Chat />
      </ChatProvider>
    </ScreenWrapper>
  );
}

const QuipPage = ({ location }) => {
  return (
    <Layout navLinks={[{ text: 'Blog', href: '/blog' }]} hideFooter>
      <SEO title="Quip" />

      <UserProvider>
        <QuipApp />
      </UserProvider>
    </Layout>
  );
};

export default QuipPage;
