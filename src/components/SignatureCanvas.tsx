import { useRef, useEffect, useState } from "react";
import SignatureCanvasLib from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignatureCanvasProps {
  signature: string;
  onSave: (signature: string) => void;
  disabled?: boolean;
}

export const SignatureCanvas = ({ signature, onSave, disabled }: SignatureCanvasProps) => {
  const sigCanvas = useRef<SignatureCanvasLib>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (signature && sigCanvas.current) {
      try {
        sigCanvas.current.fromDataURL(signature);
      } catch (error) {
        console.error("Failed to load signature:", error);
      }
    }
  }, [signature]);

  // Restore signature after canvas size changes
  useEffect(() => {
    const handleResize = () => {
      if (signature && sigCanvas.current && !isDrawing) {
        setTimeout(() => {
          try {
            sigCanvas.current?.fromDataURL(signature);
          } catch (error) {
            console.error("Failed to restore signature:", error);
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [signature, isDrawing]);

  const handleClear = () => {
    sigCanvas.current?.clear();
    onSave("");
  };

  const handleSave = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL();
      onSave(dataUrl);
    }
  };

  const handleBegin = () => {
    setIsDrawing(true);
  };

  const handleEnd = () => {
    setIsDrawing(false);
    handleSave();
  };

  return (
    <div className="space-y-2">
      <div 
        ref={containerRef}
        className="border-2 border-border rounded bg-white touch-none"
        style={{ touchAction: 'none' }}
      >
        <SignatureCanvasLib
          ref={sigCanvas}
          canvasProps={{
            className: "w-full h-32 cursor-crosshair touch-none",
            style: { touchAction: 'none' },
          }}
          onBegin={handleBegin}
          onEnd={handleEnd}
        />
      </div>
      {!disabled && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClear}
          type="button"
        >
          Clear Signature
        </Button>
      )}
    </div>
  );
};
