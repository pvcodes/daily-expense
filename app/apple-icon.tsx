import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#77375e", borderRadius: 42 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 94, height: 94, border: "6px solid #faf6ef", borderRadius: 30, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 54, height: 54, border: "6px solid #faf6ef", borderRadius: 18 }}>
          <div style={{ width: 18, height: 18, borderRadius: 99, background: "#d4785e" }} />
        </div>
        <div style={{ position: "absolute", right: -11, top: 35, width: 18, height: 24, borderRadius: 8, background: "#faf6ef" }} />
      </div>
    </div>,
    size
  );
}
