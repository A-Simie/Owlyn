import { useRef, useState, useEffect, useCallback } from "react";

export default function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#c59f59");
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [lineWidth, setLineWidth] = useState(3);

  // Sync canvas resolution
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      if (canvas.width !== width || canvas.height !== height) {
        const temp = canvas
          .getContext("2d")
          ?.getImageData(0, 0, canvas.width, canvas.height);
        canvas.width = width;
        canvas.height = height;
        if (temp) canvas.getContext("2d")?.putImageData(temp, 0, 0);
      }
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.lineWidth = tool === "eraser" ? lineWidth * 10 : lineWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = tool === "eraser" ? "#0D0D0D" : color;
    ctx.globalCompositeOperation =
      tool === "eraser" ? "destination-out" : "source-over";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(
      0,
      0,
      canvasRef.current?.width || 0,
      canvasRef.current?.height || 0,
    );
  };

  return (
    <div className="h-full w-full bg-[#0D0D0D] p-8 flex flex-col gap-6 font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#c59f59]">
            palette
          </span>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">
            Whiteboard
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 pr-4 border-r border-white/5">
            <ToolBtn
              icon="edit"
              active={tool === "pen"}
              onClick={() => setTool("pen")}
            />
            <ToolBtn
              icon="ink_eraser"
              active={tool === "eraser"}
              onClick={() => setTool("eraser")}
            />
            <ToolBtn icon="delete" onClick={clear} />
          </div>
          <div className="flex items-center gap-2">
            {["#c59f59", "#3b82f6", "#ef4444", "#10b981", "#ffffff"].map(
              (c) => (
                <button
                  key={c}
                  onClick={() => {
                    setColor(c);
                    setTool("pen");
                  }}
                  className={`size-5 rounded-full border border-white/10 transition-transform ${color === c && tool === "pen" ? "scale-125 border-white ring-2 ring-white/20 ring-offset-2 ring-offset-[#0D0D0D]" : "hover:scale-110"}`}
                  style={{ backgroundColor: c }}
                />
              ),
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-black/40 rounded-3xl overflow-hidden cursor-crosshair border border-white/5">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
          className="w-full h-full touch-none"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none opacity-20">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#c59f59]">
            Canvas Engine: Vision Mode
          </div>
          <div className="flex gap-1 h-3 shrink-0">
            <div className="w-0.5 bg-[#c59f59]/20" />
            <div className="w-0.5 bg-[#c59f59]/40" />
            <div className="w-0.5 bg-[#c59f59]/60" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-700 pt-4 border-t border-white/5">
        <span>
          Note: Canvas data is synchronized for multimodal evaluation.
        </span>
        <span className="text-[#c59f59]">
          Drafting: {tool === "pen" ? "Ink" : "Eraser"} Mode
        </span>
      </div>
    </div>
  );
}

function ToolBtn({
  icon,
  active,
  onClick,
}: {
  icon: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`size-10 rounded-xl flex items-center justify-center transition-all ${active ? "bg-[#c59f59] text-black shadow-lg shadow-[#c59f59]/10" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}
    >
      <span className="material-symbols-outlined text-lg">{icon}</span>
    </button>
  );
}
