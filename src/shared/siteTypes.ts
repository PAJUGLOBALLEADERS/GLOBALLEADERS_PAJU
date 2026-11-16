export type GalleryCategory = '영어 몰입' | '말하기 대회' | '놀이터 · 자연체험' | '몬테소리 · 창의';

export interface PhilosophyPillar {
  id: string;
  number: string;
  category: string;
  title: string;
  description: string;
}

export interface CurriculumItem {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  summary: string;
  highlights: string[];
  imageUrl: string;
  imageAlt: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  category: GalleryCategory;
  dateLabel: string;
  imageUrl: string;
}

export interface VideoHighlight {
  id: string;
  title: string;
  subtitle: string;
  thumbnailUrl: string;
  videoUrl: string;
  durationLabel: string;
}

export interface TuitionRow {
  id: string;
  programName: string;
  targetAge: string;
  schedule: string;
  monthlyFee: string;
  note: string;
}

export interface SiteData {
  academyName: string;
  englishName: string;
  heroKicker: string;
  heroHeadline: string;
  heroIntro: string;
  heroImageUrl: string;
  heroImageAlt: string;
  primaryCtaLabel: string;
  naverFormUrl: string;
  naverQrSourceUrl: string;
  instagramLabel: string;
  instagramUrl: string;
  admissionBannerTitle: string;
  admissionBannerSubtitle: string;
  whyChooseTitle: string;
  whyChooseSubtitle: string;
  campusImageUrl: string;
  campusImageAlt: string;
  philosophyPillars: PhilosophyPillar[];
  curriculumSectionTitle: string;
  curriculumSectionSubtitle: string;
  curricula: CurriculumItem[];
  gallerySectionTitle: string;
  gallerySectionSubtitle: string;
  galleryItems: GalleryItem[];
  videoSectionTitle: string;
  videos: VideoHighlight[];
  tuitionSectionTitle: string;
  tuitionNoticeText: string;
  tuitionImageUrl: string;
  tuitionRows: TuitionRow[];
  locationPlaceName: string;
  locationAddress: string;
  locationDetail: string;
  locationPhone: string;
  locationHours: string;
  locationLat: number;
  locationLng: number;
  updatedAt: string;
}

export type InquiryStatus = '대기중' | '상담예약' | '상담완료';

export interface ConsultationInquiry {
  id: string;
  parentName: string;
  phone: string;
  childAge: string;
  desiredProgram: string;
  message: string;
  status: InquiryStatus;
  adminMemo: string;
  createdAt: string;
}
