// routes.tsx (or App.tsx) — React Router v6 route configuration
//
// Install react-router-dom if you haven't:
//   npm install react-router-dom
//
// Usage: wrap your app with <RouterProvider router={router} />
// or replace your existing <Routes> block with the children below.

import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";

import { Dashboard }            from "../components/Dashboard";
import { BeginnerResumePage }   from "../pages/Beginner";
import { ExperiencedResumePage } from "../pages/Experienced";

// ── Optional: shared layout wrapper (navbar, footer, etc.) ──
function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* <Navbar /> */}
      <Outlet />
      {/* <Footer /> */}
    </div>
  );
}

// ── Router ──
export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Redirect root to dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      // ── Dashboard: user chooses their type ──
      { path: "dashboard", element: <Dashboard /> },

      // ── Resume sub-routes ──
      { path: "resume/beginner",    element: <BeginnerResumePage /> },
      { path: "resume/experienced", element: <ExperiencedResumePage /> },

      // Catch-all fallback
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);

// ── Entry point wrapper ──
export function AppRouter() {
  return <RouterProvider router={router} />;
}

// ─────────────────────────────────────────────────────────────────
// If you prefer <BrowserRouter> + <Routes> inside your existing App:
// ─────────────────────────────────────────────────────────────────
//
// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//
// export function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Navigate to="/dashboard" replace />} />
//         <Route path="/dashboard"            element={<Dashboard />} />
//         <Route path="/resume/beginner"      element={<BeginnerResumePage />} />
//         <Route path="/resume/experienced"   element={<ExperiencedResumePage />} />
//         <Route path="*"                     element={<Navigate to="/dashboard" replace />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }