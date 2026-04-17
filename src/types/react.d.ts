// TypeScript declarations for React CSS properties extensions

import 'react';

declare module 'react' {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}
