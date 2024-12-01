'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';
import Navbar from '~/components/Navbar';
import Provider from '~/components/provider';

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <SessionProvider>
      {/* Wrap the layout with the Provider */}
      <Provider>
        <html lang="en">
          <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>HR Admin System</title>
          </head>
          <body>
            <Navbar />
            {children}
          </body>
        </html>
      </Provider>
    </SessionProvider>
  );
};

export default RootLayout;
