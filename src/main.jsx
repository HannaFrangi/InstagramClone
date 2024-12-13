import { createRoot } from "react-dom/client";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import App from "./App.jsx";
import "./index.css";
import { mode } from "@chakra-ui/theme-tools";
import { BrowserRouter } from "react-router-dom";
import Snowfall from "react-snowfall";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const styles = {
  global: (props) => ({
    body: {
      bg: mode("gray.100", "#121212")(props), // Use a true dark background for dark mode
      color: mode("gray.800", "whiteAlpha.900")(props),
      transition: "background-color 0.2s, color 0.2s", // Add smooth transitions for colors
    },
    "*::placeholder": {
      color: mode("gray.400", "whiteAlpha.400")(props),
    },
    "*": {
      borderColor: mode("gray.200", "whiteAlpha.300")(props),
    },
  }),
};

const theme = extendTheme({
  config,
  styles,
  colors: {
    brand: {
      light: "#f0e7db", // Light mode brand color
      dark: "#202023", // Dark mode brand color
    },
  },
});

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ChakraProvider theme={theme}>
      <Snowfall />
      <App />
    </ChakraProvider>
  </BrowserRouter>
);
