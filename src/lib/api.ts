import { DEFAULT_SITE_DATA } from '../shared/defaultSiteData.ts';
import type { ConsultationInquiry, InquiryStatus, SiteData } from '../shared/siteTypes.ts';

const TOKEN_STORAGE_KEY = 'gl_admin_token';
const STATIC_SITE_DATA_KEY = 'gl_static_site_data_v1';
const STATIC_INQUIRIES_KEY = 'gl_static_inquiries_v1';
const STATIC_PASSWORD_KEY = 'gl_static_admin_pw_v1';
const STATIC_TOKEN_PREFIX = 'gl-static-session:';

let cachedBackendAvailable: boolean | null = null;

const SEED_INQUIRIES: ConsultationInquiry[] = [
  {
    id: 'inq-seed-1',
    parentName: '김서연 어머님',
    phone: '010-4821-1904',
    childAge: '6세 (2022년생)',
    desiredProgram: 'GrapeSeed 영어 · 종일반',
    message:
      '27년도 6세 반 입학 및 등하원 차량 노선 문의드립니다. 이번 주 목요일 오후 방문 상담 가능할까요?',
    status: '상담예약',
    adminMemo: '목요일 오후 2시 방문 상담 예약 완료',
    createdAt: '2026-11-15T05:20:00.000Z',
  },
  {
    id: 'inq-seed-2',
    parentName: '박준호 아버님',
    phone: '010-7712-3089',
    childAge: '5세 (2023년생)',
    desiredProgram: '5세 종일반 (몬테소리 · 영어)',
    message:
      '기적의 놀이터와 단독 건물 환경이 마음에 들어 입학 상담 신청합니다. 교습비 상세 안내 부탁드립니다.',
    status: '대기중',
    adminMemo: '',
    createdAt: '2026-11-16T00:15:00.000Z',
  },
];

function isJsonResponse(res: Response): boolean {
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json');
}

async function hasBackend(): Promise<boolean> {
  if (cachedBackendAvailable !== null) {
    return cachedBackendAvailable;
  }
  try {
    const res = await fetch('/api/health');
    if (res.ok && isJsonResponse(res)) {
      cachedBackendAvailable = true;
      return true;
    }
  } catch {
    // static hosting fallback
  }
  cachedBackendAvailable = false;
  return false;
}

export function isStaticHostingMode(): boolean {
  return cachedBackendAvailable === false;
}

function readStaticSiteData(): SiteData {
  try {
    const raw = localStorage.getItem(STATIC_SITE_DATA_KEY);
    if (!raw) return DEFAULT_SITE_DATA;
    const parsed = JSON.parse(raw) as Partial<SiteData>;
    return { ...DEFAULT_SITE_DATA, ...parsed };
  } catch {
    return DEFAULT_SITE_DATA;
  }
}

function writeStaticSiteData(data: SiteData): SiteData {
  const nextData: SiteData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STATIC_SITE_DATA_KEY, JSON.stringify(nextData));
  } catch {
    // ignore storage quota errors
  }
  return nextData;
}

function readStaticInquiries(): ConsultationInquiry[] {
  try {
    const raw = localStorage.getItem(STATIC_INQUIRIES_KEY);
    if (!raw) {
      localStorage.setItem(STATIC_INQUIRIES_KEY, JSON.stringify(SEED_INQUIRIES));
      return SEED_INQUIRIES;
    }
    return JSON.parse(raw) as ConsultationInquiry[];
  } catch {
    return SEED_INQUIRIES;
  }
}

function writeStaticInquiries(list: ConsultationInquiry[]): void {
  try {
    localStorage.setItem(STATIC_INQUIRIES_KEY, JSON.stringify(list));
  } catch {
    // ignore storage errors
  }
}

function getStaticPassword(): string {
  try {
    return localStorage.getItem(STATIC_PASSWORD_KEY) || 'global2027';
  } catch {
    return 'global2027';
  }
}

export function getStoredAdminToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredAdminToken(token: string): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export async function fetchSiteData(): Promise<SiteData> {
  if (await hasBackend()) {
    const res = await fetch('/api/site-data');
    if (res.ok && isJsonResponse(res)) {
      return res.json() as Promise<SiteData>;
    }
  }
  return readStaticSiteData();
}

export async function updateSiteData(token: string, data: SiteData): Promise<SiteData> {
  if (await hasBackend()) {
    const res = await fetch('/api/site-data', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '저장에 실패했습니다.');
    }
    return res.json() as Promise<SiteData>;
  }
  return writeStaticSiteData(data);
}

export async function resetSiteData(token: string): Promise<SiteData> {
  if (await hasBackend()) {
    const res = await fetch('/api/site-data/reset', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '초기화에 실패했습니다.');
    }
    return res.json() as Promise<SiteData>;
  }
  return writeStaticSiteData(DEFAULT_SITE_DATA);
}

export async function loginAdmin(password: string): Promise<string> {
  if (await hasBackend()) {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '로그인에 실패했습니다.');
    }
    const data = (await res.json()) as { token: string };
    return data.token;
  }

  if (password !== getStaticPassword()) {
    throw new Error('비밀번호가 일치하지 않습니다.');
  }
  return `${STATIC_TOKEN_PREFIX}${Date.now()}`;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token) return false;
  if (await hasBackend()) {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { valid: boolean };
    return data.valid;
  }
  return token.startsWith(STATIC_TOKEN_PREFIX);
}

export async function changeAdminPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  if (await hasBackend()) {
    const res = await fetch('/api/admin/password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '비밀번호 변경에 실패했습니다.');
    }
    return;
  }

  if (currentPassword !== getStaticPassword()) {
    throw new Error('현재 비밀번호가 일치하지 않습니다.');
  }
  if (newPassword.length < 4) {
    throw new Error('새 비밀번호는 최소 4자 이상이어야 합니다.');
  }
  try {
    localStorage.setItem(STATIC_PASSWORD_KEY, newPassword);
  } catch {
    // ignore
  }
}

export async function uploadImageFile(token: string, file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });

  if (await hasBackend()) {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ filename: file.name, dataUrl }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '이미지 업로드에 실패했습니다.');
    }
    const data = (await res.json()) as { url: string };
    return data.url;
  }

  return dataUrl;
}

export async function submitInquiry(payload: {
  parentName: string;
  phone: string;
  childAge: string;
  desiredProgram: string;
  message: string;
}): Promise<ConsultationInquiry> {
  if (await hasBackend()) {
    const res = await fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '상담 신청 전송에 실패했습니다.');
    }
    return res.json() as Promise<ConsultationInquiry>;
  }

  const list = readStaticInquiries();
  const newItem: ConsultationInquiry = {
    id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    parentName: payload.parentName.trim(),
    phone: payload.phone.trim(),
    childAge: payload.childAge.trim(),
    desiredProgram: (payload.desiredProgram || '입학 전반 상담').trim(),
    message: (payload.message || '').trim(),
    status: '대기중',
    adminMemo: '',
    createdAt: new Date().toISOString(),
  };
  writeStaticInquiries([newItem, ...list]);
  return newItem;
}

export async function fetchInquiries(token: string): Promise<ConsultationInquiry[]> {
  if (await hasBackend()) {
    const res = await fetch('/api/inquiries', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '상담 목록을 불러오지 못했습니다.');
    }
    return res.json() as Promise<ConsultationInquiry[]>;
  }
  return readStaticInquiries().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateInquiry(
  token: string,
  id: string,
  updates: { status?: InquiryStatus; adminMemo?: string }
): Promise<ConsultationInquiry> {
  if (await hasBackend()) {
    const res = await fetch(`/api/inquiries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '상담 상태 업데이트에 실패했습니다.');
    }
    return res.json() as Promise<ConsultationInquiry>;
  }

  const list = readStaticInquiries();
  const idx = list.findIndex((item) => item.id === id);
  if (idx === -1) throw new Error('상담 내역을 찾을 수 없습니다.');
  const updated = {
    ...list[idx],
    ...(updates.status ? { status: updates.status } : {}),
    ...(typeof updates.adminMemo === 'string' ? { adminMemo: updates.adminMemo } : {}),
  };
  list[idx] = updated;
  writeStaticInquiries(list);
  return updated;
}

export async function deleteInquiry(token: string, id: string): Promise<void> {
  if (await hasBackend()) {
    const res = await fetch(`/api/inquiries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error || '상담 내역 삭제에 실패했습니다.');
    }
    return;
  }

  const list = readStaticInquiries().filter((item) => item.id !== id);
  writeStaticInquiries(list);
}
