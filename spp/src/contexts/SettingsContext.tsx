import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SchoolSettings } from '../types';

interface SettingsContextType {
  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  isLoading: boolean;
  isConnectedSSE: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DEFAULT_SETTINGS: SchoolSettings = {
  id: 'set-ptdarrahman-01',
  name: 'PTDARRAHMAN',
  address: 'Jl. Raya Pesantren No. 99, Cibinong, Bogor, Jawa Barat 16914',
  phone: '(021) 8765-4321',
  email: 'info@ptdarrahman.sch.id',
  logo: `${API_BASE}/settings/logo/default`,
  favicon: `${API_BASE}/settings/logo/default`,
  spp_nominal_default: 1500000,
  academic_year_current: '2025/2026',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const cached = localStorage.getItem('spp_school_settings');
    if (cached) {
      try { return { ...DEFAULT_SETTINGS, ...JSON.parse(cached) }; } catch { /* ignore */ }
    }
    return DEFAULT_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isConnectedSSE, setIsConnectedSSE] = useState(false);

  useEffect(() => {
    localStorage.setItem('spp_school_settings', JSON.stringify(settings));

    if (settings.name) {
      document.title = `SPP Panel - ${settings.name}`;
    }

    const faviconUrl = settings.favicon || settings.logo || `${API_BASE}/settings/logo/default`;
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  }, [settings]);

  useEffect(() => {
    setIsLoading(true);

    const loadSettings = () => {
      fetch(`${API_BASE}/settings`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch settings');
          return res.json();
        })
        .then((data: Record<string, string>) => {
          if (data && typeof data === 'object') {
            const logo = data['school_logo'] || data['logo'];
            const schoolName = data['school_name'];
            const phone = data['school_phone'];
            const address = data['school_address'];

            setSettings((prev) => ({
              ...prev,
              ...(logo ? { logo, favicon: logo } : {}),
              ...(schoolName ? { name: schoolName } : {}),
              ...(phone ? { phone } : {}),
              ...(address ? { address } : {}),
            }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
        });
    };

    loadSettings();

    const sseUrl = `${API_BASE}/sse/events`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('open', () => setIsConnectedSSE(true));
      es.addEventListener('settings_changed', () => {
        loadSettings();
      });
      es.onerror = () => {
        setIsConnectedSSE(false);
      };
    } catch {
      setIsConnectedSSE(false);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  const updateSettings = (newSettings: Partial<SchoolSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        isLoading,
        isConnectedSSE,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
