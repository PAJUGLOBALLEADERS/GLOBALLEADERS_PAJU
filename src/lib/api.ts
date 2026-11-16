import type { ConsultationInquiry, InquiryStatus, SiteData } from '../shared/siteTypes.ts';

const TOKEN_STORAGE_KEY = 'gl_admin_token';

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
  const res = await fetch('/api/site-data');
  if (!res.ok) {
    throw new Error('홈페이지 데이터를 불러오지 못했습니다.');
  }
  return res.json() as Promise<SiteData>;
}

export async function updateSiteData(token: string, data: SiteData): Promise<SiteData> {
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

export async function resetSiteData(token: string): Promise<SiteData> {
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

export async function loginAdmin(password: string): Promise<string> {
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

export async function verifyAdminToken(token: string): Promise<boolean> {
  if (!token) return false;
  const res = await fetch('/api/admin/verify', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { valid: boolean };
  return data.valid;
}

export async function changeAdminPassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
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
}

export async function uploadImageFile(token: string, file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });

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

export async function submitInquiry(payload: {
  parentName: string;
  phone: string;
  childAge: string;
  desiredProgram: string;
  message: string;
}): Promise<ConsultationInquiry> {
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

export async function fetchInquiries(token: string): Promise<ConsultationInquiry[]> {
  const res = await fetch('/api/inquiries', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || '상담 목록을 불러오지 못했습니다.');
  }
  return res.json() as Promise<ConsultationInquiry[]>;
}

export async function updateInquiry(
  token: string,
  id: string,
  updates: { status?: InquiryStatus; adminMemo?: string }
): Promise<ConsultationInquiry> {
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

export async function deleteInquiry(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/inquiries/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || '상담 내역 삭제에 실패했습니다.');
  }
}
