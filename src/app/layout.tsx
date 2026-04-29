import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import AppLayout from '@/components/Layout';
import AntdRegistry from '@/components/AntdRegistry';
import { ThemeProvider } from '@/components/ThemeProvider';
import '@/styles/global.scss';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'EVM Utils',
  description: 'EVM Transaction Simulator & Developer Tools',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t);document.body.style.background=t==='dark'?'#141414':'#ffffff'}catch(e){}}())`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AntdRegistry>
            <AppLayout>{children}</AppLayout>
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  );
}
