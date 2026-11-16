import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import { DEFAULT_SITE_DATA } from './src/shared/defaultSiteData.ts';
import type { ConsultationInquiry, InquiryStatus, SiteData } from './src/shared/siteTypes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const SITE_DATA_FILE = path.join(DATA_DIR, 'site-data.json');
const INQUIRIES_FILE = path.join(DATA_DIR, 'inquiries.json');
const ADMIN_CONFIG_FILE = path.join(DATA_DIR, 'admin-config.json');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface AdminConfig {
  passwordHash: string;
  salt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function ensureAdminConfig(): AdminConfig {
  if (fs.existsSync(ADMIN_CONFIG_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(ADMIN_CONFIG_FILE, 'utf8')) as AdminConfig;
      if (parsed.passwordHash && parsed.salt) {
        return parsed;
      }
    } catch {
      // recreate below
    }
  }
  const initialPassword = process.env.ADMIN_PASSWORD || 'global2027';
  const salt = crypto.randomBytes(16).toString('hex');
  const config: AdminConfig = {
    salt,
    passwordHash: hashPassword(initialPassword, salt),
  };
  fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  return config;
}

function readSiteData(): SiteData {
  if (!fs.existsSync(SITE_DATA_FILE)) {
    fs.writeFileSync(SITE_DATA_FILE, JSON.stringify(DEFAULT_SITE_DATA, null, 2), 'utf8');
    return DEFAULT_SITE_DATA;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(SITE_DATA_FILE, 'utf8')) as Partial<SiteData>;
    return { ...DEFAULT_SITE_DATA, ...raw };
  } catch {
    return DEFAULT_SITE_DATA;
  }
}

function writeSiteData(data: SiteData): SiteData {
  const nextData: SiteData = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(SITE_DATA_FILE, JSON.stringify(nextData, null, 2), 'utf8');
  return nextData;
}

function readInquiries(): ConsultationInquiry[] {
  if (!fs.existsSync(INQUIRIES_FILE)) {
    const seedInquiries: ConsultationInquiry[] = [
      {
        id: 'inq-seed-1',
        parentName: '김서연 어머님',
        phone: '010-4821-1904',
        childAge: '6세 (2022년생)',
        desiredProgram: 'GrapeSeed 영어 · 종일반',
        message: '27년도 6세 반 입학 및 등하원 차량 노선 문의드립니다. 이번 주 목요일 오후 방문 상담 가능할까요?',
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
        message: '기적의 놀이터와 단독 건물 환경이 마음에 들어 입학 상담 신청합니다. 교습비 상세 안내 부탁드립니다.',
        status: '대기중',
        adminMemo: '',
        createdAt: '2026-11-16T00:15:00.000Z',
      },
    ];
    fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(seedInquiries, null, 2), 'utf8');
    return seedInquiries;
  }
  try {
    return JSON.parse(fs.readFileSync(INQUIRIES_FILE, 'utf8')) as ConsultationInquiry[];
  } catch {
    return [];
  }
}

function writeInquiries(inquiries: ConsultationInquiry[]): void {
  fs.writeFileSync(INQUIRIES_FILE, JSON.stringify(inquiries, null, 2), 'utf8');
}

const activeTokens = new Map<string, number>();
const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function createSessionToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.set(token, Date.now() + TOKEN_TTL_MS);
  return token;
}

function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  const expiresAt = activeTokens.get(token);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    activeTokens.delete(token);
    return false;
  }
  return true;
}

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!isTokenValid(token)) {
    res.status(401).json({ error: '관리자 인증이 필요합니다. 다시 로그인해 주세요.' });
    return;
  }
  next();
}

async function startServer() {
  ensureAdminConfig();
  readSiteData();
  readInquiries();

  const app = express();
  app.use(express.json({ limit: '12mb' }));

  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/site-data', (_req, res) => {
    const data = readSiteData();
    res.json(data);
  });

  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body as { password?: string };
    if (!password || typeof password !== 'string') {
      res.status(400).json({ error: '비밀번호를 입력해 주세요.' });
      return;
    }
    const config = ensureAdminConfig();
    const attemptHash = hashPassword(password, config.salt);
    const match = crypto.timingSafeEqual(
      Buffer.from(attemptHash, 'hex'),
      Buffer.from(config.passwordHash, 'hex')
    );
    if (!match) {
      res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
      return;
    }
    const token = createSessionToken();
    res.json({ token, expiresInMs: TOKEN_TTL_MS });
  });

  app.post('/api/admin/verify', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    res.json({ valid: isTokenValid(token) });
  });

  app.post('/api/admin/password', requireAdminAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };
    if (!currentPassword || !newPassword || newPassword.length < 4) {
      res.status(400).json({ error: '새 비밀번호는 최소 4자 이상이어야 합니다.' });
      return;
    }
    const config = ensureAdminConfig();
    const attemptHash = hashPassword(currentPassword, config.salt);
    const match = crypto.timingSafeEqual(
      Buffer.from(attemptHash, 'hex'),
      Buffer.from(config.passwordHash, 'hex')
    );
    if (!match) {
      res.status(401).json({ error: '현재 비밀번호가 일치하지 않습니다.' });
      return;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const nextConfig: AdminConfig = {
      salt,
      passwordHash: hashPassword(newPassword, salt),
    };
    fs.writeFileSync(ADMIN_CONFIG_FILE, JSON.stringify(nextConfig, null, 2), 'utf8');
    res.json({ ok: true });
  });

  app.put('/api/site-data', requireAdminAuth, (req, res) => {
    const payload = req.body as SiteData;
    if (!payload || typeof payload !== 'object' || !payload.academyName) {
      res.status(400).json({ error: '유효하지 않은 사이트 데이터 형식입니다.' });
      return;
    }
    const saved = writeSiteData(payload);
    res.json(saved);
  });

  app.post('/api/site-data/reset', requireAdminAuth, (_req, res) => {
    const saved = writeSiteData(DEFAULT_SITE_DATA);
    res.json(saved);
  });

  app.post('/api/upload', requireAdminAuth, (req, res) => {
    const { filename, dataUrl } = req.body as { filename?: string; dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: '이미지 데이터가 없습니다.' });
      return;
    }
    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) {
      res.status(400).json({ error: '지원되는 이미지 형식(PNG, JPG, WEBP, GIF)이 아닙니다.' });
      return;
    }
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.byteLength > 8 * 1024 * 1024) {
      res.status(400).json({ error: '이미지 크기는 8MB 이하만 업로드할 수 있습니다.' });
      return;
    }
    const baseName = (filename || 'upload')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 32) || 'img';
    const outName = `${baseName}_${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, outName), buffer);
    res.json({ url: `/uploads/${outName}` });
  });

  app.get('/api/inquiries', requireAdminAuth, (_req, res) => {
    const list = readInquiries().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    res.json(list);
  });

  app.post('/api/inquiries', (req, res) => {
    const { parentName, phone, childAge, desiredProgram, message } = req.body as Partial<ConsultationInquiry>;
    if (!parentName?.trim() || !phone?.trim() || !childAge?.trim()) {
      res.status(400).json({ error: '보호자 성함, 연락처, 자녀 연령은 필수 입력 항목입니다.' });
      return;
    }
    const list = readInquiries();
    const newItem: ConsultationInquiry = {
      id: `inq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      parentName: parentName.trim(),
      phone: phone.trim(),
      childAge: childAge.trim(),
      desiredProgram: (desiredProgram || '입학 전반 상담').trim(),
      message: (message || '').trim(),
      status: '대기중',
      adminMemo: '',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newItem);
    writeInquiries(list);
    res.status(201).json(newItem);
  });

  app.patch('/api/inquiries/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const { status, adminMemo } = req.body as { status?: InquiryStatus; adminMemo?: string };
    const list = readInquiries();
    const idx = list.findIndex((item) => item.id === id);
    if (idx === -1) {
      res.status(404).json({ error: '상담 내역을 찾을 수 없습니다.' });
      return;
    }
    if (status) {
      list[idx].status = status;
    }
    if (typeof adminMemo === 'string') {
      list[idx].adminMemo = adminMemo;
    }
    writeInquiries(list);
    res.json(list[idx]);
  });

  app.delete('/api/inquiries/:id', requireAdminAuth, (req, res) => {
    const { id } = req.params;
    const list = readInquiries();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length === list.length) {
      res.status(404).json({ error: '상담 내역을 찾을 수 없습니다.' });
      return;
    }
    writeInquiries(filtered);
    res.json({ ok: true });
  });

  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Global Leaders server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
