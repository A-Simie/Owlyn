import { useEffect, useRef } from "react";

interface FaceTrackerProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraOn: boolean;
}

export default function FaceTracker({ videoRef, cameraOn }: FaceTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackingFrameRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraOn) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Smoothed state in video-pixel coordinates
    let rawFx = 0,
      rawFy = 0,
      rawFw = 0,
      rawFh = 0;
    let rawElx = 0,
      rawEly = 0,
      rawErx = 0,
      rawEry = 0;
    let rawNx = 0,
      rawNy = 0;
    let hasFace = false;
    let initialized = false;
    const spd = 0.3;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const FD = (window as any).FaceDetector;
    const detector = FD
      ? new FD({ fastMode: true, maxDetectedFaces: 1 })
      : null;
    let detectId: ReturnType<typeof setInterval> | null = null;

    const detect = async () => {
      if (!video || video.readyState < 2 || !detector) return;
      try {
        const faces = await detector.detect(video);
        if (faces.length > 0) {
          const f = faces[0];
          const bb = f.boundingBox;
          const cfx = bb.x + bb.width / 2;
          const cfy = bb.y + bb.height / 2;
          const cfw = bb.width * 1.3;
          const cfh = bb.height * 1.4;

          if (!initialized) {
            rawFx = cfx;
            rawFy = cfy;
            rawFw = cfw;
            rawFh = cfh;
            initialized = true;
          } else {
            rawFx += (cfx - rawFx) * spd;
            rawFy += (cfy - rawFy) * spd;
            rawFw += (cfw - rawFw) * spd;
            rawFh += (cfh - rawFh) * spd;
          }
          hasFace = true;

          const eyes: { x: number; y: number }[] = [];
          let noseFound = false;
          if (f.landmarks) {
            for (const lm of f.landmarks) {
              if (lm.type === "eye") {
                for (const loc of lm.locations)
                  eyes.push({ x: loc.x, y: loc.y });
              }
              if (lm.type === "nose" && lm.locations.length >= 1) {
                rawNx += (lm.locations[0].x - rawNx) * spd;
                rawNy += (lm.locations[0].y - rawNy) * spd;
                noseFound = true;
              }
            }
          }

          if (eyes.length >= 2) {
            eyes.sort((a, b) => a.x - b.x);
            rawElx += (eyes[0].x - rawElx) * spd;
            rawEly += (eyes[0].y - rawEly) * spd;
            rawErx += (eyes[1].x - rawErx) * spd;
            rawEry += (eyes[1].y - rawEry) * spd;
          } else {
            rawElx += (bb.x + bb.width * 0.3 - rawElx) * spd;
            rawEly += (bb.y + bb.height * 0.35 - rawEly) * spd;
            rawErx += (bb.x + bb.width * 0.7 - rawErx) * spd;
            rawEry += (bb.y + bb.height * 0.35 - rawEry) * spd;
          }
          if (!noseFound) {
            rawNx += (bb.x + bb.width * 0.5 - rawNx) * spd;
            rawNy += (bb.y + bb.height * 0.6 - rawNy) * spd;
          }
        } else {
          hasFace = false;
        }
      } catch {
        /* skip */
      }
    };

    if (detector) detectId = setInterval(detect, 80);

    const mapToCanvas = (vx: number, vy: number, cw: number, ch: number) => {
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;
      const videoAspect = vw / vh;
      const canvasAspect = cw / ch;
      let scale: number, offsetX: number, offsetY: number;
      if (canvasAspect < videoAspect) {
        scale = ch / vh;
        offsetX = (cw - vw * scale) / 2;
        offsetY = 0;
      } else {
        scale = cw / vw;
        offsetX = 0;
        offsetY = (ch - vh * scale) / 2;
      }
      return { x: vx * scale + offsetX, y: vy * scale + offsetY, scale };
    };

    const draw = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!hasFace && !detector) {
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;
        rawFx = vw * 0.5 + Math.sin(Date.now() / 5000) * vw * 0.02;
        rawFy = vh * 0.4;
        rawFw = vw * 0.25;
        rawFh = vh * 0.35;
        rawElx = vw * 0.44;
        rawEly = vh * 0.35;
        rawErx = vw * 0.56;
        rawEry = vh * 0.35;
        rawNx = vw * 0.5;
        rawNy = vh * 0.45;
        hasFace = true;
      }

      if (!hasFace) {
        trackingFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const fc = mapToCanvas(rawFx, rawFy, w, h);
      const { scale } = fc;
      const rw = (rawFw * scale) / 2;
      const rh = (rawFh * scale) / 2;
      const cx = fc.x;
      const cy = fc.y;
      const el = mapToCanvas(rawElx, rawEly, w, h);
      const er = mapToCanvas(rawErx, rawEry, w, h);
      const ns = mapToCanvas(rawNx, rawNy, w, h);

      ctx.strokeStyle = "#c59f59";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.lineWidth = 2.5;
      const bl = 16;
      for (const a of [
        -Math.PI / 4,
        Math.PI / 4,
        (3 * Math.PI) / 4,
        (5 * Math.PI) / 4,
      ]) {
        const px = cx + Math.cos(a) * rw;
        const py = cy + Math.sin(a) * rh;
        const tx = Math.cos(a),
          ty = Math.sin(a);
        const tanX = -Math.sin(a) * (rw / rh),
          tanY = Math.cos(a) * (rh / rw);
        const tanLen = Math.sqrt(tanX * tanX + tanY * tanY);
        const ntx = tanX / tanLen,
          nty = tanY / tanLen;
        ctx.beginPath();
        ctx.moveTo(px - ntx * bl, py - nty * bl);
        ctx.lineTo(px, py);
        ctx.lineTo(px + tx * bl * 0.5, py + ty * bl * 0.5);
        ctx.stroke();
      }

      ctx.fillStyle = "#c59f59";
      ctx.shadowColor = "#c59f59";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(el.x, el.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(er.x, er.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(el.x, el.y, 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(er.x, er.y, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = "rgba(197, 159, 89, 0.3)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(er.x, er.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "rgba(197, 159, 89, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(ns.x, ns.y);
      ctx.lineTo(er.x, er.y);
      ctx.stroke();

      ctx.fillStyle = "rgba(197,159,89,0.4)";
      ctx.beginPath();
      ctx.arc(ns.x, ns.y, 3, 0, Math.PI * 2);
      ctx.fill();

      trackingFrameRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(trackingFrameRef.current);
      if (detectId) clearInterval(detectId);
    };
  }, [cameraOn]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
