'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme, THEMES, Theme } from '@/components/ThemeProvider';
import styles from './Layout.module.scss';

const NAV_ITEMS = [
  { href: '/', label: 'Simulator' },
  { href: '/selector', label: 'Selector' },
  { href: '/converter', label: 'Converter' },
  { href: '/benchmarker', label: 'Benchmarker' },
];

const THEME_META: Record<Theme, { icon: React.ReactNode; label: string }> = {
  light: { 
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>, 
    label: 'Light' 
  },
  dark: { 
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>, 
    label: 'Dark' 
  },
  retro: { 
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/></svg>, 
    label: 'Retro' 
  },
  hacker: { 
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>, 
    label: 'Hacker' 
  },
  cyberpunk: { 
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>, 
    label: 'Cyberpunk' 
  },
  nord: { 
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M12 2v20"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/></svg>, 
    label: 'Nord' 
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.logo}>
          evm<span>utils</span>
        </Link>
        <div className={styles.navRight}>
          <div className={styles.navLinks}>
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className={styles.themeWrapper} ref={themeRef}>
            <button className={styles.themeToggle} onClick={() => setThemeOpen(!themeOpen)} title="Change theme">
              <span className={styles.themeIcon}>{THEME_META[theme].icon}</span>
            </button>
            {themeOpen && (
              <div className={styles.themeDropdown}>
                {THEMES.map((t) => (
                  <button
                    key={t}
                    className={`${styles.themeOption} ${theme === t ? styles.active : ''}`}
                    onClick={() => { setTheme(t); setThemeOpen(false); }}
                  >
                    <span className={styles.themeOptionIcon}>{THEME_META[t].icon}</span>
                    <span>{THEME_META[t].label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.mobileLink} ${pathname === item.href ? styles.active : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <main className={styles.content}>{children}</main>
    </div>
  );
}
