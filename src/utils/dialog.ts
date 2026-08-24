// Web 回退实现。
//
// react-native-web 不实现 Alert.alert —— 带按钮的调用是彻底的空操作，
// 确认框不会出现，错误提示也完全不可见。在 Web 上调试时这会让
// 「删除数据」这类流程看起来毫无反应，所以这里改用浏览器原生对话框。

export function notify(title: string, message?: string): void {
  window.alert(message ? `${title}\n\n${message}` : title);
}

export async function confirmDestructive(
  title: string,
  message: string,
  _confirmLabel: string
): Promise<boolean> {
  return window.confirm(`${title}\n\n${message}`);
}
