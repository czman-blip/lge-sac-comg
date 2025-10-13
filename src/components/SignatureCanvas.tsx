import { useRef, useEffect } from "react";
import SignatureCanvasLib from "react-signature-canvas";
import { Button } from "@/components/ui/button";

interface SignatureCanvasProps {
  signature: string;
  onSave: (signature: string) => void;
  disabled?: boolean;
}

export const SignatureCanvas = ({ signature, onSave, disabled }: SignatureCanvasProps) => {
  const sigCanvas = useRef<SignatureCanvasLib>(null);

  useEffect(() => {
    if (signature && sigCanvas.current && sigCanvas.current.isEmpty()) {
      sigCanvas.current.fromDataURL(signature);
    }
  }, [signature]);

  const handleClear = () => {
    sigCanvas.current?.clear();
    onSave("");
  };

  const handleSave = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.toDataURL();
      onSave(dataUrl);
    }
  };

  return (
    <div className="space-y-2">
      <div className="border-2 border-border rounded bg-white">
        <SignatureCanvasLib
          ref={sigCanvas}
          canvasProps={{
            className: "w-full h-32 cursor-crosshair",
          }}
          onEnd={handleSave}
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
