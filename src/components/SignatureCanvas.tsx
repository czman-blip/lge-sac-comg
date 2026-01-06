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
  const lastSavedSignature = useRef<string>("");

  useEffect(() => {
    // Handle clearing: if signature becomes empty, clear the canvas
    if (!signature && sigCanvas.current && lastSavedSignature.current !== "") {
      sigCanvas.current.clear();
      lastSavedSignature.current = "";
      return;
    }
    
    // Only load signature if it's different from what we last saved
    // This prevents re-drawing the same signature on top of itself
    if (signature && sigCanvas.current && signature !== lastSavedSignature.current) {
      try {
        // Check if canvas is not empty and signature is the same as current
        if (!sigCanvas.current.isEmpty()) {
          const currentData = sigCanvas.current.toDataURL();
          if (currentData === signature) {
            return; // Already displaying this signature, no need to reload
          }
        }
        sigCanvas.current.fromDataURL(signature);
        lastSavedSignature.current = signature;
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
    lastSavedSignature.current = "";
    onSave("");
  };

  const handleSave = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const dataUrl = sigCanvas.current.toDataURL();
      lastSavedSignature.current = dataUrl;
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
      <Button
        variant="outline"
        size="sm"
        onClick={handleClear}
        type="button"
      >
        Clear
      </Button>
    </div>
  );
};
