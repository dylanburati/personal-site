import React, { useState } from 'react';
import { Tabs } from '../Tabs';
import { LoginForm, RegisterForm } from '../chat/AccountModal';

export type LoginTabsProps = {
  handleLogin: () => void;
};

export const LoginTabs: React.FC<LoginTabsProps> = ({ handleLogin }) => {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <div>
      <h2 className="mb-3">Todo App</h2>
      <div className="flex mt-6 justify-center">
        <Tabs
          className="mb-3 max-w-sm flex-1"
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          items={['Log in', 'Register']}
        >
          {activeTab === 0 && <LoginForm onSuccess={handleLogin} />}
          {activeTab === 1 && (
            <RegisterForm onSuccess={handleLogin} allowGuest={false} />
          )}
        </Tabs>
      </div>
    </div>
  );
}