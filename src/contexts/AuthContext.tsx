import * as React from "react";
import { readJson, writeJson } from "@/lib/storage";
import type { User, UserRole } from "@/types/imani";
import { createId } from "@/lib/id";

const AUTH_KEY = "imani-os:auth:v1";

type AuthState = {
  user?: User;
};

type AuthContextValue = {
  user?: User;
  login: (params: { name: string; email: string; role: UserRole }) => void;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(() => {
    return readJson<AuthState>(AUTH_KEY) ?? {};
  });

  const login = React.useCallback(
    (params: { name: string; email: string; role: UserRole }) => {
      const user: User = {
        id: createId("usr"),
        name: params.name.trim() || "Imani Team",
        email: params.email.trim(),
        role: params.role,
      };
      const next = { user };
      setState(next);
      writeJson(AUTH_KEY, next);
    },
    [],
  );

  const logout = React.useCallback(() => {
    setState({});
    writeJson(AUTH_KEY, {});
  }, []);

  return (
    <AuthContext.Provider value={{ user: state.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
