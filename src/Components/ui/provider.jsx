import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

// Dark mode is fixed via class="dark" on <html> in index.html
export function Provider({ children }) {
  return <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>;
}
