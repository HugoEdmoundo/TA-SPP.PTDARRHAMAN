import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SchoolSettings } from '../types';

interface SettingsContextType {
  settings: SchoolSettings;
  updateSettings: (newSettings: Partial<SchoolSettings>) => void;
  isLoading: boolean;
  isConnectedSSE: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-ptdarrahman.vercel.app';

const DEFAULT_SETTINGS: SchoolSettings = {
  id: 'set-ptdarrahman-01',
  name: 'PTDARRAHMAN',
  address: 'Jl. Raya Pesantren No. 99, Cibinong, Bogor, Jawa Barat 16914',
  phone: '(021) 8765-4321',
  email: 'info@ptdarrahman.sch.id',
  logo: '/download.png',
  favicon: '/download.png',
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

  // Sync favicon and logo dynamically when settings change
  useEffect(() => {
    localStorage.setItem('spp_school_settings', JSON.stringify(settings));

    if (settings.name) {
      document.title = `SPP Panel - ${settings.name}`;
    }

    // Dynamic favicon sync harmonized with Superadmin
    const faviconUrl = settings.favicon || settings.logo || '/download.png';
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconUrl;
  }, [settings]);

  // Harmonize logo & profile loading with Superadmin (GET /companyprofile/settings & SSE events)
  useEffect(() => {
    setIsLoading(true);

    const loadSettingsFromSuperadmin = () => {
      fetch(`${API_BASE}/companyprofile/settings`)
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch company profile');
          return res.json();
        })
        .then((data: { key: string; value: string }[]) => {
          if (Array.isArray(data)) {
            const logo = data.find((s) => s.key === 'logo')?.value;
            const favicon = data.find((s) => s.key === 'favicon')?.value;
            const companyName = data.find((s) => s.key === 'company_name' || s.key === 'name')?.value;
            const phone = data.find((s) => s.key === 'phone' || s.key === 'contact_phone')?.value;
            const address = data.find((s) => s.key === 'address')?.value;
            const email = data.find((s) => s.key === 'email')?.value;

            setSettings((prev) => ({
              ...prev,
              ...(logo ? { logo } : {}),
              ...(favicon ? { favicon } : logo ? { favicon: logo } : {}),
              ...(companyName ? { name: companyName } : {}),
              ...(phone ? { phone } : {}),
              ...(address ? { address } : {}),
              ...(email ? { email } : {}),
            }));
          }
        })
        .catch(() => {
          // Fallback gracefully to local cached settings if API is unreachable
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    loadSettingsFromSuperadmin();

    // Listen to Superadmin SSE EventSource for live updates
    const sseUrl = `${API_BASE}/companyprofile/events`;
    let es: EventSource | null = null;
    try {
      es = new EventSource(sseUrl);
      es.addEventListener('open', () => setIsConnectedSSE(true));
      es.addEventListener('change', () => {
        loadSettingsFromSuperadmin();
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
