import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySection } from "@/components/CategorySection";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Category, ReportData } from "@/types/report";
import { Plus, CalendarIcon, KeyRound, MapPin, X, Printer, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PasswordDialog } from "@/components/PasswordDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { useTemplate } from "@/hooks/useTemplate";
import { safeLocalStorageSave, safeLocalStorageLoad } from "@/hooks/useLocalStorage";

const STORAGE_KEY = "lge-sac-commissioning-report";
const LOCAL_DATA_KEY = "lge-sac-local-data";
const SAVE_DEBOUNCE_MS = 500;

const STORAGE_BASE = "https://axmesgvtkusntzkpxojy.supabase.co/storage/v1/object/public/reference-images/";

const defaultData: ReportData = {
  title: "LGE SAC Commissioning Report",
  projectName: "",
  opportunityNumber: "",
  address: "",
  products: [
    { name: "ODU", modelName: "", quantity: "" },
    { name: "IDU", modelName: "", quantity: "" },
  ],
  categories: [
    {
      id: "cat-material",
      name: "Material",
      items: [
        { id: "item-mat-1", text: "1. Diameter and Thickness of refrigerant pipe should be as recommended by LG", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775095894166-____2.jpg`] },
        { id: "item-mat-2", text: "Copper pipe should be covered with a cap for preventing inflow of external materials.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775095917670-____3.jpg`, `${STORAGE_BASE}1775095919174-____4.jpg`] },
        { id: "item-mat-3", text: "Y-branch in the field should be supplied by LG.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096080433-____5.jpg`, `${STORAGE_BASE}1775096081629-____6.jpg`, `${STORAGE_BASE}1775096083334-____7.jpg`] },
      ],
    },
    {
      id: "cat-refpipe",
      name: "Refrigerant Pipe",
      items: [
        { id: "item-rp-1", text: "Pipe connection and branch installation must be done according to the LG installation standards.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096192227-____8.jpg`, `${STORAGE_BASE}1775096193445-____9.jpg`, `${STORAGE_BASE}1775096194528-____10.jpg`, `${STORAGE_BASE}1775096196217-____11.jpg`] },
        { id: "item-rp-2", text: "Pipe welding should be performed while blowing nitrogen through the pipe.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096217700-____12.jpg`] },
        { id: "item-rp-3", text: "Sleeve should be installed with proper space for the refrigerant pipe, drain pipe and cable.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096245678-____13.jpg`, `${STORAGE_BASE}1775096247403-____14.jpg`, `${STORAGE_BASE}1775096248794-____15.jpg`, `${STORAGE_BASE}1775096250318-____16.jpg`, `${STORAGE_BASE}1775096251656-____17.jpg`, `${STORAGE_BASE}1775096253064-____18.jpg`] },
        { id: "item-rp-4", text: "Distance between hangers of the refrigerant pipe should be in the range of 1.2 ~ 1.5m(horizontal), 2.5 ~ 3.0m(vertical).", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096281963-____19.jpg`, `${STORAGE_BASE}1775096283489-____20.jpg`, `${STORAGE_BASE}1775096285325-____21.jpg`, `${STORAGE_BASE}1775096287274-____22.jpg`, `${STORAGE_BASE}1775096288655-____23.jpg`] },
        { id: "item-rp-5", text: "Perform a standard pressure test to confirm that there is no piping & product leakage.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096327122-____24.jpg`, `${STORAGE_BASE}1775096328680-____25.jpg`] },
      ],
    },
    {
      id: "cat-drainpipe",
      name: "Drain Pipe",
      items: [
        { id: "item-dp-1", text: "Drain pipe size should be as recommended in the installation manual of LG.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096351355-____26.jpg`, `${STORAGE_BASE}1775096352960-____27.jpg`] },
        { id: "item-dp-2", text: "Air vent should be installed to prevent reverse flow in the common drain pipe.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096382907-____28.jpg`] },
        { id: "item-dp-3", text: "Drain pipe should not be connected to the waste pipe to prevent emission of odors.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096403182-____29.jpg`] },
        { id: "item-dp-4", text: "Hanger should be installed within a distnace of 1.0~1.5m.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096421569-____30.jpg`] },
        { id: "item-dp-5", text: "Down slope should be more than 1/50~1/100.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096441163-____31.jpg`] },
      ],
    },
    {
      id: "cat-cable",
      name: "Communication and Power cable",
      items: [
        { id: "item-cb-1", text: "Communication cable should be two core shield wire and its size should be more than 1.0mm².", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096467280-____32.jpg`, `${STORAGE_BASE}1775096468466-____33.jpg`] },
        { id: "item-cb-2", text: "Communication cable should be enclosed in a conduit pipe and kept appropriate spacing away from power cable as PDB.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096491888-____34.jpg`, `${STORAGE_BASE}1775096493140-____35.jpg`] },
        { id: "item-cb-3", text: "Power of all IDUs should be supplied through one circuit breaker. Don't install individual switch or connect power to the IDU from a separate circuit breaker.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096511806-____36.jpg`] },
        { id: "item-cb-4", text: "Use a ring terminal for connections to the power terminal block.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096528596-____37.jpg`] },
        { id: "item-cb-5", text: "Supply power to the outdoor units at least 6 hours before commissioning.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096545497-____38.jpg`] },
        { id: "item-cb-6", text: "The ELCB circuit breaker should be installed for each ODU, IDU", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [] },
      ],
    },
    {
      id: "cat-idu",
      name: "Indoor Unit",
      items: [
        { id: "item-idu-1", text: "Remote controller should be placed where it would not be influenced by external temperature and  the IDU discharge airflow.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096586317-____39.jpg`] },
        { id: "item-idu-2", text: "Connection of IDU and the drain pipe should be done by a flexible hose to prevent connection breakage or drain pipe crack due to its vibration.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096594213-____40.jpg`] },
        { id: "item-idu-3", text: "Service hole size should be sufficeint for checking and servicing the indoor unit ", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096602269-____41.jpg`] },
      ],
    },
    {
      id: "cat-odu",
      name: "Outdoor Unit",
      items: [
        { id: "item-odu-1", text: "Use at least 200mm high concrete or/and H-beam support as a base support of the ODU. And ODU should be fixed tightly with anchor bolt.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096628928-____42.jpg`, `${STORAGE_BASE}1775096630628-____43.jpg`, `${STORAGE_BASE}1775096632363-____44.jpg`] },
        { id: "item-odu-2", text: "Anti-vibration pad should be placed between outdoor unit and foundation.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096665001-____45.jpg`] },
        { id: "item-odu-3", text: "Secure enough space for air circulation and service.", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096691034-____46.jpg`, `${STORAGE_BASE}1775096692326-____47.jpg`, `${STORAGE_BASE}1775096694038-____48.jpg`, `${STORAGE_BASE}1775096695511-____49.jpg`] },
        { id: "item-odu-4", text: "Has ODU been installed in a place (not less than 3 meters apart) that is not affected by equipment generating kitchen exhaust, septic tank exhaust, toilet exhaust and harmonic wave?", ok: false, ng: false, issue: "", images: [], productType: "Multi V", referenceImages: [`${STORAGE_BASE}1775096712004-____50.jpg`] },
      ],
    },
    {
      id: "cat-ahu",
      name: "AHU",
      items: [
        { id: "item-ahu-1", text: "AHU Comm kit Installation (SVC Area, preventing water)", ok: false, ng: false, issue: "", images: [], productType: "AHU", referenceImages: [`${STORAGE_BASE}1775096807671-____5.jpg`] },
        { id: "item-ahu-2", text: "EEV kit capacity should match with the ODU", ok: false, ng: false, issue: "", images: [], productType: "AHU", referenceImages: [`${STORAGE_BASE}1775096823731-____6.jpg`] },
        { id: "item-ahu-3", text: "Additional Refrigerant : Additional refrigerant of DX coil and extended pipe should be charged", ok: false, ng: false, issue: "", images: [], productType: "AHU", referenceImages: [`${STORAGE_BASE}1775096841599-____7.jpg`] },
      ],
    },
    {
      id: "cat-isc",
      name: "ISC",
      items: [
        { id: "item-isc-1", text: "The anti-vibration pad should be 2 layers of 10 mm or more.", ok: false, ng: false, issue: "", images: [], productType: "ISC", referenceImages: [`${STORAGE_BASE}1775100944262-____6.jpg`] },
        { id: "item-isc-2", text: "HMI communication line spec should be 0.75㎟ 2-line Shield and the length should be within 500m.", ok: false, ng: false, issue: "", images: [], productType: "ISC", referenceImages: [`${STORAGE_BASE}1775100966453-____11.jpg`] },
        { id: "item-isc-3", text: "Is there a solution for freeze and burst prevention? (antifreeze/ flow-switch/ circulation pump interlock).", ok: false, ng: false, issue: "", images: [], productType: "ISC", referenceImages: [`${STORAGE_BASE}1775101100441-____12.jpg`] },
        { id: "item-isc-4", text: "Is the load water pump interlocked with the ODU or with the central control?", ok: false, ng: false, issue: "", images: [], productType: "ISC", referenceImages: [`${STORAGE_BASE}1775101113811-____13.jpg`] },
        { id: "item-isc-5", text: "Check how to control ISC (HMI or Contact or Modbus or Schedule).", ok: false, ng: false, issue: "", images: [], productType: "ISC", referenceImages: [`${STORAGE_BASE}1775101130914-____14.jpg`] },
        { id: "item-isc-6", text: "In case of group control with HMI, group control is possible up to 5 unit.", ok: false, ng: false, issue: "", images: [], productType: "ISC", referenceImages: [`${STORAGE_BASE}1775101143101-____15.jpg`] },
        { id: "item-isc-7", text: "Temp. diff should be set according to water flow design", ok: false, ng: false, issue: "", images: [], productType: "ISC", referenceImages: [`${STORAGE_BASE}1775101228800-____16.jpg`] },
      ],
    },
  ],
  inspectionDate: new Date(),
  commissionerSignature: "",
  installerSignature: "",
  customerSignature: "",
  productTypes: ["Multi V", "AHU", "ISC", "Water", "H/Kit", "DOAS"],
};

const Index = () => {
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<string>("Common");
  const [newProductType, setNewProductType] = useState("");
  const { loadTemplate, saveTemplate, isLoading } = useTemplate();
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  // Load template from server and merge with local data
  useEffect(() => {
    const initializeData = async () => {
      const template = await loadTemplate();
      
      // Load local inspection data (OK, NG, Issue, Images)
      const localInspectionData = safeLocalStorageLoad<Record<string, { ok: boolean; ng: boolean; issue: string; images: string[] }>>(
        LOCAL_DATA_KEY, 
        {}
      );

      // Load project info from old storage for backward compatibility
      const savedData = safeLocalStorageLoad<Partial<ReportData> | null>(STORAGE_KEY, null);
      const projectInfo: Partial<ReportData> = savedData ? {
        title: savedData.title || "LGE SAC Commissioning Report",
        projectName: savedData.projectName || "",
        opportunityNumber: savedData.opportunityNumber || "",
        address: savedData.address || "",
        products: savedData.products || defaultData.products,
        inspectionDate: savedData.inspectionDate ? new Date(savedData.inspectionDate) : new Date(),
        commissionerSignature: savedData.commissionerSignature || "",
        installerSignature: savedData.installerSignature || "",
        productTypes: savedData.productTypes || ["Multi V", "AHU", "ISC", "Water", "H/Kit"],
      } : {};

      // Merge template with local inspection data
      const serverCategories = template.categories.length > 0 ? template.categories : defaultData.categories;
      const mergedCategories = serverCategories.map(category => ({
        ...category,
        items: category.items.map(item => {
          const localItem = localInspectionData[item.id];
          return {
            ...item,
            ok: localItem?.ok || false,
            ng: localItem?.ng || false,
            issue: localItem?.issue || "",
            images: localItem?.images || [],
          };
        }),
      }));

      setData({
        ...defaultData,
        ...projectInfo,
        categories: mergedCategories,
        productTypes: template.productTypes.length > 0 ? template.productTypes : defaultData.productTypes,
      });
      
      // Mark as initialized after data is loaded
      isInitializedRef.current = true;
      setIsDataLoaded(true);
    };

    initializeData();
  }, []);

  // Debounced save to localStorage for better performance
  useEffect(() => {
    // Skip saving during initial load or if data is not loaded
    if (!isInitializedRef.current || !data) {
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      // Save main data WITHOUT reference images (they're on the server)
      const dataToSave = {
        ...data,
        categories: data.categories.map(cat => ({
          ...cat,
          items: cat.items.map(item => ({
            ...item,
            referenceImages: undefined,
          })),
        })),
      };
      safeLocalStorageSave(STORAGE_KEY, dataToSave);
      
      // Save local inspection data separately
      const localInspectionData: Record<string, { ok: boolean; ng: boolean; issue: string; images: string[] }> = {};
      data.categories.forEach(category => {
        category.items.forEach(item => {
          localInspectionData[item.id] = {
            ok: item.ok,
            ng: item.ng,
            issue: item.issue,
            images: item.images,
          };
        });
      });
      safeLocalStorageSave(LOCAL_DATA_KEY, localInspectionData);
    }, SAVE_DEBOUNCE_MS);

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data]);

  const handleEditModeToggle = () => {
    if (!data) return;
    if (!editMode) {
      // Entering edit mode - always ask for password
      setShowPasswordDialog(true);
    } else {
      // Exiting edit mode - save template to server (categories and productTypes)
      saveTemplate(data.categories, data.productTypes);
      setEditMode(false);
    }
  };

  const addCategory = () => {
    if (!data) return;
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: "New Category",
      items: [],
    };
    setData({ ...data, categories: [...data.categories, newCategory] });
  };

  const updateCategory = (index: number, category: Category) => {
    if (!data) return;
    const newCategories = [...data.categories];
    newCategories[index] = category;
    setData({ ...data, categories: newCategories });
  };

  const deleteCategory = (index: number) => {
    if (!data) return;
    const newCategories = data.categories.filter((_, i) => i !== index);
    setData({ ...data, categories: newCategories });
  };

  const addProductType = () => {
    if (!data) return;
    if (newProductType && !data.productTypes.includes(newProductType)) {
      setData({ ...data, productTypes: [...data.productTypes, newProductType] });
      setNewProductType("");
      toast.success(`Product type "${newProductType}" added`);
    }
  };

  const deleteProductType = (type: string) => {
    if (!data) return;
    if (data.productTypes.length > 1) {
      setData({ ...data, productTypes: data.productTypes.filter(t => t !== type) });
      if (selectedProductType === type) {
        setSelectedProductType("Common");
      }
      toast.success(`Product type "${type}" deleted`);
    } else {
      toast.error("Cannot delete the last product type");
    }
  };

  const getFilteredCategories = () => {
    if (!data) return [];
    if (selectedProductType === "Common") {
      return data.categories;
    }
    return data.categories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.productType === "Common" || item.productType === selectedProductType
      ),
    })).filter(category => category.items.length > 0);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    const loadingToast = toast.loading("Getting your location...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          toast.dismiss(loadingToast);
          
          if (data.display_name) {
            setData(prev => ({ ...prev, address: data.display_name }));
            toast.success("Location retrieved successfully!");
          } else {
            setData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
            toast.success("Coordinates retrieved!");
          }
        } catch (error) {
          toast.dismiss(loadingToast);
          setData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
          toast.success("Coordinates retrieved!");
        }
      },
      (error) => {
        toast.dismiss(loadingToast);
        toast.error("Unable to retrieve your location");
        console.error("Geolocation error:", error);
      }
    );
  };

  // Show loading state until data is loaded from server
  if (!isDataLoaded || !data) {
    return (
      <div className="min-h-screen bg-secondary py-8 px-4 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading checklist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* PDF Content - includes everything */}
        <div id="pdf-content" className="space-y-6">
          {/* Header */}
          <div className="bg-card border-2 border-border rounded-lg shadow-lg p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                {editMode ? (
                  <Input
                    value={data.title}
                    onChange={(e) => setData({ ...data, title: e.target.value })}
                    className="text-3xl font-bold text-primary h-14"
                  />
                ) : (
                  <h1 className="text-3xl font-bold text-primary">
                    {data.title}
                  </h1>
                )}
                <div className="flex gap-2 w-full sm:w-auto">
                  {!editMode && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm("Are you sure you want to clear all input data? This will reset project info, issues, and uploaded images.")) {
                          setData(prev => prev ? {
                            ...prev,
                            projectName: "",
                            opportunityNumber: "",
                            address: "",
                            products: prev.products.map(p => ({ ...p, modelName: "", quantity: "" })),
                            categories: prev.categories.map(cat => ({
                              ...cat,
                              items: cat.items.map(item => ({
                                ...item,
                                ok: false,
                                ng: false,
                                issue: "",
                                images: [],
                              })),
                            })),
                            commissionerSignature: "",
                            installerSignature: "",
                            customerSignature: "",
                          } : prev);
                          toast.success("All input data has been cleared");
                        }
                      }}
                      className="gap-1.5"
                      data-pdf-hide
                    >
                      <RotateCcw className="w-4 h-4" />
                      Clear
                    </Button>
                  )}
                  <Button
                    variant={editMode ? "default" : "outline"}
                    onClick={handleEditModeToggle}
                    className="flex-1 sm:flex-none"
                    data-pdf-hide
                  >
                    {editMode ? "Edit mode" : "User mode"}
                  </Button>
                  {editMode && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowChangePasswordDialog(true)}
                      title="Change password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Report Content */}
          <div className="bg-card border-2 border-border rounded-lg shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Project Information */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b-2 border-primary pb-2">
              Project Information
            </h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-center">
                <label className="text-sm font-semibold print:items-start">Project name:</label>
                <Input
                  value={data.projectName}
                  onChange={(e) => setData({ ...data, projectName: e.target.value })}
                  placeholder="Enter project name"
                  className="h-14 pt-3 pb-3.5 text-base leading-[1.35] print:max-w-[450px] print:break-words"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-center">
                <label className="text-sm font-semibold print:items-start">Opportunity number:</label>
                <Input
                  value={data.opportunityNumber}
                  onChange={(e) => setData({ ...data, opportunityNumber: e.target.value })}
                  placeholder="Enter opportunity number"
                  className="h-14 pt-3 pb-3.5 text-base leading-[1.35] print:max-w-[450px] print:break-words"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-start">
                <label className="text-sm font-semibold pt-2 print:pt-0">Address:</label>
                <div className="space-y-2">
                  <Input
                    value={data.address}
                    onChange={(e) => setData({ ...data, address: e.target.value })}
                    placeholder="Enter address or use location button"
                    className="h-14 pt-3 pb-3.5 text-base leading-[1.35] print:max-w-[450px] print:break-words"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getCurrentLocation}
                    className="gap-2"
                    type="button"
                  >
                    <MapPin className="w-4 h-4" />
                    Get Current Location
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Type Filter */}
          <div className="space-y-4" data-pdf-filter>
            <h2 className="text-xl font-semibold border-b-2 border-primary pb-2">
              Product Type Filter
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                <SelectTrigger className="w-full sm:w-[280px]">
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Common">All (Common)</SelectItem>
                  {data.productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {editMode && (
                <div className="flex gap-2 flex-1">
                  <Input
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                    placeholder="New product type"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        addProductType();
                      }
                    }}
                  />
                  <Button onClick={addProductType} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {editMode && (
              <div className="flex flex-wrap gap-2">
                {data.productTypes.map((type) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-sm"
                  >
                    <span>{type}</span>
                    <button
                      onClick={() => deleteProductType(type)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b-2 border-primary pb-2">
              Product List
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse print:table-fixed">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left font-semibold text-sm align-middle print:w-[120px]">Product</th>
                    <th className="border border-border p-3 text-left font-semibold text-sm align-middle print:w-[280px]">Model Name</th>
                    <th className="border border-border p-3 text-left font-semibold text-sm align-middle print:w-[100px]">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product, index) => (
                    <tr key={index}>
                      <td className="border border-border p-3 font-medium text-sm align-middle print:break-words">{product.name}</td>
                      <td className="border border-border p-3 align-middle print:break-words">
                        <Input
                          value={product.modelName}
                          onChange={(e) => {
                            const newProducts = [...data.products];
                            newProducts[index].modelName = e.target.value;
                            setData({ ...data, products: newProducts });
                          }}
                          placeholder="Enter model"
                          className="border-0 focus-visible:ring-0 text-sm h-12 py-2 leading-[1.2]"
                        />
                      </td>
                      <td className="border border-border p-3 align-middle print:break-words">
                        <Input
                          value={product.quantity}
                          onChange={(e) => {
                            const newProducts = [...data.products];
                            newProducts[index].quantity = e.target.value;
                            setData({ ...data, products: newProducts });
                          }}
                          placeholder="Enter quantity"
                          className="border-0 focus-visible:ring-0 text-sm h-12 py-2 leading-[1.2]"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-6">
            {(editMode ? data.categories : getFilteredCategories()).map((category, index) => {
              const originalIndex = editMode ? index : data.categories.findIndex(c => c.id === category.id);
              return (
                <CategorySection
                  key={category.id}
                  category={category}
                  onUpdate={(updated) => updateCategory(originalIndex, updated)}
                  onDelete={() => deleteCategory(originalIndex)}
                  editMode={editMode}
                  productTypes={data.productTypes}
                  selectedFilter={selectedProductType}
                />
              );
            })}

            {editMode && (
              <Button
                variant="outline"
                onClick={addCategory}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            )}
          </div>

          {/* Inspection Date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Inspection Date:</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full md:w-[280px] justify-start text-left font-normal",
                    !data.inspectionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.inspectionDate ? format(data.inspectionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.inspectionDate}
                  onSelect={(date) => setData({ ...data, inspectionDate: date || new Date() })}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Signatures */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Commissioner Signature:</label>
              <SignatureCanvas
                signature={data.commissionerSignature}
                onSave={(signature) => setData({ ...data, commissionerSignature: signature })}
                disabled={!editMode}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Installer Signature:</label>
              <SignatureCanvas
                signature={data.installerSignature}
                onSave={(signature) => setData({ ...data, installerSignature: signature })}
                disabled={!editMode}
              />
            </div>
          </div>
        </div>
        </div>

        {/* Print Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => window.print()}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <Printer className="w-5 h-5" />
            Print
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <PasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onSuccess={() => setEditMode(true)}
      />
      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onOpenChange={setShowChangePasswordDialog}
      />
    </div>
  );
};

export default Index;
