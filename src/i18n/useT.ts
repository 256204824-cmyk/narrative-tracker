import { useAppState } from '../store/AppContext';
import { messagesFor } from './index';
import type { Messages } from './types';

/** 界面里取当前语言的文案：`const t = useT(); t.home.title` */
export function useT(): Messages {
  return messagesFor(useAppState().locale);
}
