import { Suspense, lazy, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/common/Navbar";
import PageTransition from "./components/common/PageTransition";
import SmoothScroll from "./components/common/SmoothScroll";
import ScrollToHash from "./components/common/ScrollToHash";
import RouteAnnouncer from "./components/common/RouteAnnouncer";
import Loader from "./components/common/Loader";
import WhatsAppLinks from "./components/common/WhatsAppLinks";
import { scrollToTop } from "./utils/scroll";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Trending from "./pages/Trending";
import Collections from "./pages/Collections";
import Cart from "./pages/Cart";
// About page is kept in src/pages/About.jsx but hidden: to show it again, import it and restore the route + menu/footer links.
import NotFound from "./pages/NotFound";
import MyOrder from "./pages/MyOrder";

// The admin panel (and the Supabase auth library) only download when /admin is opened.
const AdminApp = lazy(() => import("./admin/AdminApp"));

const page = (element) => <PageTransition>{element}</PageTransition>;

export default function App() {
  const location = useLocation();

  // Switching tabs: jump straight to the top of the new page (no waiting for exit animations)
  useEffect(() => {
    if (!location.hash) scrollToTop();
  }, [location.pathname, location.hash]);

  if (location.pathname === "/admin" || location.pathname.startsWith("/admin/")) {
    return (
      <Suspense fallback={<div className="grid min-h-[100dvh] place-items-center text-mist">Loading…</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  return (
    <>
      <Loader />
      <WhatsAppLinks />
      <SmoothScroll />
      <ScrollToHash />
      <RouteAnnouncer />
      <a href="#main" className="skip-link">Skip to content</a>
      <Navbar />
      <Routes location={location}>
        <Route path="/" element={page(<Home />)} />
        <Route path="/shop" element={page(<Shop />)} />
        <Route path="/trending" element={page(<Trending />)} />
        <Route path="/collections" element={page(<Collections />)} />
        <Route path="/cart" element={page(<Cart />)} />
        <Route path="/my-order" element={page(<MyOrder />)} />
        <Route path="*" element={page(<NotFound />)} />
      </Routes>
    </>
  );
}
