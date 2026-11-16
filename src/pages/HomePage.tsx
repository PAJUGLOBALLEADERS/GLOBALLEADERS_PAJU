import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Instagram,
  MapPin,
  Menu,
  Play,
  X,
} from 'lucide-react';
import { ResilientImage } from '../components/ResilientImage.tsx';
import { submitInquiry } from '../lib/api.ts';
import type { GalleryCategory, GalleryItem, SiteData } from '../shared/siteTypes.ts';

interface HomePageProps {
  data: SiteData;
  onOpenAdmin: () => void;
}

const GALLERY_FILTERS: Array<'전체' | GalleryCategory> = [
  '전체',
  '영어 몰입',
  '말하기 대회',
  '놀이터 · 자연체험',
  '몬테소리 · 창의',
];

export function HomePage({ data, onOpenAdmin }: HomePageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCurriculumId, setActiveCurriculumId] = useState<string>(
    data.curricula[0]?.id || ''
  );
  const [galleryFilter, setGalleryFilter] = useState<'전체' | GalleryCategory>('전체');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  // Consultation Form State
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [childAge, setChildAge] = useState('5세 (2023년생)');
  const [desiredProgram, setDesiredProgram] = useState('GrapeSeed 영어 · 종일반');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!data.curricula.some((c) => c.id === activeCurriculumId)) {
      setActiveCurriculumId(data.curricula[0]?.id || '');
    }
  }, [data.curricula, activeCurriculumId]);

  useEffect(() => {
    if (!lightboxItem) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxItem(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxItem]);

  const activeCurriculum =
    data.curricula.find((c) => c.id === activeCurriculumId) || data.curricula[0];

  const filteredGallery =
    galleryFilter === '전체'
      ? data.galleryItems
      : data.galleryItems.filter((item) => item.category === galleryFilter);

  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess(false);

    if (!parentName.trim()) {
      setSubmitError('보호자 성함을 입력해 주세요.');
      return;
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 9) {
      setSubmitError('올바른 연락처(휴대폰 번호)를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await submitInquiry({
        parentName,
        phone,
        childAge,
        desiredProgram,
        message,
      });
      setSubmitSuccess(true);
      setParentName('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '상담 신청 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateLightbox = (dir: -1 | 1) => {
    if (!lightboxItem || filteredGallery.length === 0) return;
    const idx = filteredGallery.findIndex((g) => g.id === lightboxItem.id);
    if (idx === -1) return;
    const nextIdx = (idx + dir + filteredGallery.length) % filteredGallery.length;
    setLightboxItem(filteredGallery[nextIdx]);
  };

  const naverMapUrl = `https://map.naver.com/p/search/${encodeURIComponent(
    `${data.locationAddress} ${data.locationPlaceName}`
  )}`;
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(
    data.locationPlaceName
  )},${data.locationLat},${data.locationLng}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${
    data.locationLng - 0.0045
  }%2C${data.locationLat - 0.003}%2C${data.locationLng + 0.0045}%2C${
    data.locationLat + 0.003
  }&layer=mapnik&marker=${data.locationLat}%2C${data.locationLng}`;

  return (
    <div id="top" className="min-h-screen bg-[#FAFAF8] text-[#18181B]">
      {/* Top Bar: Strict 3-Zone Contract */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#E5E5DF]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single clean wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-[#18181B] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B28CC] rounded"
          >
            {data.academyName}
          </a>

          {/* Zone 2: 5 single-line nav links */}
          <nav
            aria-label="주요 메뉴"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52525B]"
          >
            <a
              href="#philosophy"
              className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              교육철학
            </a>
            <a
              href="#curriculum"
              className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              커리큘럼
            </a>
            <a
              href="#gallery"
              className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              갤러리
            </a>
            <a
              href="#tuition"
              className="hover:text-[#18181B] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              교습비
            </a>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="hover:text-[#3B28CC] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              관리자
            </button>
          </nav>

          {/* Zone 3: 1 primary CTA + mobile drawer toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#consultation"
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#3B28CC] hover:bg-[#2E1FA3] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B28CC]"
            >
              입학 상담
            </a>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2.5 text-[#18181B] hover:bg-[#F2F2EE] rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="모바일 메뉴"
            className="md:hidden border-t border-[#E5E5DF] bg-[#FAFAF8] px-6 py-4 flex flex-col gap-2"
          >
            <a
              href="#philosophy"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-sm font-medium text-[#18181B] border-b border-[#E5E5DF]"
            >
              교육철학
            </a>
            <a
              href="#curriculum"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-sm font-medium text-[#18181B] border-b border-[#E5E5DF]"
            >
              커리큘럼
            </a>
            <a
              href="#gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-sm font-medium text-[#18181B] border-b border-[#E5E5DF]"
            >
              갤러리
            </a>
            <a
              href="#tuition"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-sm font-medium text-[#18181B] border-b border-[#E5E5DF]"
            >
              교습비 안내
            </a>
            <a
              href="#location"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 text-sm font-medium text-[#18181B] border-b border-[#E5E5DF]"
            >
              오시는 길
            </a>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdmin();
              }}
              className="py-2.5 text-left text-sm font-semibold text-[#3B28CC]"
            >
              관리자 페이지 열기
            </button>
          </nav>
        )}
      </header>

      <main>
        {/* Section 1: Hero Proposition */}
        <section className="pt-10 pb-12 md:pt-16 md:pb-16">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-between py-1">
                <div>
                  <p className="text-xs font-medium text-[#52525B] mb-4">
                    {data.heroKicker}
                  </p>
                  <h1 className="font-display text-[clamp(2.15rem,3.8vw,3.35rem)] font-bold tracking-tight leading-[1.18] text-[#18181B] [text-wrap:balance] mb-6">
                    {data.heroHeadline}
                  </h1>
                  <p className="text-[15px] md:text-base leading-[1.75] text-[#3F3F46] whitespace-pre-line max-w-[58ch]">
                    {data.heroIntro}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E5E5DF] flex flex-wrap items-center gap-4">
                  <a
                    href="#consultation"
                    className="px-6 py-3 text-sm font-semibold text-white bg-[#3B28CC] hover:bg-[#2E1FA3] rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#3B28CC]"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    {data.primaryCtaLabel}
                  </a>
                  <a
                    href={data.naverFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 text-sm font-medium text-[#18181B] bg-white hover:bg-[#F2F2EE] border border-[#E5E5DF] rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
                  >
                    네이버 폼 신청
                    <ArrowUpRight className="w-4 h-4 text-[#52525B]" />
                  </a>
                  <a
                    href="#location"
                    className="text-sm font-medium text-[#52525B] hover:text-[#18181B] underline underline-offset-4 px-2 py-2 whitespace-nowrap shrink-0"
                  >
                    오시는 길
                  </a>
                </div>
              </div>

              <div className="lg:col-span-6">
                <ResilientImage
                  src={data.heroImageUrl}
                  alt={data.heroImageAlt}
                  fallbackTitle={data.academyName}
                  className="w-full h-[300px] sm:h-[400px] lg:h-full lg:min-h-[460px] object-cover rounded-xl border border-[#E5E5DF]"
                />
              </div>
            </div>

            {/* Full-width 4-Column Summary Strip below Hero Split */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#E5E5DF] rounded-xl bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E5E5DF] overflow-hidden">
              <div className="p-6">
                <p className="font-mono text-xs text-[#73739C] tabular-nums mb-1.5">01</p>
                <p className="text-sm font-semibold text-[#18181B]">외부인 없는 단독건물</p>
                <p className="text-xs leading-relaxed text-[#52525B] mt-1">
                  안전하고 탁 트인 전용 학습 공간
                </p>
              </div>
              <div className="p-6">
                <p className="font-mono text-xs text-[#73739C] tabular-nums mb-1.5">02</p>
                <p className="text-sm font-semibold text-[#18181B]">기적의 놀이터 &amp; 텃밭</p>
                <p className="text-xs leading-relaxed text-[#52525B] mt-1">
                  친환경 자연체험학습장 매일 운영
                </p>
              </div>
              <div className="p-6">
                <p className="font-mono text-xs text-[#73739C] tabular-nums mb-1.5">03</p>
                <p className="text-sm font-semibold text-[#18181B]">GrapeSeed 모국어 습득</p>
                <p className="text-xs leading-relaxed text-[#52525B] mt-1">
                  스트레스 없는 자연스러운 영어 몰입
                </p>
              </div>
              <div className="p-6">
                <p className="font-mono text-xs text-[#73739C] tabular-nums mb-1.5">04</p>
                <p className="text-sm font-semibold text-[#18181B]">전인적 특색 커리큘럼</p>
                <p className="text-xs leading-relaxed text-[#52525B] mt-1">
                  몬테소리 · 창의사고 · 매일 운동심리
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Philosophy, Environment & Experiential Activities */}
        <section id="philosophy" className="py-16 md:py-24 border-t border-[#E5E5DF] bg-white">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-medium text-[#3B28CC] mb-2">
                {data.englishName} PHILOSOPHY
              </p>
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#18181B] [text-wrap:balance]">
                {data.whyChooseTitle}
              </h2>
              <p className="text-sm md:text-base text-[#52525B] mt-3 leading-relaxed">
                {data.whyChooseSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              <div className="lg:col-span-5">
                <ResilientImage
                  src={data.campusImageUrl}
                  alt={data.campusImageAlt}
                  fallbackTitle="기적의 놀이터 및 자연체험학습장"
                  className="w-full h-[280px] sm:h-[360px] lg:h-full object-cover rounded-xl border border-[#E5E5DF]"
                />
              </div>

              <div className="lg:col-span-7 flex flex-col justify-center divide-y divide-[#E5E5DF] border-t border-b border-[#E5E5DF]">
                {data.philosophyPillars.map((pillar) => (
                  <div key={pillar.id} className="py-7 first:pt-6 last:pb-6">
                    <div className="flex items-center gap-2 text-xs text-[#52525B] mb-2">
                      <span className="font-mono tabular-nums font-medium text-[#3B28CC]">
                        {pillar.number}.
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{pillar.category}</span>
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold text-[#18181B] mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-sm md:text-[15px] leading-[1.7] text-[#3F3F46] whitespace-pre-line">
                      {pillar.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: 4 Core Curricula */}
        <section id="curriculum" className="py-16 md:py-24 border-t border-[#E5E5DF] bg-[#FAFAF8]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                <p className="text-xs font-medium text-[#3B28CC] mb-2">
                  CORE CURRICULUM
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#18181B] [text-wrap:balance]">
                  {data.curriculumSectionTitle}
                </h2>
                <p className="text-sm md:text-base text-[#52525B] mt-3 leading-relaxed">
                  {data.curriculumSectionSubtitle}
                </p>
              </div>
            </div>

            {/* Interactive Segmented Tab Controls */}
            <div
              role="tablist"
              aria-label="핵심 커리큘럼 선택"
              className="inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-[#F2F2EE] border border-[#E5E5DF] rounded-xl mb-8"
            >
              {data.curricula.map((item) => {
                const selected = item.id === activeCurriculum?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveCurriculumId(item.id)}
                    className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selected
                        ? 'bg-white text-[#18181B] shadow-sm border border-[#E5E5DF]'
                        : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    <span className="font-mono tabular-nums text-[#3B28CC] mr-1.5">
                      {item.number}
                    </span>
                    {item.name}
                  </button>
                );
              })}
            </div>

            {activeCurriculum && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch bg-white border border-[#E5E5DF] rounded-xl p-6 md:p-8">
                <div className="lg:col-span-6">
                  <ResilientImage
                    src={activeCurriculum.imageUrl}
                    alt={activeCurriculum.imageAlt}
                    fallbackTitle={activeCurriculum.name}
                    className="w-full h-[260px] sm:h-[340px] lg:h-full lg:min-h-[360px] object-cover rounded-lg border border-[#E5E5DF]"
                  />
                </div>
                <div className="lg:col-span-6 flex flex-col justify-between py-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#52525B] mb-2">
                      <span className="font-mono tabular-nums text-[#3B28CC]">
                        {activeCurriculum.number}.
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activeCurriculum.subtitle}</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold text-[#18181B] mb-4">
                      {activeCurriculum.name}
                    </h3>
                    <p className="text-sm md:text-[15px] leading-[1.75] text-[#3F3F46] mb-6">
                      {activeCurriculum.summary}
                    </p>

                    <ul className="space-y-3 border-t border-[#E5E5DF] pt-5">
                      {activeCurriculum.highlights.map((bullet, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-[#18181B] leading-relaxed"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#2D6A4F] shrink-0 mt-1" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-5 border-t border-[#E5E5DF] flex items-center justify-between gap-4">
                    <span className="text-xs text-[#71717A]">
                      연령별 발달 수준에 맞춘 맞춤 반 편성 운영
                    </span>
                    <a
                      href="#consultation"
                      className="text-sm font-semibold text-[#3B28CC] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                    >
                      수업 상담 신청 →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 4: FUN FUN ENGLISH Gallery & Videos */}
        <section id="gallery" className="py-16 md:py-24 border-t border-[#E5E5DF] bg-white">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
              <div className="max-w-2xl">
                <p className="text-xs font-medium text-[#3B28CC] mb-2">
                  CAMPUS LIFE
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#18181B] [text-wrap:balance]">
                  {data.gallerySectionTitle}
                </h2>
                <p className="text-sm md:text-base text-[#52525B] mt-3 leading-relaxed">
                  {data.gallerySectionSubtitle}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F2F2EE] border border-[#E5E5DF] rounded-xl">
                {GALLERY_FILTERS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setGalleryFilter(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      galleryFilter === cat
                        ? 'bg-white text-[#18181B] shadow-sm'
                        : 'text-[#52525B] hover:text-[#18181B]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredGallery.length === 0 ? (
              <div className="border border-[#E5E5DF] rounded-xl p-12 text-center bg-[#FAFAF8]">
                <p className="text-sm text-[#52525B]">선택한 카테고리에 등록된 사진이 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredGallery.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLightboxItem(item)}
                    className="group text-left bg-[#FAFAF8] border border-[#E5E5DF] rounded-xl overflow-hidden hover:border-[#73739C] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B28CC]"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-[#F2F2EE]">
                      <ResilientImage
                        src={item.imageUrl}
                        alt={item.title}
                        fallbackTitle={item.title}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-2 text-xs text-[#71717A] mb-1.5">
                        <span>{item.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.dateLabel}</span>
                      </div>
                      <h3 className="text-base font-semibold text-[#18181B] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#52525B] line-clamp-2">
                        {item.caption}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Video Highlights Strip: FUN FUN 글로벌 리더스 */}
            {data.videos.length > 0 && (
              <div className="mt-16 pt-12 border-t border-[#E5E5DF]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-xl font-bold text-[#18181B]">
                      {data.videoSectionTitle}
                    </h3>
                    <p className="text-sm text-[#52525B] mt-1">
                      글로벌리더스 공식 채널에서 아이들의 생생한 영어 활동 영상을 확인해 보세요.
                    </p>
                  </div>
                  <a
                    href={data.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-[#3B28CC] hover:underline underline-offset-4 whitespace-nowrap shrink-0"
                  >
                    <Instagram className="w-4 h-4" />
                    {data.instagramLabel}
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.videos.map((vid) => (
                    <a
                      key={vid.id}
                      href={vid.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col sm:flex-row gap-5 p-4 bg-[#FAFAF8] border border-[#E5E5DF] rounded-xl hover:border-[#73739C] transition-colors"
                    >
                      <div className="relative sm:w-48 aspect-[16/10] sm:aspect-[4/3] shrink-0 rounded-lg overflow-hidden bg-[#F2F2EE]">
                        <ResilientImage
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          fallbackTitle={vid.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                          <span className="w-10 h-10 rounded-full bg-white text-[#18181B] flex items-center justify-center shadow-sm">
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center">
                        <span className="text-xs text-[#71717A] mb-1.5">
                          {vid.durationLabel}
                        </span>
                        <h4 className="text-base font-semibold text-[#18181B] group-hover:text-[#3B28CC] transition-colors">
                          {vid.title}
                        </h4>
                        <p className="text-xs leading-relaxed text-[#52525B] mt-1.5">
                          {vid.subtitle}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 5: Tuition & Admission Consultation */}
        <section id="tuition" className="py-16 md:py-24 border-t border-[#E5E5DF] bg-[#FAFAF8]">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left: Tuition Information */}
              <div className="lg:col-span-7">
                <p className="text-xs font-medium text-[#3B28CC] mb-2">
                  TUITION &amp; ADMISSION
                </p>
                <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#18181B]">
                  {data.tuitionSectionTitle}
                </h2>
                <p className="text-sm leading-relaxed text-[#52525B] mt-3 mb-6">
                  {data.tuitionNoticeText}
                </p>

                <div className="bg-white border border-[#E5E5DF] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#E5E5DF] bg-[#F2F2EE]/60 text-xs font-semibold text-[#52525B]">
                          <th className="py-3.5 px-4 whitespace-nowrap">과정명</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">대상 연령</th>
                          <th className="py-3.5 px-4 whitespace-nowrap">운영 시간</th>
                          <th className="py-3.5 px-4 whitespace-nowrap text-right">교습비</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5DF] text-sm">
                        {data.tuitionRows.map((row) => (
                          <tr key={row.id} className="hover:bg-[#FAFAF8] transition-colors">
                            <td className="py-3.5 px-4 font-medium text-[#18181B]">
                              <div>{row.programName}</div>
                              {row.note && (
                                <div className="text-xs font-normal text-[#71717A] mt-0.5">
                                  {row.note}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-[#3F3F46] whitespace-nowrap">
                              {row.targetAge}
                            </td>
                            <td className="py-3.5 px-4 text-[#3F3F46] font-mono text-xs tabular-nums whitespace-nowrap">
                              {row.schedule}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-medium text-[#18181B] tabular-nums whitespace-nowrap">
                              {row.monthlyFee}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {data.tuitionImageUrl && (
                  <div className="mt-6 bg-white border border-[#E5E5DF] rounded-xl p-4">
                    <p className="text-xs font-medium text-[#52525B] mb-3">
                      교습비 게시 안내문
                    </p>
                    <ResilientImage
                      src={data.tuitionImageUrl}
                      alt="글로벌리더스학원 교습비 안내문"
                      fallbackTitle="교습비 안내문"
                      className="w-full max-h-[480px] object-contain rounded-lg"
                    />
                  </div>
                )}
              </div>

              {/* Right: Consultation Form */}
              <div
                id="consultation"
                className="lg:col-span-5 bg-white border border-[#E5E5DF] rounded-xl p-6 md:p-8 scroll-mt-24"
              >
                <h3 className="font-display text-xl font-bold text-[#18181B]">
                  {data.admissionBannerTitle}
                </h3>
                <p className="text-sm text-[#52525B] mt-2 mb-6 leading-relaxed">
                  {data.admissionBannerSubtitle}
                </p>

                {submitSuccess ? (
                  <div className="p-6 bg-[#F2F2EE] border border-[#E5E5DF] rounded-xl text-center">
                    <CheckCircle2 className="w-9 h-9 text-[#2D6A4F] mx-auto mb-3" />
                    <h4 className="text-base font-semibold text-[#18181B]">
                      입학 상담 신청이 접수되었습니다
                    </h4>
                    <p className="text-sm text-[#52525B] mt-2 leading-relaxed">
                      남겨주신 연락처로 원내 상담 담당자가 확인 후 순차적으로 연락드리겠습니다.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitSuccess(false)}
                      className="mt-5 px-4 py-2 text-xs font-medium bg-white border border-[#E5E5DF] rounded-lg hover:bg-[#FAFAF8] cursor-pointer"
                    >
                      추가 문의하기
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="parentName"
                        className="block text-xs font-medium text-[#3F3F46] mb-1.5"
                      >
                        보호자 성함 <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="parentName"
                        type="text"
                        required
                        value={parentName}
                        onChange={(e) => setParentName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC] focus:bg-white"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-xs font-medium text-[#3F3F46] mb-1.5"
                      >
                        연락처 <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="010-0000-0000"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#E5E5DF] rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#3B28CC] focus:bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="childAge"
                          className="block text-xs font-medium text-[#3F3F46] mb-1.5"
                        >
                          자녀 연령
                        </label>
                        <select
                          id="childAge"
                          value={childAge}
                          onChange={(e) => setChildAge(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC] focus:bg-white"
                        >
                          <option value="5세 (2023년생)">5세 (2023년생)</option>
                          <option value="6세 (2022년생)">6세 (2022년생)</option>
                          <option value="7세 (2021년생)">7세 (2021년생)</option>
                          <option value="기타 연령 상담">기타 연령 상담</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="desiredProgram"
                          className="block text-xs font-medium text-[#3F3F46] mb-1.5"
                        >
                          관심 프로그램
                        </label>
                        <select
                          id="desiredProgram"
                          value={desiredProgram}
                          onChange={(e) => setDesiredProgram(e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC] focus:bg-white"
                        >
                          <option value="GrapeSeed 영어 · 종일반">GrapeSeed 영어 · 종일반</option>
                          <option value="몬테소리 · 창의사고 과정">몬테소리 · 창의사고 과정</option>
                          <option value="방과후 심화 과정">방과후 심화 과정</option>
                          <option value="원 방문 투어 및 전반 상담">원 방문 투어 및 전반 상담</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-xs font-medium text-[#3F3F46] mb-1.5"
                      >
                        문의 사항 및 희망 방문 일시
                      </label>
                      <textarea
                        id="message"
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="등하원 차량, 교육 과정 등 궁금한 점을 남겨주세요."
                        className="w-full px-3.5 py-2.5 text-sm bg-[#FAFAF8] border border-[#E5E5DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B28CC] focus:bg-white resize-none"
                      />
                    </div>

                    {submitError && (
                      <p role="alert" className="text-xs font-medium text-[#DC2626]">
                        {submitError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#3B28CC] hover:bg-[#2E1FA3] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                    >
                      {submitting ? '신청 접수 중...' : '입학 상담 신청하기'}
                    </button>
                  </form>
                )}

                <div className="mt-5 pt-5 border-t border-[#E5E5DF] flex items-center justify-between gap-4">
                  <span className="text-xs text-[#71717A]">
                    기존 네이버 폼 접수도 가능합니다
                  </span>
                  <a
                    href={data.naverFormUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#18181B] hover:text-[#3B28CC] whitespace-nowrap shrink-0"
                  >
                    네이버 폼 열기
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Location & Map */}
        <section id="location" className="py-16 md:py-24 border-t border-[#E5E5DF] bg-white">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-medium text-[#3B28CC] mb-2">
                    CAMPUS LOCATION
                  </p>
                  <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-[#18181B] mb-6">
                    오시는 길
                  </h2>

                  <dl className="space-y-5 border-t border-[#E5E5DF] pt-6">
                    <div>
                      <dt className="text-xs font-medium text-[#71717A] mb-1">기관명</dt>
                      <dd className="text-base font-semibold text-[#18181B]">
                        {data.locationPlaceName} ({data.englishName})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-[#71717A] mb-1">주소</dt>
                      <dd className="text-sm text-[#18181B] flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-[#3B28CC] shrink-0 mt-0.5" />
                        <span>{data.locationAddress}</span>
                      </dd>
                      <dd className="text-xs text-[#52525B] mt-1 pl-6">
                        {data.locationDetail}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-[#71717A] mb-1">상담 및 운영 시간</dt>
                      <dd className="text-sm text-[#3F3F46]">{data.locationHours}</dd>
                      <dd className="text-xs text-[#71717A] mt-1">{data.locationPhone}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E5E5DF] flex flex-wrap gap-3">
                  <a
                    href={naverMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 text-xs font-semibold text-white bg-[#18181B] hover:bg-[#3F3F46] rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    네이버 지도
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={kakaoMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 text-xs font-semibold text-[#18181B] bg-[#FAFAF8] hover:bg-[#F2F2EE] border border-[#E5E5DF] rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    카카오맵
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={data.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 text-xs font-semibold text-[#3B28CC] bg-[#FAFAF8] hover:bg-[#F2F2EE] border border-[#E5E5DF] rounded-lg transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    인스타그램
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="w-full h-[320px] lg:h-full min-h-[360px] rounded-xl overflow-hidden border border-[#E5E5DF] bg-[#F2F2EE] relative">
                  <iframe
                    title={`${data.locationPlaceName} 위치 지도`}
                    src={osmEmbedUrl}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#E5E5DF] bg-[#FAFAF8] py-10">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display text-base font-bold text-[#18181B]">
              {data.academyName}
            </p>
            <p className="text-xs text-[#71717A] mt-1">
              {data.locationPlaceName} · {data.locationAddress}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[#52525B]">
            <a
              href={data.naverQrSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#18181B] transition-colors"
            >
              네이버 QR 안내 원본
            </a>
            <a
              href={data.naverFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#18181B] transition-colors"
            >
              신입생 상담 폼
            </a>
            <a
              href={data.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#18181B] transition-colors"
            >
              인스타그램
            </a>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-[#3B28CC] font-semibold hover:underline underline-offset-4 cursor-pointer"
            >
              관리자 페이지
            </button>
          </div>
        </div>
      </footer>

      {/* Lightbox Modal for Gallery Photos */}
      {lightboxItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxItem.title}
          onClick={() => setLightboxItem(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-4xl w-full overflow-hidden border border-[#E5E5DF]"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5DF]">
              <div className="min-w-0">
                <p className="text-xs text-[#71717A]">
                  {lightboxItem.category} · {lightboxItem.dateLabel}
                </p>
                <h4 className="text-base font-semibold text-[#18181B] truncate">
                  {lightboxItem.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                aria-label="닫기"
                className="p-2 text-[#52525B] hover:text-[#18181B] rounded-lg hover:bg-[#F2F2EE] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative bg-[#18181B] flex items-center justify-center max-h-[70vh]">
              <ResilientImage
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                fallbackTitle={lightboxItem.title}
                className="max-h-[70vh] w-auto object-contain"
              />
              {filteredGallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateLightbox(-1)}
                    aria-label="이전 사진"
                    className="absolute left-3 p-2.5 rounded-full bg-white/90 text-[#18181B] hover:bg-white shadow cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateLightbox(1)}
                    aria-label="다음 사진"
                    className="absolute right-3 p-2.5 rounded-full bg-white/90 text-[#18181B] hover:bg-white shadow cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            <div className="px-5 py-4 bg-[#FAFAF8] border-t border-[#E5E5DF]">
              <p className="text-sm text-[#3F3F46]">{lightboxItem.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
