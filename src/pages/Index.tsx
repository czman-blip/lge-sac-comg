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
      id: "cat-1",
      name: "Installation",
      items: [
        { id: "item-1", text: "Is SVC area secured?", ok: false, ng: false, issue: "", images: [], productType: "Common" },
        { id: "item-2", text: "Are all connections tight?", ok: false, ng: false, issue: "", images: [], productType: "Common" },
        { id: "item-3", text: "Is drainage properly installed?", ok: false, ng: false, issue: "", images: [], productType: "Common" },
      ],
    },
    {
      id: "cat-2",
      name: "Start-up",
      items: [
        { id: "item-4", text: "System pressure check completed?", ok: false, ng: false, issue: "", images: [], productType: "Common" },
        { id: "item-5", text: "Refrigerant charge verified?", ok: false, ng: false, issue: "", images: [], productType: "Common" },
        { id: "item-6", text: "Test run successful?", ok: false, ng: false, issue: "", images: [], productType: "Common" },
      ],
    },
  ],
  inspectionDate: new Date(),
  commissionerSignature: "",
  installerSignature: "",
  customerSignature: "",
  productTypes: ["Multi V", "AHU", "ISC", "Water", "H/Kit"],
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      // Save main data
      safeLocalStorageSave(STORAGE_KEY, data);
      
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
