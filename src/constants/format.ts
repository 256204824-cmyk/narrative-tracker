/**
 * 导出文件的格式版本。改动 schema 时递增，并在 importValidation 里处理旧版本。
 *
 * 单独放在这里（而不是 database/index.ts）是为了让导入校验层不依赖
 * expo-sqlite —— 纯逻辑要能脱离原生模块单独测试。
 */
export const EXPORT_FORMAT_VERSION = 1;
