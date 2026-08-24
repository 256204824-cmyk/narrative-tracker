// Web 回退实现。
//
// Web 上 DocumentPicker 返回的是 blob:/data: URI，
// expo-file-system 的 File 无法处理（会抛 validatePath is not a function），
// 用 fetch 读取才是正确做法。

export async function readTextFile(uri: string): Promise<string> {
  const res = await fetch(uri);
  if (!res.ok) throw new Error(`读取文件失败 (${res.status})`);
  return res.text();
}
