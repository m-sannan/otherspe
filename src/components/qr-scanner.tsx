import { useEffect, useRef, useState } from "react";
import { Flashlight, ImagePlus, X } from "lucide-react";
import { decodeQrFromBlob, decodeQrFromImageData } from "@/lib/decode-qr";
import { cn } from "@/lib/utils";

type TorchTrack = MediaStreamTrack & {
  getCapabilities?: () => { torch?: boolean };
  applyConstraints: (c: MediaTrackConstraints & { advanced?: Array<{ torch?: boolean }> }) => Promise<void>;
};

export function QrScanner({
  onRaw,
  onClose,
  onFileError,
  onSample,
}: {
  onRaw: (raw: string) => void;
  onClose: () => void;
  onFileError: (message: string) => void;
  onSample: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onRawRef = useRef(onRaw);
  const seenRef = useRef<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [reading, setReading] = useState(false);

  onRawRef.current = onRaw;

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        const track = stream.getVideoTracks()[0] as TorchTrack | undefined;
        const caps = track?.getCapabilities() as { torch?: boolean } | undefined;
        setTorchAvailable(Boolean(caps?.torch));

        let ticks = 0;
        const loop = () => {
          raf = requestAnimationFrame(loop);
          ticks += 1;
          if (ticks % 3 !== 0) return;
          const v = videoRef.current;
          if (!v || !ctx || v.readyState < 2) return;
          const w = v.videoWidth;
          const h = v.videoHeight;
          if (!w || !h) return;
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(v, 0, 0, w, h);
          const raw = decodeQrFromImageData(ctx.getImageData(0, 0, w, h));
          if (!raw || seenRef.current === raw) return;
          seenRef.current = raw;
          onRawRef.current(raw);
          window.setTimeout(() => {
            if (seenRef.current === raw) seenRef.current = null;
          }, 1600);
        };
        raf = requestAnimationFrame(loop);
      } catch {
        if (!cancelled) {
          setCameraError("Camera is blocked on this browser. Upload a screenshot instead.");
        }
      }
    }

    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0] as TorchTrack | undefined;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
    }
  };

  const onFile = async (file: File) => {
    setReading(true);
    try {
      const raw = await decodeQrFromBlob(file);
      if (!raw) {
        onFileError("Could not read a QR in that image. Try a tighter crop.");
        return;
      }
      onRaw(raw);
    } catch {
      onFileError("Could not open that image.");
    } finally {
      setReading(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink text-paper">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Upload UPI QR"
        className="sr-only"
        data-testid="qr-file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void onFile(file);
          event.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={onClose}
        className="absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 flex size-11 items-center justify-center rounded-full text-paper"
        aria-label="Close scanner"
      >
        <X className="size-6" />
      </button>

      <div className="relative flex flex-1 items-center justify-center">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <div className="absolute inset-0 bg-ink/40" />
        <div className="relative z-10 flex flex-col items-center gap-8 px-8">
          <Viewfinder />
          <p className="text-center text-sm font-medium text-lime">
            {reading ? "Reading QR…" : "Scan any QR to request"}
          </p>
          {cameraError ? (
            <p className="max-w-xs text-center text-sm leading-relaxed text-paper/80">
              {cameraError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-10 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-1 text-xs font-medium text-paper"
        >
          <ImagePlus className="size-5" />
          Upload QR
        </button>
        <button
          type="button"
          onClick={() => void toggleTorch()}
          disabled={!torchAvailable}
          className={cn(
            "flex flex-col items-center gap-1 text-xs font-medium",
            torchAvailable ? "text-paper" : "text-paper/40",
            torchOn && "text-lime",
          )}
        >
          <Flashlight className="size-5" />
          {torchOn ? "Flash on" : "Flash"}
        </button>
      </div>

      <button
        type="button"
        onClick={onSample}
        className="pb-4 text-center text-xs text-paper/50 underline-offset-4 hover:text-paper hover:underline"
      >
        Try a sample QR
      </button>
    </div>
  );
}

function Viewfinder() {
  return (
    <div className="relative size-56">
      <span className="absolute left-0 top-0 h-10 w-10 rounded-tl-xl border-l-[3px] border-t-[3px] border-lime" />
      <span className="absolute right-0 top-0 h-10 w-10 rounded-tr-xl border-r-[3px] border-t-[3px] border-lime" />
      <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl-xl border-b-[3px] border-l-[3px] border-lime" />
      <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br-xl border-b-[3px] border-r-[3px] border-lime" />
    </div>
  );
}
