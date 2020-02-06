import React, { useEffect, useReducer } from 'react';
import { navigate } from '@reach/router';
import qs from 'querystring';
import { pickBy } from 'lodash';
import Layout from '../components/layout';
import SEO from '../components/seo';
import Section from '../components/section';
import {
  useContextGateway,
  GatewayProvider,
} from '../components/todo/gatewayProvider';
import LoginForm from '../components/todo/loginForm';
import Dashboard from '../components/todo/dashboard';
import TodoTable from '../components/todo/todoTable';

import '../css/styles.css';

function reducer(state, action) {
  switch (action.type) {
    case 'logout':
      return {
        view: 'login',
      };
    case 'login':
      return {
        view: 'sheet-list-loading',
      };
    case 'sheet-list-loaded':
      const view = state.view === 'sheet' ? 'sheet' : 'sheet-list';
      return {
        ...state,
        view,
        sheetList: action.sheetList,
      };
    case 'open':
      return {
        ...state,
        view: 'sheet',
        sheet: action.sheet,
      };
    case 'modify-sheet':
      const { sheet, ...rest } = state;
      return {
        ...rest,
        sheet: {
          ...sheet,
          ...action.sheet,
        },
      };
    case 'close':
      if (state.view !== 'sheet') {
        return state;
      }
      navigate('/todo');
      const nextState = pickBy(state, (val, key) => key !== 'sheet');
      return {
        ...nextState,
        view: state.sheetList ? 'sheet-list' : 'sheet-list-loading',
      };
    default:
      throw new Error('Unknown action');
  }
}

function TodoApp({ query }) {
  const { user, logout, list, del } = useContextGateway();
  const [state, dispatch] = useReducer(reducer, {
    view: user ? 'sheet-list-loading' : 'login',
  });

  useEffect(() => {
    if (!user) return;

    const { name } = qs.parse(query.replace(/^\?/, ''));
    if (name) {
      dispatch({
        type: 'open',
        sheet: {
          name,
          status: 'saved',
        },
      });
    } else {
      dispatch({
        type: 'close',
      });
    }
  }, [user, query]);

  useEffect(() => {
    if (!user) return;

    let ignore = false;
    list().then(json => {
      if (ignore) return;
      if (json.success && Array.isArray(json.bins)) {
        const sheetList = json.bins.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        dispatch({ type: 'sheet-list-loaded', sheetList });
      }
    });
    return () => {
      ignore = true;
    };
  }, [user, list]);

  let mainView = null;
  if (!user || state.view === 'login') {
    const handleLogin = () => {
      dispatch({
        type: 'login',
      });
    };
    mainView = <LoginForm handleLogin={handleLogin} />;
  } else if (state.view === 'sheet-list') {
    const handleBack = () => {
      logout();
      dispatch({
        type: 'logout',
      });
    };
    const handleCreate = () => {
      dispatch({
        type: 'open',
        sheet: {
          name: 'New sheet',
          status: 'unnamed',
        },
      });
    };
    const handleDelete = async items => {
      Promise.all(items.map(item => del(item.name))).then(results => {
        const errors = results
          .filter(json => !json.success)
          .map(json => json.message);

        if (errors.length === results.length) {
          return;
        }
        const toRemove = results
          .filter(json => json.success)
          .map(json => json.name);
        const sheetList = state.sheetList.filter(
          item => !toRemove.includes(item.name)
        );
        dispatch({ type: 'sheet-list-loaded', sheetList });
      });
    };
    const handleOpen = name => {
      navigate(`?name=${name}`);
    };
    mainView = (
      <Dashboard
        bins={state.sheetList}
        handleBack={handleBack}
        handleCreate={handleCreate}
        handleOpen={handleOpen}
        handleDelete={handleDelete}
      />
    );
  } else if (state.view === 'sheet') {
    const handleClose = () => {
      dispatch({
        type: 'close',
      });
    };
    const handleName = name => {
      navigate(`?name=${name}`);
    };
    mainView = (
      <TodoTable
        name={state.sheet.name}
        status={state.sheet.status}
        handleBack={handleClose}
        handleName={handleName}
      />
    );
  }

  return (
    <Section className="px-5 mt-6">
      <h2 className="mb-3">{state.sheet ? state.sheet.name : 'Todo App'}</h2>
      {mainView}
    </Section>
  );
}

const TodoPage = ({ location }) => {
  return (
    <Layout navLinks={[{ text: 'Blog', href: '/blog' }]}>
      <SEO title="Todo" />

      <GatewayProvider>
        <TodoApp query={location.search} />
      </GatewayProvider>
    </Layout>
  );
};

export default TodoPage;
