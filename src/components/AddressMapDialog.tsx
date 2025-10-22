import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AddressMapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddressSelect: (address: string) => void;
  currentAddress: string;
}

export const AddressMapDialog = ({
  open,
  onOpenChange,
  onAddressSelect,
  currentAddress,
}: AddressMapDialogProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Google Maps script"));
      document.head.appendChild(script);
    });
  };

  const loadMap = async () => {
    if (!apiKey) {
      toast.error("Please enter Google Maps API key");
      return;
    }

    if (!mapRef.current) return;

    try {
      await loadGoogleMapsScript(apiKey);

      const geocoder = new google.maps.Geocoder();
      let initialCenter = { lat: 37.5665, lng: 126.9780 }; // Default: Seoul

      // Try to geocode current address if exists
      if (currentAddress) {
        try {
          const result = await geocoder.geocode({ address: currentAddress });
          if (result.results[0]) {
            initialCenter = result.results[0].geometry.location.toJSON();
          }
        } catch (e) {
          console.log("Could not geocode current address");
        }
      }

      const mapInstance = new google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      const markerInstance = new google.maps.Marker({
        position: initialCenter,
        map: mapInstance,
        draggable: true,
        title: "Drag to select location",
      });

      // Get address for initial position
      geocoder.geocode({ location: initialCenter }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          setSelectedAddress(results[0].formatted_address);
        }
      });

      // Add click listener to map
      mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          markerInstance.setPosition(e.latLng);
          geocoder.geocode({ location: e.latLng }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              setSelectedAddress(results[0].formatted_address);
            }
          });
        }
      });

      // Add drag listener to marker
      markerInstance.addListener("dragend", () => {
        const position = markerInstance.getPosition();
        if (position) {
          geocoder.geocode({ location: position }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              setSelectedAddress(results[0].formatted_address);
            }
          });
        }
      });

      setMap(mapInstance);
      setMarker(markerInstance);
      setIsMapLoaded(true);
      toast.success("Map loaded successfully!");
    } catch (error) {
      console.error("Error loading map:", error);
      toast.error("Failed to load Google Maps. Please check your API key.");
    }
  };

  const handleConfirm = () => {
    if (selectedAddress) {
      onAddressSelect(selectedAddress);
      onOpenChange(false);
      toast.success("Address selected!");
    } else {
      toast.error("Please select a location on the map");
    }
  };

  useEffect(() => {
    if (!open) {
      setIsMapLoaded(false);
      setMap(null);
      setMarker(null);
      setSelectedAddress("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Address from Map</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isMapLoaded && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Google Maps API Key:</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your Google Maps API key"
                  className="flex-1"
                />
                <Button onClick={loadMap}>Load Map</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://console.cloud.google.com/google/maps-apis"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Google Cloud Console
                </a>
              </p>
            </div>
          )}

          {isMapLoaded && (
            <>
              <div
                ref={mapRef}
                className="w-full h-[400px] rounded-lg border border-border"
              />

              {selectedAddress && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Selected Address:</label>
                  <Input
                    value={selectedAddress}
                    onChange={(e) => setSelectedAddress(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleConfirm}>Confirm Address</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
