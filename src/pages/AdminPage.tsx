import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CreditCard,
  Download,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Lock,
  LogOut,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Trash2,
  Upload,
} from 'lucide-react';
import { ResilientImage } from '../components/ResilientImage.tsx';
import {
  changeAdminPassword,
  deleteInquiry,
  fetchInquiries,
  getStoredAdminToken,
  loginAdmin,
  resetSiteData,
  setStoredAdminToken,
  updateInquiry,
  updateSiteData,
  uploadImageFile,
  verifyAdminToken,
} from '../lib/api.ts';
import type {
  ConsultationInquiry,
  GalleryCategory,
  InquiryStatus,
  SiteData,
} from '../shared/siteTypes.ts';

interface AdminPageProps {
  siteData: SiteData;
  onSiteDataSaved: (nextData: SiteData) => void;
  onBackToHome: () => void;
}

type AdminTab =
  | 'overview'
  | 'programs'
  | 'gallery'
  | 'tuition'
  | 'inquiries'
  | 'settings';

const TAB_META: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: '기본 정보 · 대시보드' },
  { id: 'programs', label: '교육철학 · 커리큘럼' },
  { id: 'gallery', label: '갤러리 · 영상' },
  { id: 'tuition', label: '교습비 안내' },
  { id: 'inquiries', label: '입학 상담 내역' },
  { id: 'settings', label: '관리자 설정' },
];

const GALLERY_CATEGORIES: GalleryCategory[] = [
  '영어 몰입',
  '말하기 대회',
  '놀이터 · 자연체험',
  '몬테소리 · 창의',
];

const INQUIRY_STATUSES: InquiryStatus[] = ['대기중', '상담예약', '상담완료'];

export function AdminPage({ siteData, onSiteDataSaved, onBackToHome }: AdminPageProps) {
  const [token, setToken] = useState<string>(() => getStoredAdminToken());
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Workspace state
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [draft, setDraft] = useState<SiteData>(siteData);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Inquiries state
  const [inquiries, setInquiries] = useState<ConsultationInquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiryFilter, setInquiryFilter] = useState<'전체' | InquiryStatus>('전체');
  const [inquirySearch, setInquirySearch] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setDraft(siteData);
    }
  }, [siteData, isDirty]);

  useEffect(() => {
    let active = true;
    const check = async () => {
      if (!token) {
        if (active) {
          setAuthenticated(false);
          setAuthChecking(false);
        }
        return;
      }
      const valid = await verifyAdminToken(token);
      if (active) {
        setAuthenticated(valid);
        if (!valid) {
          setStoredAdminToken('');
          setToken('');
        }
        setAuthChecking(false);
      }
    };
    void check();
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!authenticated || !token) return;
    let active = true;
    const load = async () => {
      setInquiriesLoading(true);
      try {
        const list = await fetchInquiries(token);
        if (active) setInquiries(list);
      } catch (err) {
        if (active) {
          showToast(
            'error',
            err instanceof Error ? err.message : '상담 내역을 불러오지 못했습니다.'
          );
        }
      } finally {
        if (active) setInquiriesLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [authenticated, token]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    window.setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const updateDraft = (updater: (prev: SiteData) => SiteData) => {
    setDraft((prev) => updater(prev));
    setIsDirty(true);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const nextToken = await loginAdmin(passwordInput);
      setStoredAdminToken(nextToken);
      setToken(nextToken);
      setAuthenticated(true);
      setPasswordInput('');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setStoredAdminToken('');
    setToken('');
    setAuthenticated(false);
    setIsDirty(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await updateSiteData(token, draft);
      onSiteDataSaved(saved);
      setDraft(saved);
      setIsDirty(false);
      showToast('success', '홈페이지 콘텐츠가 성공적으로 업데이트되었습니다.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (
    key: string,
    file: File | undefined,
    onUrl: (url: string) => void
  ) => {
    if (!file) return;
    setUploadingKey(key);
    try {
      const url = await uploadImageFile(token, file);
      onUrl(url);
      showToast('success', '이미지가 업로드되었습니다. 상단의 저장 버튼을 눌러 반영하세요.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingKey(null);
    }
  };

  const handleInquiryUpdate = async (
    id: string,
    updates: { status?: InquiryStatus; adminMemo?: string }
  ) => {
    try {
      const updated = await updateInquiry(token, id, updates);
      setInquiries((prev) => prev.map((item) => (item.id === id ? updated : item)));
      showToast('success', '상담 상태가 업데이트되었습니다.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '상태 변경에 실패했습니다.');
    }
  };

  const handleInquiryDelete = async (id: string) => {
    try {
      await deleteInquiry(token, id);
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      showToast('success', '상담 내역이 삭제되었습니다.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('error', '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await changeAdminPassword(token, currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast('success', '관리자 비밀번호가 변경되었습니다.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleResetDefaults = async () => {
    try {
      const restored = await resetSiteData(token);
      onSiteDataSaved(restored);
      setDraft(restored);
      setIsDirty(false);
      setResetConfirmOpen(false);
      showToast('success', '초기 네이버 사이트 원본 콘텐츠로 복원되었습니다.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : '초기화에 실패했습니다.');
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `global-leaders-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      if (inquiryFilter !== '전체' && item.status !== inquiryFilter) return false;
      if (inquirySearch.trim()) {
        const q = inquirySearch.trim().toLowerCase();
        return (
          item.parentName.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          item.childAge.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inquiries, inquiryFilter, inquirySearch]);

  const pendingCount = inquiries.filter((i) => i.status === '대기중').length;

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <p className="text-sm text-[#52525B]">관리자 세션 확인 중...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-[#E5E5DF] rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-medium text-[#3B28CC] mb-1">
                {siteData.englishName} ADMIN
              </p>
              <h1 className="font-display text-2xl font-bold text-[#18181B]">
                관리자 로그인
              </h1>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#F2F2EE] flex items-center justify-center text-[#18181B]">
              <Lock className="w-5 h-5" />
            </div>
          </div>

          <p className="text-sm text-[#52525B] mb-6 leading-relaxed">
            글로벌리더스 홈페이지의 소개글, 커리큘럼, 갤러리 사진, 교습비 및 입학 상담 내역을 관리할 수 있습니다.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-[#3F3F46] mb-1.5"
              >
                관리자 비밀번호
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC] focus:bg-white"
              />
            </div>

            {loginError && (
              <p role="alert" className="text-xs font-medium text-[#DC2626]">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#3B28CC] hover:bg-[#2E1FA3] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {loginLoading ? '확인 중...' : '관리자 콘솔 접속'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E5E5DF] flex items-center justify-between gap-4">
            <p className="text-xs text-[#71717A]">
              초기 비밀번호: <span className="font-mono font-semibold text-[#18181B]">global2027</span>
            </p>
            <button
              type="button"
              onClick={onBackToHome}
              className="text-xs font-medium text-[#3B28CC] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              홈페이지로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentTabLabel = TAB_META.find((t) => t.id === activeTab)?.label || '';

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#18181B] flex flex-col lg:flex-row">
      {/* Left Sidebar (Desktop) */}
      <aside className="lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#E5E5DF] flex flex-col justify-between">
        <div>
          <div className="h-16 px-5 border-b border-[#E5E5DF] flex items-center justify-between">
            <span className="font-display text-base font-bold text-[#18181B] whitespace-nowrap">
              {draft.academyName}
            </span>
            <span className="text-xs font-medium text-[#71717A]">CMS</span>
          </div>

          <nav aria-label="관리자 메뉴" className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
            <SidebarButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="기본 정보"
            />
            <SidebarButton
              active={activeTab === 'programs'}
              onClick={() => setActiveTab('programs')}
              icon={<BookOpen className="w-4 h-4" />}
              label="교육철학 · 커리큘럼"
            />
            <SidebarButton
              active={activeTab === 'gallery'}
              onClick={() => setActiveTab('gallery')}
              icon={<ImageIcon className="w-4 h-4" />}
              label="갤러리 · 영상"
            />
            <SidebarButton
              active={activeTab === 'tuition'}
              onClick={() => setActiveTab('tuition')}
              icon={<CreditCard className="w-4 h-4" />}
              label="교습비 관리"
            />
            <SidebarButton
              active={activeTab === 'inquiries'}
              onClick={() => setActiveTab('inquiries')}
              icon={<Inbox className="w-4 h-4" />}
              label={`상담 신청 (${pendingCount})`}
            />
            <SidebarButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings className="w-4 h-4" />}
              label="관리자 설정"
            />
          </nav>
        </div>

        <div className="hidden lg:block p-4 border-t border-[#E5E5DF] space-y-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="w-full py-2 px-3 text-xs font-medium text-[#18181B] bg-[#FAFAF8] hover:bg-[#F2F2EE] border border-[#E5E5DF] rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            홈페이지 보기
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2 px-3 text-xs font-medium text-[#52525B] hover:text-[#DC2626] rounded-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar with Breadcrumb & Primary Actions */}
        <header className="h-16 bg-white border-b border-[#E5E5DF] px-4 sm:px-8 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-[#52525B] min-w-0">
            <span className="hidden sm:inline truncate">글로벌리더스</span>
            <span className="hidden sm:inline" aria-hidden="true">/</span>
            <span className="hidden sm:inline truncate">관리자 콘솔</span>
            <span className="hidden sm:inline" aria-hidden="true">/</span>
            <span className="font-semibold text-[#18181B] truncate">{currentTabLabel}</span>
            {isDirty && (
              <span className="ml-2 text-xs font-medium text-[#D97706] whitespace-nowrap">
                · 저장되지 않은 변경사항
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onBackToHome}
              className="lg:hidden px-3 py-2 text-xs font-medium text-[#18181B] bg-[#FAFAF8] border border-[#E5E5DF] rounded-lg whitespace-nowrap cursor-pointer"
            >
              홈페이지
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#3B28CC] hover:bg-[#2E1FA3] disabled:opacity-45 rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toast && (
          <div className="mx-4 sm:mx-8 mt-4">
            <div
              role="status"
              className={`px-4 py-3 rounded-lg border text-xs sm:text-sm font-medium flex items-center justify-between ${
                toast.type === 'success'
                  ? 'bg-white border-[#2D6A4F]/40 text-[#2D6A4F]'
                  : 'bg-white border-[#DC2626]/40 text-[#DC2626]'
              }`}
            >
              <span>{toast.text}</span>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs underline ml-4 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        <main className="p-4 sm:p-8 max-w-5xl w-full space-y-8">
          {/* TAB 1: Overview & Basic Info */}
          {activeTab === 'overview' && (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#E5E5DF] rounded-xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5DF] overflow-hidden">
                <div className="p-5">
                  <p className="text-xs text-[#71717A]">대기중 입학 상담</p>
                  <p className="font-mono text-2xl font-semibold text-[#18181B] tabular-nums mt-1">
                    {pendingCount}건
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-xs text-[#71717A]">전체 상담 접수</p>
                  <p className="font-mono text-2xl font-semibold text-[#18181B] tabular-nums mt-1">
                    {inquiries.length}건
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-xs text-[#71717A]">등록된 갤러리 사진</p>
                  <p className="font-mono text-2xl font-semibold text-[#18181B] tabular-nums mt-1">
                    {draft.galleryItems.length}장
                  </p>
                </div>
                <div className="p-5">
                  <p className="text-xs text-[#71717A]">최근 업데이트</p>
                  <p className="font-mono text-sm font-medium text-[#18181B] tabular-nums mt-2">
                    {new Date(draft.updatedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>

              {/* Hero & Identity Form */}
              <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-5">
                <h2 className="text-base font-bold text-[#18181B] border-b border-[#E5E5DF] pb-3">
                  메인 히어로 및 기관 소개 편집
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="학원명 (한국어)"
                    value={draft.academyName}
                    onChange={(v) => updateDraft((p) => ({ ...p, academyName: v }))}
                  />
                  <Field
                    label="영문 표기"
                    value={draft.englishName}
                    onChange={(v) => updateDraft((p) => ({ ...p, englishName: v }))}
                  />
                </div>

                <Field
                  label="상단 안내 문구 (Kicker)"
                  value={draft.heroKicker}
                  onChange={(v) => updateDraft((p) => ({ ...p, heroKicker: v }))}
                />

                <Field
                  label="메인 헤드라인"
                  value={draft.heroHeadline}
                  onChange={(v) => updateDraft((p) => ({ ...p, heroHeadline: v }))}
                />

                <TextAreaField
                  label="기관 소개글"
                  rows={4}
                  value={draft.heroIntro}
                  onChange={(v) => updateDraft((p) => ({ ...p, heroIntro: v }))}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <Field
                    label="히어로 대표 이미지 URL"
                    value={draft.heroImageUrl}
                    onChange={(v) => updateDraft((p) => ({ ...p, heroImageUrl: v }))}
                  />
                  <ImageUploadButton
                    label="새 히어로 사진 업로드"
                    uploading={uploadingKey === 'hero'}
                    onFile={(file) =>
                      void handleUpload('hero', file, (url) =>
                        updateDraft((p) => ({ ...p, heroImageUrl: url }))
                      )
                    }
                  />
                </div>
              </section>

              {/* External Links & Location */}
              <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-5">
                <h2 className="text-base font-bold text-[#18181B] border-b border-[#E5E5DF] pb-3">
                  상담 신청 링크 · SNS · 오시는 길
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="상담 버튼 문구"
                    value={draft.primaryCtaLabel}
                    onChange={(v) => updateDraft((p) => ({ ...p, primaryCtaLabel: v }))}
                  />
                  <Field
                    label="네이버 폼 상담신청 링크"
                    value={draft.naverFormUrl}
                    onChange={(v) => updateDraft((p) => ({ ...p, naverFormUrl: v }))}
                  />
                  <Field
                    label="인스타그램 표시 이름"
                    value={draft.instagramLabel}
                    onChange={(v) => updateDraft((p) => ({ ...p, instagramLabel: v }))}
                  />
                  <Field
                    label="인스타그램 URL"
                    value={draft.instagramUrl}
                    onChange={(v) => updateDraft((p) => ({ ...p, instagramUrl: v }))}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E5E5DF]">
                  <Field
                    label="기관 주소"
                    value={draft.locationAddress}
                    onChange={(v) => updateDraft((p) => ({ ...p, locationAddress: v }))}
                  />
                  <Field
                    label="운영 및 상담 시간"
                    value={draft.locationHours}
                    onChange={(v) => updateDraft((p) => ({ ...p, locationHours: v }))}
                  />
                  <Field
                    label="위치 상세 설명"
                    value={draft.locationDetail}
                    onChange={(v) => updateDraft((p) => ({ ...p, locationDetail: v }))}
                  />
                  <Field
                    label="전화/상담 안내 문구"
                    value={draft.locationPhone}
                    onChange={(v) => updateDraft((p) => ({ ...p, locationPhone: v }))}
                  />
                </div>
              </section>
            </>
          )}

          {/* TAB 2: Philosophy & Curricula */}
          {activeTab === 'programs' && (
            <>
              <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-3">
                  <h2 className="text-base font-bold text-[#18181B]">
                    교육철학 및 환경 ({draft.whyChooseTitle})
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((p) => ({
                        ...p,
                        philosophyPillars: [
                          ...p.philosophyPillars,
                          {
                            id: `pillar-${Date.now()}`,
                            number: String(p.philosophyPillars.length + 1).padStart(2, '0'),
                            category: '교육 특징',
                            title: '새로운 교육 가치',
                            description: '설명을 입력해 주세요.',
                          },
                        ],
                      }))
                    }
                    className="px-3 py-1.5 text-xs font-medium text-[#3B28CC] border border-[#3B28CC]/30 rounded-lg hover:bg-[#3B28CC]/5 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    항목 추가
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <Field
                    label="섹션 제목"
                    value={draft.whyChooseTitle}
                    onChange={(v) => updateDraft((p) => ({ ...p, whyChooseTitle: v }))}
                  />
                  <ImageUploadButton
                    label="캠퍼스 / 놀이터 사진 변경"
                    uploading={uploadingKey === 'campus'}
                    onFile={(file) =>
                      void handleUpload('campus', file, (url) =>
                        updateDraft((p) => ({ ...p, campusImageUrl: url }))
                      )
                    }
                  />
                </div>

                <div className="divide-y divide-[#E5E5DF]">
                  {draft.philosophyPillars.map((pillar, idx) => (
                    <div key={pillar.id} className="py-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-[#3B28CC]">
                          항목 {pillar.number}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({
                              ...p,
                              philosophyPillars: p.philosophyPillars.filter(
                                (x) => x.id !== pillar.id
                              ),
                            }))
                          }
                          className="text-xs text-[#DC2626] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          삭제
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Field
                          label="구분"
                          value={pillar.category}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              philosophyPillars: p.philosophyPillars.map((x, i) =>
                                i === idx ? { ...x, category: v } : x
                              ),
                            }))
                          }
                        />
                        <div className="md:col-span-2">
                          <Field
                            label="제목"
                            value={pillar.title}
                            onChange={(v) =>
                              updateDraft((p) => ({
                                ...p,
                                philosophyPillars: p.philosophyPillars.map((x, i) =>
                                  i === idx ? { ...x, title: v } : x
                                ),
                              }))
                            }
                          />
                        </div>
                      </div>
                      <TextAreaField
                        label="상세 내용"
                        rows={2}
                        value={pillar.description}
                        onChange={(v) =>
                          updateDraft((p) => ({
                            ...p,
                            philosophyPillars: p.philosophyPillars.map((x, i) =>
                              i === idx ? { ...x, description: v } : x
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>

              {/* Curricula */}
              <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-3">
                  <h2 className="text-base font-bold text-[#18181B]">
                    핵심 커리큘럼 ({draft.curricula.length}개)
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((p) => ({
                        ...p,
                        curricula: [
                          ...p.curricula,
                          {
                            id: `curr-${Date.now()}`,
                            number: String(p.curricula.length + 1).padStart(2, '0'),
                            name: '새 프로그램',
                            subtitle: '프로그램 부제목',
                            summary: '프로그램 소개 내용을 입력해 주세요.',
                            highlights: ['주요 교육 특징 1', '주요 교육 특징 2'],
                            imageUrl: draft.heroImageUrl,
                            imageAlt: '새 프로그램 이미지',
                          },
                        ],
                      }))
                    }
                    className="px-3 py-1.5 text-xs font-medium text-[#3B28CC] border border-[#3B28CC]/30 rounded-lg hover:bg-[#3B28CC]/5 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    커리큘럼 추가
                  </button>
                </div>

                <div className="divide-y divide-[#E5E5DF]">
                  {draft.curricula.map((curr, idx) => (
                    <div key={curr.id} className="py-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-[#3B28CC]">
                          {curr.number}. {curr.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({
                              ...p,
                              curricula: p.curricula.filter((x) => x.id !== curr.id),
                            }))
                          }
                          className="text-xs text-[#DC2626] hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          삭제
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          label="프로그램명"
                          value={curr.name}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              curricula: p.curricula.map((x, i) =>
                                i === idx ? { ...x, name: v } : x
                              ),
                            }))
                          }
                        />
                        <Field
                          label="부제목"
                          value={curr.subtitle}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              curricula: p.curricula.map((x, i) =>
                                i === idx ? { ...x, subtitle: v } : x
                              ),
                            }))
                          }
                        />
                      </div>

                      <TextAreaField
                        label="프로그램 설명"
                        rows={2}
                        value={curr.summary}
                        onChange={(v) =>
                          updateDraft((p) => ({
                            ...p,
                            curricula: p.curricula.map((x, i) =>
                              i === idx ? { ...x, summary: v } : x
                            ),
                          }))
                        }
                      />

                      <TextAreaField
                        label="핵심 포인트 (줄바꿈으로 구분)"
                        rows={3}
                        value={curr.highlights.join('\n')}
                        onChange={(v) =>
                          updateDraft((p) => ({
                            ...p,
                            curricula: p.curricula.map((x, i) =>
                              i === idx
                                ? {
                                    ...x,
                                    highlights: v
                                      .split('\n')
                                      .map((line) => line.trim())
                                      .filter(Boolean),
                                  }
                                : x
                            ),
                          }))
                        }
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <Field
                          label="이미지 URL"
                          value={curr.imageUrl}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              curricula: p.curricula.map((x, i) =>
                                i === idx ? { ...x, imageUrl: v } : x
                              ),
                            }))
                          }
                        />
                        <ImageUploadButton
                          label="프로그램 사진 업로드"
                          uploading={uploadingKey === curr.id}
                          onFile={(file) =>
                            void handleUpload(curr.id, file, (url) =>
                              updateDraft((p) => ({
                                ...p,
                                curricula: p.curricula.map((x, i) =>
                                  i === idx ? { ...x, imageUrl: url } : x
                                ),
                              }))
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* TAB 3: Gallery & Videos */}
          {activeTab === 'gallery' && (
            <>
              <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5DF] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-[#18181B]">
                      FUN FUN ENGLISH 포토 갤러리 ({draft.galleryItems.length}장)
                    </h2>
                    <p className="text-xs text-[#71717A] mt-0.5">
                      사진을 추가하거나 기존 활동 사진의 제목/카테고리를 수정할 수 있습니다.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageUploadButton
                      label="사진 파일로 추가"
                      uploading={uploadingKey === 'new-gallery'}
                      onFile={(file) =>
                        void handleUpload('new-gallery', file, (url) =>
                          updateDraft((p) => ({
                            ...p,
                            galleryItems: [
                              {
                                id: `gal-${Date.now()}`,
                                title: '새로운 활동 사진',
                                caption: '활동 설명을 입력해 주세요.',
                                category: '영어 몰입',
                                dateLabel: new Date().toLocaleDateString('ko-KR'),
                                imageUrl: url,
                              },
                              ...p.galleryItems,
                            ],
                          }))
                        )
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft((p) => ({
                          ...p,
                          galleryItems: [
                            {
                              id: `gal-${Date.now()}`,
                              title: '새 갤러리 항목',
                              caption: '활동 설명을 입력해 주세요.',
                              category: '영어 몰입',
                              dateLabel: '최근 활동',
                              imageUrl: draft.heroImageUrl,
                            },
                            ...p.galleryItems,
                          ],
                        }))
                      }
                      className="px-3 py-2 text-xs font-medium text-[#3B28CC] border border-[#3B28CC]/30 rounded-lg hover:bg-[#3B28CC]/5 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      빈 항목 추가
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {draft.galleryItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border border-[#E5E5DF] rounded-xl bg-[#FAFAF8]"
                    >
                      <div className="md:col-span-3 space-y-2">
                        <ResilientImage
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full aspect-[4/3] object-cover rounded-lg border border-[#E5E5DF]"
                        />
                        <ImageUploadButton
                          label="사진 교체"
                          uploading={uploadingKey === item.id}
                          onFile={(file) =>
                            void handleUpload(item.id, file, (url) =>
                              updateDraft((p) => ({
                                ...p,
                                galleryItems: p.galleryItems.map((g, i) =>
                                  i === idx ? { ...g, imageUrl: url } : g
                                ),
                              }))
                            )
                          }
                        />
                      </div>

                      <div className="md:col-span-9 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs text-[#71717A]">
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateDraft((p) => ({
                                ...p,
                                galleryItems: p.galleryItems.filter((g) => g.id !== item.id),
                              }))
                            }
                            className="text-xs text-[#DC2626] hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            삭제
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Field
                            label="제목"
                            value={item.title}
                            onChange={(v) =>
                              updateDraft((p) => ({
                                ...p,
                                galleryItems: p.galleryItems.map((g, i) =>
                                  i === idx ? { ...g, title: v } : g
                                ),
                              }))
                            }
                          />
                          <div>
                            <label className="block text-xs font-medium text-[#3F3F46] mb-1">
                              카테고리
                            </label>
                            <select
                              value={item.category}
                              onChange={(e) =>
                                updateDraft((p) => ({
                                  ...p,
                                  galleryItems: p.galleryItems.map((g, i) =>
                                    i === idx
                                      ? { ...g, category: e.target.value as GalleryCategory }
                                      : g
                                  ),
                                }))
                              }
                              className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5DF] rounded-lg"
                            >
                              {GALLERY_CATEGORIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Field
                            label="시기 / 라벨"
                            value={item.dateLabel}
                            onChange={(v) =>
                              updateDraft((p) => ({
                                ...p,
                                galleryItems: p.galleryItems.map((g, i) =>
                                  i === idx ? { ...g, dateLabel: v } : g
                                ),
                              }))
                            }
                          />
                        </div>

                        <Field
                          label="설명 (캡션)"
                          value={item.caption}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              galleryItems: p.galleryItems.map((g, i) =>
                                i === idx ? { ...g, caption: v } : g
                              ),
                            }))
                          }
                        />

                        <Field
                          label="이미지 경로 / URL"
                          value={item.imageUrl}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              galleryItems: p.galleryItems.map((g, i) =>
                                i === idx ? { ...g, imageUrl: v } : g
                              ),
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Video Links */}
              <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-[#E5E5DF] pb-3">
                  <h2 className="text-base font-bold text-[#18181B]">
                    FUN FUN 글로벌 리더스 영상 하이라이트
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft((p) => ({
                        ...p,
                        videos: [
                          ...p.videos,
                          {
                            id: `vid-${Date.now()}`,
                            title: '새 활동 영상',
                            subtitle: '영상 설명을 입력하세요.',
                            thumbnailUrl: draft.heroImageUrl,
                            videoUrl: draft.instagramUrl,
                            durationLabel: '활동 영상',
                          },
                        ],
                      }))
                    }
                    className="px-3 py-1.5 text-xs font-medium text-[#3B28CC] border border-[#3B28CC]/30 rounded-lg hover:bg-[#3B28CC]/5 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    영상 추가
                  </button>
                </div>

                <div className="space-y-4">
                  {draft.videos.map((vid, idx) => (
                    <div
                      key={vid.id}
                      className="p-4 border border-[#E5E5DF] rounded-xl bg-[#FAFAF8] space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs text-[#71717A]">영상 #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateDraft((p) => ({
                              ...p,
                              videos: p.videos.filter((v) => v.id !== vid.id),
                            }))
                          }
                          className="text-xs text-[#DC2626] hover:underline cursor-pointer"
                        >
                          삭제
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field
                          label="영상 제목"
                          value={vid.title}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              videos: p.videos.map((x, i) => (i === idx ? { ...x, title: v } : x)),
                            }))
                          }
                        />
                        <Field
                          label="구분 라벨"
                          value={vid.durationLabel}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              videos: p.videos.map((x, i) =>
                                i === idx ? { ...x, durationLabel: v } : x
                              ),
                            }))
                          }
                        />
                        <Field
                          label="연결 링크 URL"
                          value={vid.videoUrl}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              videos: p.videos.map((x, i) =>
                                i === idx ? { ...x, videoUrl: v } : x
                              ),
                            }))
                          }
                        />
                        <Field
                          label="썸네일 이미지 URL"
                          value={vid.thumbnailUrl}
                          onChange={(v) =>
                            updateDraft((p) => ({
                              ...p,
                              videos: p.videos.map((x, i) =>
                                i === idx ? { ...x, thumbnailUrl: v } : x
                              ),
                            }))
                          }
                        />
                      </div>
                      <Field
                        label="영상 설명"
                        value={vid.subtitle}
                        onChange={(v) =>
                          updateDraft((p) => ({
                            ...p,
                            videos: p.videos.map((x, i) =>
                              i === idx ? { ...x, subtitle: v } : x
                            ),
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* TAB 4: Tuition */}
          {activeTab === 'tuition' && (
            <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5DF] pb-3">
                <h2 className="text-base font-bold text-[#18181B]">교습비 안내 테이블 및 공고문</h2>
                <button
                  type="button"
                  onClick={() =>
                    updateDraft((p) => ({
                      ...p,
                      tuitionRows: [
                        ...p.tuitionRows,
                        {
                          id: `fee-${Date.now()}`,
                          programName: '신규 과정',
                          targetAge: '연령 입력',
                          schedule: '월~금 09:30 - 15:00',
                          monthlyFee: '금액 입력',
                          note: '',
                        },
                      ],
                    }))
                  }
                  className="px-3 py-1.5 text-xs font-medium text-[#3B28CC] border border-[#3B28CC]/30 rounded-lg hover:bg-[#3B28CC]/5 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  교습비 행 추가
                </button>
              </div>

              <TextAreaField
                label="교습비 안내 문구"
                rows={2}
                value={draft.tuitionNoticeText}
                onChange={(v) => updateDraft((p) => ({ ...p, tuitionNoticeText: v }))}
              />

              <div className="space-y-3">
                {draft.tuitionRows.map((row, idx) => (
                  <div
                    key={row.id}
                    className="p-4 border border-[#E5E5DF] rounded-xl bg-[#FAFAF8] space-y-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs text-[#71717A]">과정 #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft((p) => ({
                            ...p,
                            tuitionRows: p.tuitionRows.filter((r) => r.id !== row.id),
                          }))
                        }
                        className="text-xs text-[#DC2626] hover:underline cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <Field
                        label="과정명"
                        value={row.programName}
                        onChange={(v) =>
                          updateDraft((p) => ({
                            ...p,
                            tuitionRows: p.tuitionRows.map((r, i) =>
                              i === idx ? { ...r, programName: v } : r
                            ),
                          }))
                        }
                      />
                      <Field
                        label="대상 연령"
                        value={row.targetAge}
                        onChange={(v) =>
                          updateDraft((p) => ({
                            ...p,
                            tuitionRows: p.tuitionRows.map((r, i) =>
                              i === idx ? { ...r, targetAge: v } : r
                            ),
                          }))
                        }
                      />
                      <Field
                        label="운영 시간"
                        value={row.schedule}
                        onChange={(v) =>
                          updateDraft((p) => ({
                            ...p,
                            tuitionRows: p.tuitionRows.map((r, i) =>
                              i === idx ? { ...r, schedule: v } : r
                            ),
                          }))
                        }
                      />
                      <Field
                        label="월 교습비"
                        value={row.monthlyFee}
                        onChange={(v) =>
                          updateDraft((p) => ({
                            ...p,
                            tuitionRows: p.tuitionRows.map((r, i) =>
                              i === idx ? { ...r, monthlyFee: v } : r
                            ),
                          }))
                        }
                      />
                    </div>
                    <Field
                      label="비고 (포함 프로그램 등)"
                      value={row.note}
                      onChange={(v) =>
                        updateDraft((p) => ({
                          ...p,
                          tuitionRows: p.tuitionRows.map((r, i) =>
                            i === idx ? { ...r, note: v } : r
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-[#E5E5DF] space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <Field
                    label="공식 교습비 안내문 이미지 URL (선택)"
                    value={draft.tuitionImageUrl}
                    onChange={(v) => updateDraft((p) => ({ ...p, tuitionImageUrl: v }))}
                  />
                  <div className="flex items-center gap-2">
                    <ImageUploadButton
                      label="교습비 안내문 이미지 업로드"
                      uploading={uploadingKey === 'tuition-img'}
                      onFile={(file) =>
                        void handleUpload('tuition-img', file, (url) =>
                          updateDraft((p) => ({ ...p, tuitionImageUrl: url }))
                        )
                      }
                    />
                    {draft.tuitionImageUrl && (
                      <button
                        type="button"
                        onClick={() => updateDraft((p) => ({ ...p, tuitionImageUrl: '' }))}
                        className="px-3 py-2 text-xs text-[#DC2626] border border-[#E5E5DF] rounded-lg hover:bg-[#FAFAF8] cursor-pointer"
                      >
                        이미지 제거
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* TAB 5: Inquiries */}
          {activeTab === 'inquiries' && (
            <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5DF] pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#18181B]">
                    신입생 입학 상담 신청 내역
                  </h2>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    홈페이지 상담 폼으로 접수된 학부모 문의를 확인하고 진행 상태를 관리합니다.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={inquirySearch}
                      onChange={(e) => setInquirySearch(e.target.value)}
                      placeholder="이름, 연락처 검색"
                      className="pl-8 pr-3 py-1.5 text-xs bg-[#FAFAF8] border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC]"
                    />
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-[#F2F2EE] rounded-lg">
                    {(['전체', ...INQUIRY_STATUSES] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setInquiryFilter(st)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                          inquiryFilter === st
                            ? 'bg-white text-[#18181B] shadow-sm'
                            : 'text-[#52525B]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {inquiriesLoading ? (
                <p className="text-sm text-[#52525B] py-8 text-center">상담 내역 불러오는 중...</p>
              ) : filteredInquiries.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-[#E5E5DF] rounded-xl">
                  <p className="text-sm text-[#52525B]">조건에 해당하는 입학 상담 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-4 border border-[#E5E5DF] rounded-xl bg-[#FAFAF8] space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-[#18181B]">{inq.parentName}</span>
                          <span className="text-[#71717A]" aria-hidden="true">·</span>
                          <span className="font-mono text-xs text-[#3F3F46] tabular-nums">
                            {inq.phone}
                          </span>
                          <span className="text-[#71717A]" aria-hidden="true">·</span>
                          <span className="text-xs text-[#52525B]">{inq.childAge}</span>
                          <span className="text-[#71717A]" aria-hidden="true">·</span>
                          <span className="text-xs text-[#3B28CC] font-medium">
                            {inq.desiredProgram}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#71717A] tabular-nums">
                            {new Date(inq.createdAt).toLocaleString('ko-KR')}
                          </span>
                          <select
                            aria-label="상담 상태"
                            value={inq.status}
                            onChange={(e) =>
                              void handleInquiryUpdate(inq.id, {
                                status: e.target.value as InquiryStatus,
                              })
                            }
                            className="px-2.5 py-1 text-xs font-medium bg-white border border-[#E5E5DF] rounded-lg"
                          >
                            {INQUIRY_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => void handleInquiryDelete(inq.id)}
                            aria-label="상담 내역 삭제"
                            className="p-1.5 text-[#71717A] hover:text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {inq.message && (
                        <p className="text-sm text-[#3F3F46] bg-white border border-[#E5E5DF] rounded-lg p-3">
                          {inq.message}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={inq.adminMemo}
                          placeholder="관리자 상담 메모 입력 후 엔터 또는 저장 클릭"
                          onBlur={(e) => {
                            if (e.target.value !== inq.adminMemo) {
                              void handleInquiryUpdate(inq.id, { adminMemo: e.target.value });
                            }
                          }}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TAB 6: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-[#18181B] border-b border-[#E5E5DF] pb-3">
                  관리자 비밀번호 변경
                </h2>
                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <Field
                    label="현재 비밀번호"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                  />
                  <Field
                    label="새 비밀번호 (4자 이상)"
                    type="password"
                    value={newPassword}
                    onChange={setNewPassword}
                  />
                  <Field
                    label="새 비밀번호 확인"
                    type="password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#3F3F46] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    비밀번호 변경하기
                  </button>
                </form>
              </section>

              <section className="bg-white border border-[#E5E5DF] rounded-xl p-6 space-y-4">
                <h2 className="text-base font-bold text-[#18181B] border-b border-[#E5E5DF] pb-3">
                  데이터 백업 및 초기화
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="px-4 py-2 text-xs font-semibold text-[#18181B] bg-[#FAFAF8] hover:bg-[#F2F2EE] border border-[#E5E5DF] rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    현재 콘텐츠 JSON 백업 다운로드
                  </button>

                  {!resetConfirmOpen ? (
                    <button
                      type="button"
                      onClick={() => setResetConfirmOpen(true)}
                      className="px-4 py-2 text-xs font-semibold text-[#DC2626] bg-white hover:bg-[#DC2626]/5 border border-[#DC2626]/30 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      원본 기본값으로 복원
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-[#FAFAF8] border border-[#DC2626]/40 rounded-lg px-3 py-2">
                      <span className="text-xs text-[#DC2626] font-medium">
                        수정 내용을 초기화할까요?
                      </span>
                      <button
                        type="button"
                        onClick={handleResetDefaults}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-[#DC2626] rounded cursor-pointer"
                      >
                        확인
                      </button>
                      <button
                        type="button"
                        onClick={() => setResetConfirmOpen(false)}
                        className="px-2.5 py-1 text-xs font-medium text-[#52525B] bg-white border border-[#E5E5DF] rounded cursor-pointer"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg flex items-center gap-2.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
        active
          ? 'bg-[#3B28CC]/10 text-[#3B28CC] font-semibold'
          : 'text-[#52525B] hover:bg-[#F2F2EE] hover:text-[#18181B]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#3F3F46] mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC]"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#3F3F46] mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-white border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC]"
      />
    </div>
  );
}

function ImageUploadButton({
  label,
  uploading,
  onFile,
}: {
  label: string;
  uploading: boolean;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <label className="px-3.5 py-2 text-xs font-semibold text-[#18181B] bg-[#FAFAF8] hover:bg-[#F2F2EE] border border-[#E5E5DF] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
      <Upload className="w-3.5 h-3.5 text-[#3B28CC]" />
      <span>{uploading ? '업로드 중...' : label}</span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        disabled={uploading}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}
