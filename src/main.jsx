import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { MotionConfig } from "motion/react";
import { Toaster } from "react-hot-toast";

import App from "./App";
import { CatalogProvider } from "./context/CatalogContext";
import { CartProvider } from "./context/CartContext";
import { QuickViewProvider } from "./context/QuickViewContext";
import ErrorBoundary from "./components/common/ErrorBoundary";

import "./styles/variables.css";
import "./styles/globals.css";
import "./styles/animations.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
    <HelmetProvider>
      <BrowserRouter>
        {/* reducedMotion="user" disables transform/layout animations when the OS requests reduced motion */}
        <MotionConfig reducedMotion="user">
          <CatalogProvider>
          <CartProvider>
            <QuickViewProvider>
              <App />
              <Toaster
                position="top-center"
                gutter={8}
                toastOptions={{
                  duration: 2800,
                  style: {
                    background: "#1B2B23",
                    color: "#F3EDE0",
                    border: "1px solid rgba(243,237,224,0.15)",
                    fontSize: "14px",
                  },
                  iconTheme: { primary: "#B5A477", secondary: "#101A16" },
                }}
              />
            </QuickViewProvider>
          </CartProvider>
          </CatalogProvider>
        </MotionConfig>
      </BrowserRouter>
    </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);
