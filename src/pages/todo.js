import React, { useEffect, useReducer } from 'react';
import { navigate } from '@reach/router';
import qs from 'querystring';
import { pickBy } from 'lodash';
import Layout from '../components/layout';
import SEO from '../components/seo';
import Section from '../components/section';
import { getGatewayFunctions } from '../components/todo/util';
import LoginForm from '../components/todo/loginForm';
import Dashboard from '../components/todo/dashboard';
import TodoTable from '../components/todo/todoTable';

import '../css/styles.css';

/**
 * All schemas must create empty rows as arrays, starting with the numeric string `id`,
 * and containing the field values in the other elements.
 */
const todoSchema = {
  version: 1,
  columns: [{ label: 'Item' }, { label: 'Date' }],
  emptyRow: function(id) {
    return [id.toString(), '', ''];
  },
  isValidRow: function(row) {
    return row.length === 3 && Number.isInteger(parseInt(row[0], 10));
  },
};

function reducer(state, action) {
  switch (action.type) {
    case 'logout':
      localStorage.removeItem('auth_token');
      return {
        view: 'login',
      };
    case 'login':
      localStorage.setItem('auth_token', action.token);
      return {
        view: 'sheet-list-loading',
        gateway: getGatewayFunctions(action.token),
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
        view: 'sheet-list',
      };
    default:
      throw new Error('Unknown action');
  }
}

function TodoApp({ query }) {
  const [state, dispatch] = useReducer(reducer, {
    view: 'none',
  });
  if (state.view === 'none' && typeof window !== 'undefined') {
    const prevToken = localStorage.getItem('auth_token');
    if (prevToken !== null) {
      dispatch({
        type: 'login',
        token: prevToken,
      });
    } else {
      dispatch({
        type: 'logout',
      });
    }
  }

  useEffect(() => {
    if (state.gateway == null) return;

    const { name } = qs.parse(query.replace(/^\?/, ''));
    if (name) {
      dispatch({
        type: 'open',
        sheet: {
          name,
          status: 'saved',
          schema: todoSchema,
        },
      });
    } else {
      dispatch({
        type: 'close',
      });
    }
  }, [state.gateway, query]);

  useEffect(() => {
    if (state.gateway == null) return;

    let ignore = false;
    state.gateway.list().then(({ bins }) => {
      if (!ignore && Array.isArray(bins)) {
        const sheetList = bins.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        dispatch({ type: 'sheet-list-loaded', sheetList });
      }
    });
    return () => {
      ignore = true;
    };
  }, [state.gateway, state.sheet]);

  let mainView = null;
  if (state.view === 'login') {
    const handleLogin = token => {
      localStorage.setItem('auth_token', token);
      dispatch({
        type: 'login',
        token,
      });
    };
    mainView = <LoginForm handleLogin={handleLogin} />;
  } else if (state.view === 'sheet-list') {
    const handleBack = () => {
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
          schema: todoSchema,
        },
      });
    };
    const handleOpen = name => {
      navigate(`?name=${name}`);
      dispatch({
        type: 'open',
        sheet: {
          name,
          status: 'saved',
          schema: todoSchema,
        },
      });
    };
    mainView = (
      <Dashboard
        bins={state.sheetList}
        handleBack={handleBack}
        handleCreate={handleCreate}
        handleOpen={handleOpen}
      />
    );
  } else if (state.view === 'sheet') {
    const handleClose = () => {
      dispatch({
        type: 'close',
      });
    };
    const handleName = name => {
      dispatch({
        type: 'modify-sheet',
        sheet: {
          name,
          status: 'unsaved',
        },
      });
    };
    mainView = (
      <TodoTable
        sheet={state.sheet}
        gateway={state.gateway}
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

      <TodoApp query={location.search} />
    </Layout>
  );
};

export default TodoPage;
