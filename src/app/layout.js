import { Inter, DM_Sans, Source_Code_Pro } from "next/font/google";
import "./globals.scss";
import AuthProvider from "../../components/auth/AuthProvider";

// Primary font for body text
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Font for headings and UI elements
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-dm-sans",
});

// Monospace font for code snippets
const sourceCodePro = Source_Code_Pro({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-code",
});

export const metadata = {
  title: "ChromeX - AI Writing Assistant",
  description: "Supercharge your browsing experience with AI writing tools and assistance",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable} ${sourceCodePro.variable}`}>
      <body className={dmSans.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
