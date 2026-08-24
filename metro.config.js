// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite 的 Web 实现通过 wa-sqlite.wasm 提供 SQLite，
// Metro 默认不解析 .wasm，需要显式登记为资源扩展名。
config.resolver.assetExts.push('wasm');

// 演示数据只该存在于开发构建里。Metro 不做 code splitting，
// 光靠 __DEV__ 或动态 import() 都拦不住——必须在解析层换成空壳，
// 否则 100KB 演示文本（十种语言）会跟着正式包一起发出去。
const path = require('path');
const defaultResolve = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (!context.dev && /(^|\/)dev\/seed$/.test(moduleName)) {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'src/dev/seedStub.ts'),
    };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
