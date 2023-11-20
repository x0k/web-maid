import ReactDOM from "react-dom/client";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export function renderInShadowDom(
  container: HTMLElement,
  children: React.ReactNode
) {
  const shadowContainer = container.attachShadow({ mode: "open" });
  const styleReset = document.createElement("style");
  styleReset.innerHTML = `:host { all: initial; }`;
  shadowContainer.appendChild(styleReset);
  const emotionRoot = document.createElement("style");
  shadowContainer.appendChild(emotionRoot);
  const shadowRootElement = document.createElement("div");
  shadowContainer.appendChild(shadowRootElement);
  const cache = createCache({
    key: "scraper-extension",
    prepend: true,
    container: emotionRoot,
  });
  const shadowTheme = createTheme({
    components: {
      MuiPopover: {
        defaultProps: {
          container: shadowRootElement,
        },
      },
      MuiPopper: {
        defaultProps: {
          container: shadowRootElement,
        },
      },
      MuiModal: {
        defaultProps: {
          container: shadowRootElement,
        },
      },
    },
  });
  ReactDOM.createRoot(shadowRootElement).render(
    <CacheProvider value={cache}>
      <ThemeProvider theme={shadowTheme}>{children}</ThemeProvider>
    </CacheProvider>
  );
}
