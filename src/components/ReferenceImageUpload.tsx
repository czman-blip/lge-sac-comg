import { useRef, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadReferenceImage, deleteReferenceImage, isStorageUrl } from "@/lib/storageUpload";

interface ReferenceImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

const MAX_FILE_SIZE_MB = 15;

const ImageThumbnail = memo(({ src, index, onRemove, disabled }: { 
  src: string; index: number; onRemove: (index: number) => void; disabled: boolean;
}) => (
  <div className="relative group">
    <img
      src={src}
      alt={`Reference ${index + 1}`}
      className="w-full h-auto object-contain rounded border bg-muted"
      loading="lazy"
    />
    {!disabled && (
      <Button
        variant="destructive"
        size="icon"
        className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onRemove(index)}
        type="button"
      >
        <X className="w-4 h-4" />
      </Button>
    )}
  </div>
));

ImageThumbnail.displayName = 'ReferenceImageThumbnail';

export const ReferenceImageUpload = memo(({ 
  images, 
  onImagesChange, 
  disabled,
  maxImages = 10 
}: ReferenceImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed per item`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    if (filesToProcess.length < files.length) {
      toast.warning(`Only ${remainingSlots} more image(s) can be added`);
    }

    setIsProcessing(true);

    try {
      const uploadedUrls: string[] = [];
      
      for (const file of filesToProcess) {
        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${MAX_FILE_SIZE_MB}MB limit`);
          continue;
        }

        try {
          // Read file as base64 then upload to storage
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
          });

          const url = await uploadReferenceImage(base64, file.name);
          uploadedUrls.push(url);
        } catch (error) {
          console.error("Failed to upload image:", error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
      
      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} image(s) uploaded`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [images, onImagesChange, maxImages]);

  const handleRemove = useCallback(async (index: number) => {
    const imageUrl = images[index];
    // Delete from storage if it's a storage URL
    if (isStorageUrl(imageUrl)) {
      try {
        await deleteReferenceImage(imageUrl);
      } catch (e) {
        console.error("Failed to delete from storage:", e);
      }
    }
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const handleButtonClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  }, [isProcessing]);

  return (
    <div className="space-y-4">
      {!disabled && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            multiple
            disabled={isProcessing}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            onTouchEnd={handleButtonClick}
            type="button"
            disabled={isProcessing || images.length >= maxImages}
            className="h-8 gap-1 text-xs sm:text-sm touch-manipulation active:scale-95 transition-transform"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {isProcessing ? "Uploading..." : "Add Reference Image"}
            {images.length > 0 && (
              <span className="text-xs">({images.length}/{maxImages})</span>
            )}
          </Button>
        </>
      )}
      
      {images.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {images.map((image, index) => (
            <ImageThumbnail
              key={`ref-${index}-${image.slice(-20)}`}
              src={image}
              index={index}
              onRemove={handleRemove}
              disabled={!!disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
});

ReferenceImageUpload.displayName = 'ReferenceImageUpload';
