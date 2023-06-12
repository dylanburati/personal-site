import React, { useState, useEffect, useMemo, useCallback } from "react";
import { fail } from "../../helpers/lang";
import HttpClient from "../../services/httpClient";

const baseUrl = "https://datagame.live";
const tokenStoreKey = "chat/auth_token";

function localStorageOrDefault<T>(key: string, dfault: T): string | T {
  if (typeof window === "undefined") {
    return dfault;
  }
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : dfault;
  } catch {}
  return dfault;
}

export type User = {
  id: string;
  username: string;
};

type RegisterParams =
  | {
      username: string;
      password: string;
    }
  | { isGuest: true };

export type RegisterResult = {
  success: boolean;
};

export type LoginResult = {
  success: boolean;
};

export type UserContextType = {
  token: string | null;
  authHttp: HttpClient | null;
  user: User | null;
  userLoading: boolean;
  createGuest: () => Promise<RegisterResult>;
  register: (username: string, password: string) => Promise<RegisterResult>;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
};

export const UserContext = React.createContext<UserContextType>({
  token: null,
  authHttp: null,
  user: null,
  userLoading: false,
  createGuest: () => fail(),
  register: () => fail(),
  login: () => fail(),
  logout: () => {},
});

export function UserProvider(props) {
  const [token, setToken] = useState(() =>
    localStorageOrDefault(tokenStoreKey, null)
  );
  const [user, setUser] = useState<User | null>(null);
  const clearUser = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);
  const detect401 = useCallback(
    (resp: Response) => {
      if (resp.status === 401) {
        clearUser();
      }
    },
    [clearUser]
  );
  const [http] = useState(() => new HttpClient(baseUrl));
  const authHttp = useMemo(() => {
    if (!token) return null;
    const client = new HttpClient(baseUrl, {
      "X-Access-Token": token,
    });
    client.addResponseListener(detect401);
    return client;
  }, [detect401, token]);
  useEffect(() => {
    if (authHttp && !user) {
      authHttp.get("/me").then((json) => {
        if (json.success) {
          setUser({ id: json.userId, username: json.username });
        }
      });
    }
  }, [authHttp, detect401, token, user]);

  const createUser = async (input: RegisterParams) => {
    const json = await http.post("/u", input);
    if (json.success) {
      localStorage.setItem(tokenStoreKey, json.token);
      setToken(json.token);
      setUser({ id: json.userId, username: json.username });
    }
    return json;
  };
  const register = (username: string, password: string) =>
    createUser({ username, password });
  const createGuest = () => createUser({ isGuest: true });
  const login = async (username: string, password: string) => {
    const json = await http.post("/login", {
      username,
      password,
    });
    if (json.success) {
      localStorage.setItem(tokenStoreKey, json.token);
      setToken(json.token);
      setUser({ id: json.userId, username: json.username });
    }
    return json;
  };
  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(tokenStoreKey);
    }
    clearUser();
  };

  return (
    <UserContext.Provider
      value={{
        token,
        authHttp,
        user,
        userLoading: token !== null && !user,
        createGuest,
        register,
        login,
        logout,
      }}
    >
      {props.children}
    </UserContext.Provider>
  );
}
