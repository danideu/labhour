import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "LabHour | Gestión de fichajes",
  description: "Plataforma de registro horario y gestión de fichajes SaaS",
  icons: {
    icon: '/logo_v2.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
