import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#496d5d", borderRadius: 42 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: 88 }}>
        <div style={{ height: 9, borderRadius: 8, background: "#f8f7f3" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 9, borderRadius: 8, background: "#f8f7f3" }} />
          <div style={{ width: 15, height: 15, borderRadius: 99, background: "#d5a66d" }} />
        </div>
        <div style={{ height: 9, borderRadius: 8, background: "#f8f7f3" }} />
      </div>
    </div>,
    size
  );
}
