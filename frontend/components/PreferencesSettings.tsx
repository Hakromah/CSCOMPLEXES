"use client"

import { usePreferences } from '@/app/context/PreferencesContext';

export default function PreferencesSettings() {
  const { preferences, updatePreference } = usePreferences();

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* Theme */}
      <div>
        <label htmlFor="theme" className="block text-sm font-medium mb-2">Theme</label>
        <select
          id="theme"
          value={preferences.theme}
          onChange={(e) => updatePreference('theme', e.target.value as 'light' | 'dark')}
          className="w-full p-2 border rounded"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>

      {/* Language */}
      <div>
        <label htmlFor="language" className="block text-sm font-medium mb-2">Language</label>
        <select
          id="language"
          value={preferences.language}
          onChange={(e) => updatePreference('language', e.target.value as 'en' | 'fr')}
          className="w-full p-2 border rounded"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
        </select>
      </div>

      {/* Font Size */}
      <div>
        <label htmlFor="fontSize" className="block text-sm font-medium mb-2">Font Size</label>
        <select
          id="fontSize"
          value={preferences.fontSize}
          onChange={(e) => updatePreference('fontSize', e.target.value as 'small' | 'medium' | 'large')}
          className="w-full p-2 border rounded"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Email Notifications */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={preferences.emailNotifications}
            onChange={(e) => updatePreference('emailNotifications', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm font-medium">Enable Email Notifications</span>
        </label>
      </div>
    </div>
  );
}