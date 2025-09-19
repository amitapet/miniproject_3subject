// src/component/Layout.jsx
import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{ marginLeft: "250px", padding: "20px", flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
