"use client";

import { QRCodeSVG } from "qrcode.react";

type JoinQRProps = {
  url: string;
  size?: number;
  tone?: "light" | "dark";
  showCaption?: boolean;
  padding?: "default" | "large";
};

const JoinQR = ({
  url,
  size = 220,
  tone = "light",
  showCaption = true,
  padding = "default",
}: JoinQRProps) => {
  const isDark = tone === "dark";
  const paddingClass = padding === "large" ? "p-6" : "p-4";

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`rounded-2xl bg-white shadow-lg ring-1 ring-black/5 ${paddingClass}`}
      >
        <QRCodeSVG value={url} size={size} level="M" />
      </div>
      {showCaption ? (
        <>
          <p
            className={`text-sm font-medium ${
              isDark ? "text-white/90" : "text-ink-muted"
            }`}
          >
            Scan to join
          </p>
          <p
            className={`break-all text-center text-xs ${
              isDark ? "text-white/60" : "text-ink-faint"
            }`}
          >
            {url}
          </p>
        </>
      ) : null}
    </div>
  );
};

export default JoinQR;
