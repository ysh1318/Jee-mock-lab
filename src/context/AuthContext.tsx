import React, { createContext, useContext, useState, useEffect } from "react";
import { UserAccount, UserProfile } from "../types";

interface AuthContextType {
  userAccount: UserAccount | null;
  userProfile: UserProfile;
  setUserAccount: (account: UserAccount | null) => void;
  setUserProfile: (profile: UserProfile) => void;
  updateCredits: (credits: number) => void;
  logout: () => void;
  refreshWallet: () => Promise<void>;
}

const defaultProfile: UserProfile = {
  category: "General",
  homeState: "Maharashtra",
  gender: "Neutral",
  targetPercentile: 98.5
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userAccount, setUserAccountState] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem("jee_user_account");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [userProfile, setUserProfileState] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem("jee_user_profile");
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultProfile;
  });

  const setUserAccount = (account: UserAccount | null) => {
    setUserAccountState(account);
    if (account) {
      localStorage.setItem("jee_user_account", JSON.stringify(account));
    } else {
      localStorage.removeItem("jee_user_account");
    }
  };

  const setUserProfile = (profile: UserProfile) => {
    setUserProfileState(profile);
    localStorage.setItem("jee_user_profile", JSON.stringify(profile));
  };

  const updateCredits = (credits: number) => {
    if (!userAccount) return;
    const updated = { ...userAccount, credits };
    setUserAccount(updated);
  };

  const logout = () => {
    setUserAccount(null);
  };

  const refreshWallet = async () => {
    if (!userAccount?.id) return;
    try {
      const res = await fetch(`/api/user/${userAccount.id}/wallet`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.credits !== undefined && data.credits !== userAccount.credits) {
          updateCredits(data.credits);
        }
      }
    } catch (err) {
      console.warn("[AuthContext] Failed to refresh wallet:", err);
    }
  };

  // Periodic wallet balance sync
  useEffect(() => {
    if (!userAccount?.id) return;
    const interval = setInterval(refreshWallet, 6000);
    return () => clearInterval(interval);
  }, [userAccount?.id, userAccount?.credits]);

  return (
    <AuthContext.Provider
      value={{
        userAccount,
        userProfile,
        setUserAccount,
        setUserProfile,
        updateCredits,
        logout,
        refreshWallet
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
