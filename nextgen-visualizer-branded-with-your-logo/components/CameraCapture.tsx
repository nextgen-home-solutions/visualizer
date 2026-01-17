"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (dataUrl: string) => void;
};

export default function CameraCapture({ onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function start() {
      setError(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setActive(true);
        }
      } catch (e: any) {
        setError(e?.message ?? "Camera permission denied or unavailable.");
      }
    }

    if (active) start();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [active]);

  function capture() {
    const v = videoRef.current;
    if (!v) return;

    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCapture(dataUrl);
    setActive(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!active ? (
        <button className="btn" onClick={() => setActive(true)}>
          Use camera
        </button>
      ) : (
        <>
          <video ref={videoRef} className="preview" style={{ maxHeight: 360 }} playsInline />
          <div className="row">
            <button className="btn primary" onClick={capture}>Capture photo</button>
            <button className="btn" onClick={() => setActive(false)}>Cancel</button>
          </div>
        </>
      )}
      {error ? <div className="small">Camera error: {error}</div> : null}
      <div className="small">Tip: Use bright lighting and keep the camera level for best results.</div>
    </div>
  );
}
