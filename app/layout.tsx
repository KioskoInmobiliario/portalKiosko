import type { Metadata } from "next";
import { Poppins, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthReturn from './auth-return';

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Portal Kiosko | Propietarios y arrendatarios",
  description: "Pagos, cuentas de cobro, mantenimientos y consultas de Kiosko Inmobiliario en un solo lugar.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/kiosko-logo.png",
    shortcut: "/kiosko-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${poppins.variable} ${geistMono.variable} antialiased`}
      >
        <AuthReturn />
        {children}
      </body>
    </html>
  );
}
