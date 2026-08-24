// Web 回退实现。
//
// expo-sharing 在浏览器里 isAvailableAsync() 返回 false，
// 原来的代码会退回去提示一个 file:// 路径——那个路径用户根本拿不到，
// 等于导出功能在 Web 上静默失效。这里改成触发一次真正的下载。

export async function saveTextFile(
  filename: string,
  content: string,
  _dialogTitle: string
): Promise<string> {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return filename;
}
