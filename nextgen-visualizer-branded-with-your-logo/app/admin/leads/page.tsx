"use client";

import React, { useEffect } from "react";

export default function LeadsRedirect() {
  useEffect(() => {
    window.location.href = "/admin/crm";
  }, []);
  return <div style={{ padding: 24, color: "#fff" }}>Redirecting to CRM…</div>;
}
