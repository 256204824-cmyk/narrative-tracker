// Web storage using localStorage
export async function secureGet(key: string): Promise<string | null> {
  return localStorage.getItem(key);
}

export async function secureSet(key: string, value: string): Promise<void> {
  localStorage.setItem(key, value);
}

export async function secureDelete(key: string): Promise<void> {
  localStorage.removeItem(key);
}
