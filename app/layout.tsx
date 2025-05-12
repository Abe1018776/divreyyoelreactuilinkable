// app/layout.tsx
import './globals.css'; // Tailwind directives & your custom CSS
import { Noto_Sans_Hebrew } from 'next/font/google';
import localFont from 'next/font/local';
import { ThemeProvider } from "@/components/theme-provider";

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  variable: '--font-noto-sans-hebrew',
  display: 'swap',
});

const mekorotRashi = localFont({
  src: '../public/fonts/Mekorot-Rashi.ttf',
  variable: '--font-mekorot-rashi',
  display: 'swap',
});

export const metadata = {
  title: 'Sefer HaKadosh Divrei Yoel',
  description: "A digital library of D'vrei Torah from the Satmar Rebbe, Rabbi Yoel Teitelbaum",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${notoSansHebrew.variable} ${mekorotRashi.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground font-sans antialiased min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
