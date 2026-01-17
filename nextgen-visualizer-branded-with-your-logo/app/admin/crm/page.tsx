"use client";

import React, { useEffect } from "react";
import CrmDashboard from "../../../components/admin/CrmDashboard";
import { AdminAuthProvider, useAdminAuth } from "../../../components/admin/AdminAuthProvider";

function Inner() {
  const { token, loading, signOut, email } = useAdminAuth();

  useEffect(() => {
    if (!loading && !token) window.location.href = "/admin/login";
  }, [loading, token]);

  if (loading) return <div style={{ padding: 24, color: "#fff" }}>Loading...</div>;
  if (!token) return null;

  return (
    <div className="container">
      <header className="header">
        <a className="brand" href="/">
          <img src="/logo.png" alt="NEXTGEN home solutions" />
        </a>
        <div className="cta">
          <span className="pill">{email || "Admin"}</span>
          <a className="btn" href="/visualizer">Visualizer</a>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <CrmDashboard token={token} />
    </div>
  );
}

export default function CrmPage() {
  return (
    <AdminAuthProvider>
      <Inner />
    </AdminAuthProvider>
  );
}
