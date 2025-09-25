import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'ATHENA | SOV Token Loyalty Platform',
  description: 'Developer-first loyalty engine. Plug-in rewards in minutes.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
