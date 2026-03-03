import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../config/firebase";

export type UserRole = "user" | "admin";

export interface UserData {
  _id: string; // MongoDB ID
  firebaseUid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  role: UserRole;
  createdAt: Date;
  emailVerified: boolean;
  provider: string;
  resumesGenerated: number;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          handleUserLoggedOut();
          return;
        }

        // Determine provider
        const providerId = fbUser.providerData[0]?.providerId || "unknown";
        const isPasswordProvider = providerId === "password";

        //  SECURITY: Force unverified email/password users to be treated as logged out.
        // We do NOT call signOut() here to avoid loops.
        if (isPasswordProvider && !fbUser.emailVerified) {
          handleUserLoggedOut();
          return;
        }

        //  User is authenticated and verified (or using a provider that doesn't need it)
        setUser(fbUser);
        
        // Sync with MongoDB Backend
        await syncWithBackend(fbUser);
        
      } catch (error) {
        console.error("Auth state change error:", error);
        handleUserLoggedOut();
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUserLoggedOut = () => {
    setUser(null);
    setUserData(null);
    setLoading(false);
  };

  const syncWithBackend = async (fbUser: User) => {
    try {
      //  Force token refresh to ensure custom claims (like verified email) are up-to-date
      const token = await fbUser.getIdToken(true);
      
      const response = await fetch("http://localhost:4000/api/auth/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
            setUserData(data.user);
            console.log("✅ Backend sync successful:", data.user.email);
        }
      } else {
        const error = await response.json();
        console.warn("⚠️ Backend sync failed:", error.message);
        // If sync fails (e.g. server error), we might want to retry or just log it.
        // For now, valid Firebase user but potentially out-of-sync MongoDB data.
      }
    } catch (error) {
      console.warn("Backend sync network error:", error);
    }
  };

  const isAdmin = userData?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
