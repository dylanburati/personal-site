import React, { useEffect, useContext, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "../components/Layout";
// import SEO from '../components/seo';
import { LoginTabs } from "../components/todo/LoginTabs";
import { Bin, Dashboard } from "../components/todo/Dashboard";
import { TodoTable } from "../components/todo/TodoTable";
import { UserContext, UserProvider } from "../components/chat/UserContext";
import { ChatProvider } from "../components/chat/ChatContext";

const GET_MESSAGES_ARGS = { limit: 2 };

const TodoApp = () => {
  const [queryParams, setQueryParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userLoading, token, logout } = useContext(UserContext);
  const view = useMemo(() => {
    if (typeof window === "undefined") return null;
    if (!token) return "login";
    if (queryParams.get("id") || queryParams.get("new") != null) return "sheet";
    return "sheet-list";
  }, [queryParams, token]);

  useEffect(() => {
    if (!user && !userLoading) {
      navigate("/todo");
    }
  }, [user, userLoading]);

  let mainView: React.ReactNode = null;
  if (view === "login") {
    mainView = <LoginTabs handleLogin={() => {}} />;
  } else if (view === "sheet-list") {
    const handleBack = () => {
      logout();
    };
    const handleCreate = () => {
      navigate("?new");
    };
    const handleOpen = (item: Bin) => {
      navigate(`?id=${item.id}`);
    };
    mainView = (
      <Dashboard
        handleBack={handleBack}
        handleCreate={handleCreate}
        handleOpen={handleOpen}
      />
    );
  } else if (view === "sheet") {
    const handleClose = () => {
      navigate("/todo");
    };
    const handleName = (id) => {
      setQueryParams(new URLSearchParams({ id }));
    };
    mainView = <TodoTable handleBack={handleClose} handleName={handleName} />;
  }

  return (
    <ChatProvider
      roomId={queryParams.get("id")}
      getMessagesArgs={GET_MESSAGES_ARGS}
    >
      <section className="px-5 mt-6">
        <div className="container mx-auto">{mainView}</div>
      </section>
    </ChatProvider>
  );
};

export const Todo = () => {
  return (
    <Layout navLinks={[{ text: "Blog", href: "/blog" }]}>
      {/* <SEO title="Todo" /> */}

      <UserProvider>
        <TodoApp />
      </UserProvider>
    </Layout>
  );
};