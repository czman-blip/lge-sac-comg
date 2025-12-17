import { useRef, useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
}

// Constants for image optimization
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const JPEG_QUALITY = 0.7;
const MAX_IMAGES_DEFAULT = 10;
const MAX_FILE_SIZE_MB = 10;

// Optimized image resizing with proper cleanup
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check file size limit
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      reject(new Error(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit`));
      return;
    }

    const reader = new FileReader();
    
    reader.onerror = () => {
      reader.abort();
      reject(new Error("Failed to read file"));
    };

    reader.onload = (e) => {
      const img = new Image();
      
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round(height * (MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round(width * (MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          // Use better image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const result = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          
          // Cleanup
          canvas.width = 0;
          canvas.height = 0;
          
          resolve(result);
        } catch (error) {
          reject(new Error("Failed to process image"));
        }
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

// Memoized image thumbnail component
const ImageThumbnail = memo(({ 
  src, 
  index, 
  onRemove, 
  disabled 
}: { 
  src: string; 
  index: number; 
  onRemove: (index: number) => void;
  disabled: boolean;
}) => (
  <div className="relative group">
    <img
      src={src}
      alt={`Upload ${index + 1}`}
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

ImageThumbnail.displayName = 'ImageThumbnail';

export const ImageUpload = memo(({ 
  images, 
  onImagesChange, 
  disabled,
  maxImages = MAX_IMAGES_DEFAULT 
}: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding more images would exceed the limit
    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Maximum ${maxImages} images allowed`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    if (filesToProcess.length < files.length) {
      toast.warning(`Only ${remainingSlots} more image(s) can be added`);
    }

    setIsProcessing(true);

    try {
      const processedImages: string[] = [];
      
      // Process images one at a time to prevent memory overflow
      for (const file of filesToProcess) {
        try {
          const resized = await resizeImage(file);
          processedImages.push(resized);
          
          // Small delay between processing to allow garbage collection
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error("Failed to process image:", error);
          toast.error(`Failed to process ${file.name}`);
        }
      }
      
      if (processedImages.length > 0) {
        // Use functional update to avoid stale closure
        onImagesChange([...images, ...processedImages]);
        toast.success(`${processedImages.length} image(s) added`);
      }
    } catch (error) {
      console.error("Image upload error:", error);
      toast.error("Failed to process images");
    } finally {
      setIsProcessing(false);
      // Reset input to allow re-uploading same files
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [images, onImagesChange, maxImages]);

  const handleRemove = useCallback((index: number) => {
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
    <div className="inline-flex flex-col gap-2">
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
            <span className="hidden sm:inline">
              {isProcessing ? "Processing..." : "Add Image"}
            </span>
            <span className="sm:hidden">
              {isProcessing ? "..." : "Add"}
            </span>
            {images.length > 0 && (
              <span className="text-xs">({images.length}/{maxImages})</span>
            )}
          </Button>
        </>
      )}
      
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          {images.map((image, index) => (
            <ImageThumbnail
              key={`img-${index}-${image.slice(-20)}`}
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

ImageUpload.displayName = 'ImageUpload';
