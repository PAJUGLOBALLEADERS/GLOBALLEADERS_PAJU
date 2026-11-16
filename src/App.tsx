/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { fetchSiteData } from './lib/api.ts';
import { AdminPage } from './pages/AdminPage.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { DEFAULT_SITE_DATA } from './shared/defaultSiteData.ts';
import type { SiteData } from './shared/siteTypes.ts';

type RouteView = 'home' | 'admin';

function getNormalizedBase(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function getInitialView(): RouteView {
  if (typeof window !== 'undefined') {
    const base = getNormalizedBase();
    const pathname = window.location.pathname;
    const relativePath = pathname.startsWith(base)
      ? pathname.slice(base.length)
      : pathname.replace(/^\/+/, '');

    if (
      relativePath === 'admin' ||
      relativePath === 'admin/' ||
      window.location.hash === '#admin' ||
      window.location.hash === '#/admin'
    ) {
      return 'admin';
    }
  }
  return 'home';
}

export default function App() {
  const [view, setView] = useState<RouteView>(getInitialView);
  const [siteData, setSiteData] = useState<SiteData>(DEFAULT_SITE_DATA);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await fetchSiteData();
        if (active) {
          setSiteData(data);
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : '콘텐츠를 불러오는 중 문제가 발생했습니다.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    void load();

    const onPopState = () => {
      setView(getInitialView());
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      active = false;
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  const navigateTo = (nextView: RouteView) => {
    setView(nextView);
    if (typeof window !== 'undefined') {
      const base = getNormalizedBase();
      const targetUrl = nextView === 'admin' ? `${base}admin` : base;
      if (window.location.pathname !== targetUrl) {
        window.history.pushState({}, '', targetUrl);
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <p className="font-display text-lg font-bold text-[#18181B]">글로벌리더스</p>
          <p className="text-xs text-[#71717A]">홈페이지 콘텐츠를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <AdminPage
        siteData={siteData}
        onSiteDataSaved={(next) => setSiteData(next)}
        onBackToHome={() => navigateTo('home')}
      />
    );
  }

  return (
    <>
      {loadError && (
        <div
          role="alert"
          className="bg-[#FEF2F2] border-b border-[#FECACA] text-[#DC2626] text-xs px-6 py-2 text-center"
        >
          서버 데이터를 불러오지 못해 기본 안내 콘텐츠로 표시 중입니다 ({loadError}).
        </div>
      )}
      <HomePage data={siteData} onOpenAdmin={() => navigateTo('admin')} />
    </>
  );
}
