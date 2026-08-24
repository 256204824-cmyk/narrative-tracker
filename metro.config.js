// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite 的 Web 实现通过 wa-sqlite.wasm 提供 SQLite，
// Metro 默认不解析 .wasm，需要显式登记为资源扩展名。
config.resolver.assetExts.push('wasm');

module.exports = config;
