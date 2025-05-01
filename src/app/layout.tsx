import type {Metadata} from 'next';
import {Geist} from 'next/font/google'; // Removed Geist_Mono as it's not explicitly used
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Network Navigator', // Updated title
  description: 'Optimize IoT Sensor Network Data Flow using Graph Theory', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
         <main>{children}</main>
         <Toaster /> {/* Add Toaster here */}
      </body>
    </html>
  );
}
