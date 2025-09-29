export type OllamaSettings = {
  baseUrl: string; // e.g. '/ollama' (proxied) or 'http://127.0.0.1:11434'
  model: string; // e.g. 'llama3.1' or 'qwen2.5:7b'
};

export type AppSettings = {
  // Ollama settings (legacy)
  ollama: OllamaSettings;
  
  // Backend API settings (new)
  backendUrl: string;
  useBackendApi: boolean; // 是否使用后端API而不是Ollama
};

const STORAGE_KEY = 'launchbox_settings_v2';

const defaultOllamaSettings: OllamaSettings = {
  baseUrl: '/ollama',
  model: 'llama3.1'
};

const defaultAppSettings: AppSettings = {
  ollama: defaultOllamaSettings,
  backendUrl: 'http://localhost:8001',
  useBackendApi: true // 默认使用后端API
};

// Legacy function for backward compatibility
export function getSettings(): OllamaSettings {
  const appSettings = getAppSettings();
  return appSettings.ollama;
}

// Legacy function for backward compatibility
export function setSettings(next: OllamaSettings): void {
  const appSettings = getAppSettings();
  appSettings.ollama = next;
  setAppSettings(appSettings);
}

// New functions for app settings
export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAppSettings;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...defaultAppSettings, ...parsed };
  } catch {
    return defaultAppSettings;
  }
}

export function setAppSettings(next: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}


