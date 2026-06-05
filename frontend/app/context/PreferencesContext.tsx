"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface Preferences {
  theme: 'light' | 'dark';
  language: 'en' | 'fr';
  fontSize: 'small' | 'medium' | 'large';
  emailNotifications: boolean;
}

interface PreferencesContextType {
  preferences: Preferences;
  updatePreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
}

const defaultPreferences: Preferences = {
  theme: 'light',
  language: 'en',
  fontSize: 'medium',
  emailNotifications: true,
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ 
  children, 
  initialPreferences 
}: { 
  children: React.ReactNode;
  initialPreferences?: string;
}) {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (initialPreferences) {
      try {
        return JSON.parse(initialPreferences);
      } catch (e) {
        // Fallback to default if parsing fails
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    Cookies.set('preferences', JSON.stringify(preferences), { expires: 365 });
    
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [preferences]);

  const updatePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <PreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}