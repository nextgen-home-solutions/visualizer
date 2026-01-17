"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import LeadDetail from "../../../../components/admin/LeadDetail";
import { AdminAuthProvider, useAdminAuth } from "../../../../components/admin/AdminAuthProvider";

function Inner() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { token, loading, signOut, email } = useAdminAuth();

  useEffect(() => {
    if (!loading && !token) window.location.href = "/admin/login";
  }, [loading, token]);

  if (loading) return <div style={{ padding: 24, color: "#fff" }}>Loading...</div>;
  if (!token) return null;
  if (!id) return <div style={{ padding: 24, color: "#fff" }}>Missing lead id</div>;

  return (
    <div className="container">
      <header className="header">
        <a className="brand" href="/">
          <img src="/logo.png" alt="NEXTGEN home solutions" />
        </a>
        <div className="cta">
          <span className="pill">{email || "Admin"}</span>
          <a className="btn" href="/admin/crm">Back</a>
          <button className="btn" onClick={signOut}>Sign out</button>
        </div>
      </header>
      <LeadDetail id={id} token={token} />
    </div>
  );
}

export default function LeadPage() {
  return (
    <AdminAuthProvider>
      <Inner />
    </AdminAuthProvider>
  );
}
