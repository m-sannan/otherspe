import type { UpiSource } from "./upi";

export type RequestStatus = "waiting" | "got-it";

export type SavedRequest = {
  id: string;
  createdAt: number;
  vpa: string;
  name: string;
  amount: number;
  note: string;
  mcc: string;
  txnRef: string;
  source: UpiSource;
  raw: string;
  status: RequestStatus;
};

export const HISTORY_KEY = "otherspe:requests";
export const ONBOARDED_KEY = "otherspe:onboarded";
const MAX_ITEMS = 50;

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const memory = new Map<string, string>();

const memoryStorage: StorageLike = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => {
    memory.set(key, value);
  },
};

export function getAppStorage(): StorageLike {
  try {
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {
    /* private mode */
  }
  return memoryStorage;
}

export function isOnboarded(storage: StorageLike = getAppStorage()): boolean {
  return storage.getItem(ONBOARDED_KEY) === "1";
}

export function setOnboarded(storage: StorageLike = getAppStorage()): void {
  storage.setItem(ONBOARDED_KEY, "1");
}

export function loadRequests(storage: StorageLike = getAppStorage()): SavedRequest[] {
  const raw = storage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedRequest);
  } catch {
    return [];
  }
}

export function saveRequests(
  items: SavedRequest[],
  storage: StorageLike = getAppStorage(),
): void {
  storage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function upsertRequest(
  item: SavedRequest,
  storage: StorageLike = getAppStorage(),
): SavedRequest[] {
  const next = [item, ...loadRequests(storage).filter((r) => r.id !== item.id)].slice(
    0,
    MAX_ITEMS,
  );
  saveRequests(next, storage);
  return next;
}

export function setRequestStatus(
  id: string,
  status: RequestStatus,
  storage: StorageLike = getAppStorage(),
): SavedRequest[] {
  const next = loadRequests(storage).map((r) => (r.id === id ? { ...r, status } : r));
  saveRequests(next, storage);
  return next;
}

export function deleteRequest(
  id: string,
  storage: StorageLike = getAppStorage(),
): SavedRequest[] {
  const next = loadRequests(storage).filter((r) => r.id !== id);
  saveRequests(next, storage);
  return next;
}

function isSavedRequest(value: unknown): value is SavedRequest {
  if (!value || typeof value !== "object") return false;
  const v = value as SavedRequest;
  return (
    typeof v.id === "string" &&
    typeof v.vpa === "string" &&
    typeof v.name === "string" &&
    typeof v.amount === "number" &&
    (v.status === "waiting" || v.status === "got-it")
  );
}
