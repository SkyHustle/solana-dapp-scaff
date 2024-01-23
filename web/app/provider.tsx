'use client';

import React, { ReactNode, useState } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

export function Provider({ children }: { children: ReactNode }) {
  const [client] = useState(new QueryClient());

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
