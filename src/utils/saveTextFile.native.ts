import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/** 原生端：写进沙盒后走系统分享面板 */
export async function saveTextFile(
  filename: string,
  content: string,
  dialogTitle: string
): Promise<string> {
  const file = new File(Paths.document, filename);
  await file.write(content);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle });
  }
  return file.uri;
}
