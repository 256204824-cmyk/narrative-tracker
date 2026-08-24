import { File } from 'expo-file-system';

/** 读取 DocumentPicker 返回的 uri（原生端是 file:// 路径） */
export async function readTextFile(uri: string): Promise<string> {
  return new File(uri).text();
}
