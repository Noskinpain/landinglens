export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "#1a1a1a",
        color: "#f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: "2.5px solid rgba(255,255,255,0.1)",
            borderTopColor: "rgba(255,255,255,0.6)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600,
          }}
        >
          Capturing screenshot...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </main>
  );
}
