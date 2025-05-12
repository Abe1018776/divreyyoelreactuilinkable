// app/layout.tsx
import './globals.css'; // Your merged global styles
import { Noto_Sans_Hebrew } from 'next/font/google';
import localFont from 'next/font/local';
import { ThemeProvider } from "@/components/theme-provider"; // Assuming you create this for dark mode

const notoSansHebrew = Noto_Sans_Hebrew({
  subsets: ['hebrew', 'latin'],
  variable: '--font-noto-sans-hebrew', // CSS variable for Tailwind
  display: 'swap',
});

const mekorotRashi = localFont({
  src: '../public/fonts/Mekorot-Rashi.ttf', // Path relative to app directory
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
    <html lang="he" dir="rtl" className={`${notoSansHebrew.variable} ${mekorotRashi.variable}`} suppressHydrationWarning>
      {/* No need for <head> here for preloading if using next/font correctly; next/font handles it.
          The <link rel="preload"> for Mekorot-Rashi.ttf is handled by next/font/local when display: 'swap' is used.
      */}
      <body>
        <ThemeProvider
            attribute="class"
            defaultTheme="system" // Or "light" or "dark"
            enableSystem
            disableTransitionOnChange
          >
          {children}
          {/* Consider adding a Toaster component here if you use Shadcn toasts */}
        </ThemeProvider>
      </body>
    </html>
  );
}