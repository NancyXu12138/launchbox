/**
 * 应用设置服务 (Application Settings Service)
 * 
 * 📋 功能说明：
 * 管理应用的全局配置，包括后端API地址等设置。
 * 所有设置数据保存在浏览器的 localStorage 中。
 * 
 * 🎯 主要功能：
 * - 保存/读取后端API地址
 * - 控制是否使用后端API
 * - 提供默认配置
 * 
 * 💾 存储位置：
 * localStorage key: 'launchbox_settings_v2'
 * 
 * 🔧 使用示例：
 * ```typescript
 * // 读取设置
 * const settings = getAppSettings();
 * console.log(settings.backendUrl); // "http://localhost:8001"
 * 
 * // 保存设置
 * setAppSettings({
 *   backendUrl: "http://localhost:8001",
 *   useBackendApi: true
 * });
 * ```
 * 
 * @module settings
 */

/**
 * 应用设置类型定义
 */
export type AppSettings = {
  /** 后端API服务器地址 */
  backendUrl: string;
  
  /** 是否使用后端API（默认: true） */
  useBackendApi: boolean;
};

/** localStorage 存储键名 */
const STORAGE_KEY = 'launchbox_settings_v2';

/**
 * 默认应用设置
 * 
 * 如果用户首次使用或清空了设置，将使用这些默认值
 */
const defaultAppSettings: AppSettings = {
  backendUrl: 'http://localhost:8001',  // 默认后端地址
  useBackendApi: true                    // 默认使用后端API
};

/**
 * 获取应用设置
 * 
 * 从 localStorage 读取设置，如果不存在或读取失败，返回默认设置。
 * 
 * @returns {AppSettings} 应用设置对象
 * 
 * @example
 * ```typescript
 * const settings = getAppSettings();
 * if (settings.useBackendApi) {
 *   // 使用后端API
 *   fetch(`${settings.backendUrl}/api/chat`, ...);
 * }
 * ```
 */
export function getAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    
    // 如果没有保存过设置，返回默认值
    if (!raw) return defaultAppSettings;
    
    // 解析保存的设置，并与默认值合并（防止字段缺失）
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return { ...defaultAppSettings, ...parsed };
  } catch (error) {
    // 如果解析失败，返回默认值
    console.warn('读取应用设置失败，使用默认设置:', error);
    return defaultAppSettings;
  }
}

/**
 * 保存应用设置
 * 
 * 将设置对象序列化为JSON并保存到 localStorage。
 * 
 * @param {AppSettings} next - 要保存的设置对象
 * 
 * @example
 * ```typescript
 * setAppSettings({
 *   backendUrl: "http://192.168.1.100:8001",
 *   useBackendApi: true
 * });
 * ```
 */
export function setAppSettings(next: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    console.log('✅ 应用设置已保存:', next);
  } catch (error) {
    console.error('❌ 保存应用设置失败:', error);
  }
}

/**
 * 重置为默认设置
 * 
 * 清除所有自定义设置，恢复为默认值。
 * 
 * @example
 * ```typescript
 * resetAppSettings();
 * ```
 */
export function resetAppSettings(): void {
  setAppSettings(defaultAppSettings);
  console.log('🔄 已重置为默认设置');
}
