import { useCallback, useEffect, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Loader2, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/common/Button";
import { hasBackend } from "../lib/config";
import { siteConfig } from "../config/site";
import { supabase } from "./supabase";
import { Field } from "./ui";
import OrdersAdmin from "./OrdersAdmin";
import ProductsAdmin from "./ProductsAdmin";
import CollectionsAdmin from "./CollectionsAdmin";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) toast.error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message);
  };

  return (
    <main className="grid min-h-[100dvh] place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-sm border border-ivory/15 bg-evergreen/60 p-7">
        <div>
          <p className="text-sm text-gold">{siteConfig.brandName}</p>
          <h1 className="text-5xl">Admin</h1>
        </div>
        <Field id="admin-email" label="Email">
          <input id="admin-email" type="email" autoComplete="username" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="admin-pass" label="Password">
          <input id="admin-pass" type="password" autoComplete="current-password" required className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Button type="submit" variant="primary" size="md" disabled={busy} className="w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Sign in
        </Button>
      </form>
    </main>
  );
}

const TABS = [
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/collections", label: "Collections" },
];

export default function AdminApp() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [admin, setAdmin] = useState(null); // null = unknown, true/false once checked

  useEffect(() => {
    if (!hasBackend) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  // Being signed in isn't enough: the account must be listed in the admins table.
  useEffect(() => {
    if (!session) {
      setAdmin(null);
      return;
    }
    let live = true;
    supabase
      .from("admins")
      .select("email")
      .then(({ data, error }) => live && setAdmin(!error && (data || []).length > 0));
    return () => {
      live = false;
    };
  }, [session]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const head = (
    <Helmet>
      <title>Admin · {siteConfig.brandName}</title>
      <meta name="robots" content="noindex,nofollow" />
    </Helmet>
  );

  if (!hasBackend) {
    return (
      <main className="grid min-h-[100dvh] place-items-center px-5 text-center">
        {head}
        <div className="max-w-md">
          <h1 className="text-5xl">Admin isn't connected yet</h1>
          <p className="mt-4 text-mist">
            Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your environment variables, then redeploy. SETUP.md explains each step.
          </p>
        </div>
      </main>
    );
  }
  if (session === undefined) return <div className="grid min-h-[100dvh] place-items-center text-mist">{head}Loading…</div>;
  if (!session) return <>{head}<Login /></>;
  if (admin === null) return <div className="grid min-h-[100dvh] place-items-center text-mist">{head}Checking your access…</div>;
  if (admin === false) {
    return (
      <main className="grid min-h-[100dvh] place-items-center px-5 text-center">
        {head}
        <div className="max-w-md">
          <h1 className="text-5xl">No access</h1>
          <p className="mt-4 text-mist">{session.user.email} is signed in, but it isn't an admin account.</p>
          <Button onClick={signOut} variant="outline" className="mt-6">Sign out</Button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh]">
      {head}
      <header className="sticky top-0 z-40 border-b border-ivory/15 bg-forest/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-6">
            <a href="/" className="font-serif text-2xl">{siteConfig.brandName}</a>
            <nav aria-label="Admin sections" className="flex gap-1">
              {TABS.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-1.5 text-sm transition-colors ${isActive ? "bg-ivory text-forest" : "text-mist hover:text-ivory"}`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <button type="button" onClick={signOut} className="flex items-center gap-2 text-sm text-mist hover:text-ivory">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Routes>
          <Route path="/admin/orders" element={<OrdersAdmin />} />
          <Route path="/admin/products" element={<ProductsAdmin />} />
          <Route path="/admin/collections" element={<CollectionsAdmin />} />
          <Route path="*" element={<Navigate to="/admin/orders" replace />} />
        </Routes>
      </main>
    </div>
  );
}

