import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div style={styles.root}>
      <Sidebar />
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    minHeight: "100vh",
    background: "#f4f6fb",
    fontFamily: "'DM Sans', sans-serif",
  },
  main: {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
  },
};
