import { createContext, useContext, useState, ReactNode } from "react";

type AuthMode = "login" | "signup";

interface AuthModalContextType {
  isOpen: boolean;
  mode: AuthMode;
  openLogin: () => void;
  openSignup: () => void;
  closeAuth: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(
  undefined
);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const openLogin = () => {
    setMode("login");
    setIsOpen(true);
  };

  const openSignup = () => {
    setMode("signup");
    setIsOpen(true);
  };

  const closeAuth = () => {
    setIsOpen(false);
  };

  return (
    <AuthModalContext.Provider
      value={{ isOpen, mode, openLogin, openSignup, closeAuth }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used inside AuthModalProvider");
  }
  return ctx;
};
