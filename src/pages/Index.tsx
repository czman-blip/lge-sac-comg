import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySection } from "@/components/CategorySection";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Category, ReportData } from "@/types/report";
import { Plus, FileDown, CalendarIcon, KeyRound, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import html2pdf from "html2pdf.js";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PasswordDialog } from "@/components/PasswordDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTemplate } from "@/hooks/useTemplate";
import { runPdfTextVisibilityTest } from "@/lib/pdfVisibilityTest";
const STORAGE_KEY = "lge-sac-commissioning-report";
const LOCAL_DATA_KEY = "lge-sac-local-data";

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
  const [data, setData] = useState<ReportData>(defaultData);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [selectedProductType, setSelectedProductType] = useState<string>("all");
  const [newProductType, setNewProductType] = useState("");
  const { loadTemplate, saveTemplate, isLoading } = useTemplate();

  // Load template from server and merge with local data
  useEffect(() => {
    const initializeData = async () => {
      const template = await loadTemplate();
      
      // Load local inspection data (OK, NG, Issue, Images)
      const localData = localStorage.getItem(LOCAL_DATA_KEY);
      let localInspectionData: any = {};
      
      if (localData) {
        try {
          localInspectionData = JSON.parse(localData);
        } catch (e) {
          console.error("Failed to parse local data:", e);
        }
      }

      // Load project info from old storage for backward compatibility
      const saved = localStorage.getItem(STORAGE_KEY);
      let projectInfo: any = {};
      
      if (saved) {
        try {
          const parsedData = JSON.parse(saved);
          projectInfo = {
            title: parsedData.title || "LGE SAC Commissioning Report",
            projectName: parsedData.projectName || "",
            opportunityNumber: parsedData.opportunityNumber || "",
            address: parsedData.address || "",
            products: parsedData.products || defaultData.products,
            inspectionDate: parsedData.inspectionDate ? new Date(parsedData.inspectionDate) : new Date(),
            commissionerSignature: parsedData.commissionerSignature || "",
            installerSignature: parsedData.installerSignature || "",
            customerSignature: parsedData.customerSignature || "",
            productTypes: parsedData.productTypes || ["Multi V", "AHU", "ISC", "Water", "H/Kit"],
          };
        } catch (e) {
          console.error("Failed to load saved data:", e);
        }
      }

      // Merge template with local inspection data
      const mergedCategories = (template.length > 0 ? template : defaultData.categories).map(category => ({
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
      });
    };

    initializeData();
  }, []);

  // Save all data to localStorage for backward compatibility
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Save local inspection data separately
    const localInspectionData: any = {};
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
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(localInspectionData));
  }, [data]);

  const handleEditModeToggle = () => {
    if (!editMode) {
      // Entering edit mode - always ask for password
      setShowPasswordDialog(true);
    } else {
      // Exiting edit mode - save template to server
      saveTemplate(data.categories);
      setEditMode(false);
    }
  };

  const addCategory = () => {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name: "New Category",
      items: [],
    };
    setData({ ...data, categories: [...data.categories, newCategory] });
  };

  const updateCategory = (index: number, category: Category) => {
    const newCategories = [...data.categories];
    newCategories[index] = category;
    setData({ ...data, categories: newCategories });
  };

  const deleteCategory = (index: number) => {
    const newCategories = data.categories.filter((_, i) => i !== index);
    setData({ ...data, categories: newCategories });
  };

  const addProductType = () => {
    if (newProductType.trim() && !data.productTypes.includes(newProductType.trim())) {
      setData({ ...data, productTypes: [...data.productTypes, newProductType.trim()] });
      setNewProductType("");
      toast.success("Product type added");
    }
  };

  const deleteProductType = (type: string) => {
    const newProductTypes = data.productTypes.filter(t => t !== type);
    setData({ ...data, productTypes: newProductTypes });
    toast.success("Product type deleted");
  };

  const getFilteredCategories = () => {
    if (selectedProductType === "all") {
      return data.categories;
    }
    
    return data.categories.map(category => ({
      ...category,
      items: category.items.filter(item => 
        item.productType === "Common" || item.productType === selectedProductType
      )
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

  const generatePDF = async () => {
    const loadingToast = toast.loading("Generating PDF...");
    // Keep all existing features, only rebuild the PDF pipeline for robust text rendering
    let hiddenContainer: HTMLDivElement | null = null;
    let styleEl: HTMLStyleElement | null = null;
    try {
      const element = document.getElementById("pdf-content");
      if (!element) {
        toast.dismiss(loadingToast);
        return;
      }

      const anyDoc = document as any;
      if (anyDoc.fonts && anyDoc.fonts.ready) {
        try { await anyDoc.fonts.ready; } catch {}
      }

      // Create a deep clone so we can safely normalize form controls for PDF
      const snapshot = element.cloneNode(true) as HTMLElement;
      snapshot.classList.add("pdf-snapshot");

      // Sync live values from the original DOM into the snapshot before replacement
      const origInputs = element.querySelectorAll<HTMLInputElement>("input");
      const cloneInputs = snapshot.querySelectorAll<HTMLInputElement>("input");
      origInputs.forEach((orig, i) => {
        const c = cloneInputs[i];
        if (c) {
          c.value = orig.value;
          if (!c.getAttribute("value")) c.setAttribute("value", orig.value);
        }
      });

      const origTextareas = element.querySelectorAll<HTMLTextAreaElement>("textarea");
      const cloneTextareas = snapshot.querySelectorAll<HTMLTextAreaElement>("textarea");
      origTextareas.forEach((orig, i) => {
        const c = cloneTextareas[i];
        if (c) {
          c.value = orig.value;
          c.textContent = orig.value;
        }
      });

      // Replace inputs and textareas with static blocks to avoid html2canvas text clipping
      snapshot.querySelectorAll("input").forEach((el) => {
        const input = el as HTMLInputElement;
        const display = document.createElement("div");
        display.textContent = input.value || input.getAttribute("value") || "";
        display.style.minHeight = "40px";
        display.style.border = "1px solid hsl(var(--input))";
        display.style.borderRadius = "var(--radius)";
        display.style.padding = "6px 12px 10px"; // pt 6px, pb 10px
        display.style.lineHeight = "1.5";
        display.style.whiteSpace = "pre-wrap";
        display.style.background = "#ffffff";
        display.style.transform = "translateY(-1px)"; // nudge up for font baseline alignment
        input.replaceWith(display);
      });

      snapshot.querySelectorAll("textarea").forEach((el) => {
        const ta = el as HTMLTextAreaElement;
        const display = document.createElement("div");
        display.textContent = ta.value || ta.textContent || "";
        display.style.minHeight = "40px";
        display.style.border = "1px solid hsl(var(--input))";
        display.style.borderRadius = "var(--radius)";
        display.style.padding = "6px 12px 10px";
        display.style.lineHeight = "1.5";
        display.style.whiteSpace = "pre-wrap";
        display.style.background = "#ffffff";
        display.style.transform = "translateY(-1px)";
        ta.replaceWith(display);
      });

      // Replace select triggers (Radix) with static labels
      snapshot.querySelectorAll('button[aria-haspopup="listbox"]').forEach((btn) => {
        const valueSpan = btn.querySelector("span");
        const display = document.createElement("div");
        display.textContent = valueSpan?.textContent || "";
        display.style.minHeight = "40px";
        display.style.border = "1px solid hsl(var(--input))";
        display.style.borderRadius = "var(--radius)";
        display.style.padding = "6px 12px 10px";
        display.style.lineHeight = "1.5";
        display.style.whiteSpace = "nowrap";
        display.style.overflow = "hidden";
        display.style.textOverflow = "ellipsis";
        display.style.background = "#ffffff";
        display.style.transform = "translateY(-1px)";
        (btn as HTMLElement).replaceWith(display);
      });

      // Add a hidden off-screen container to render the snapshot
      hiddenContainer = document.createElement("div");
      hiddenContainer.style.position = "fixed";
      hiddenContainer.style.left = "-10000px";
      hiddenContainer.style.top = "0";
      hiddenContainer.style.width = element.getBoundingClientRect().width + "px";
      hiddenContainer.style.background = "#ffffff";
      hiddenContainer.appendChild(snapshot);
      document.body.appendChild(hiddenContainer);

      // Temporary CSS to help avoid breaks and enforce line-height during rasterization
      styleEl = document.createElement("style");
      styleEl.textContent = `
        .pdf-snapshot .avoid-break { break-inside: avoid; page-break-inside: avoid; }
        .pdf-snapshot * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `;
      document.head.appendChild(styleEl);

      const fileName = data.projectName 
        ? `${data.projectName}_Commissioning_Report.pdf`
        : "LGE_SAC_Commissioning_Report.pdf";

      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollY: 0,
          letterRendering: true,
          windowWidth: Math.max(document.documentElement.scrollWidth, element.scrollWidth),
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: 'pt',
          format: 'a4',
          orientation: 'portrait' as const,
          compress: true,
        },
        pagebreak: { mode: ['css', 'legacy'] as const, avoid: ['.avoid-break', 'tr', 'img'] },
      };

      await html2pdf().set(opt).from(snapshot).save();

      // Run visibility test on the snapshot used for export
      const result = runPdfTextVisibilityTest(snapshot);
      if (!result.pass) {
        console.warn("PDF text visibility issues detected:", result.issues);
        toast.warning(`PDF text visibility issues: ${result.issues.length}. See console for details.`);
      }

      toast.dismiss(loadingToast);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF");
    } finally {
      if (styleEl && styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      if (hiddenContainer && hiddenContainer.parentNode) hiddenContainer.parentNode.removeChild(hiddenContainer);
    }
  };

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
                  <Button
                    variant={editMode ? "default" : "outline"}
                    onClick={handleEditModeToggle}
                    className="flex-1 sm:flex-none"
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
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label className="text-sm font-semibold whitespace-nowrap">Product Type Filter:</label>
                  <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                    <SelectTrigger className="w-full sm:w-[200px] h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {data.productTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editMode && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Manage Product Types:</label>
                    <div className="flex flex-wrap gap-2">
                      {data.productTypes.map(type => (
                        <div key={type} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-md">
                          <span className="text-sm">{type}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0"
                            onClick={() => deleteProductType(type)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={newProductType}
                        onChange={(e) => setNewProductType(e.target.value)}
                        placeholder="Add new product type"
                        className="h-10"
                        onKeyPress={(e) => e.key === 'Enter' && addProductType()}
                      />
                      <Button onClick={addProductType} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                  </div>
                )}
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
                <label className="text-sm font-semibold">Project name:</label>
                <Input
                  value={data.projectName}
                  onChange={(e) => setData({ ...data, projectName: e.target.value })}
                  placeholder="Enter project name"
                  className="h-14 pt-3 pb-3.5 text-base leading-[1.35]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-center">
                <label className="text-sm font-semibold">Opportunity number:</label>
                <Input
                  value={data.opportunityNumber}
                  onChange={(e) => setData({ ...data, opportunityNumber: e.target.value })}
                  placeholder="Enter opportunity number"
                  className="h-14 pt-3 pb-3.5 text-base leading-[1.35]"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-start">
                <label className="text-sm font-semibold pt-2">Address:</label>
                <div className="space-y-2">
                  <Input
                    value={data.address}
                    onChange={(e) => setData({ ...data, address: e.target.value })}
                    placeholder="Enter address or use location button"
                    className="h-14 pt-3 pb-3.5 text-base leading-[1.35]"
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

          {/* Product List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b-2 border-primary pb-2">
              Product List
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left font-semibold text-sm align-middle">Product</th>
                    <th className="border border-border p-3 text-left font-semibold text-sm align-middle">Model Name</th>
                    <th className="border border-border p-3 text-left font-semibold text-sm align-middle">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product, index) => (
                    <tr key={index}>
                      <td className="border border-border p-3 font-medium text-sm align-middle">{product.name}</td>
                      <td className="border border-border p-3 align-middle">
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
                      <td className="border border-border p-3 align-middle">
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
            {getFilteredCategories().map((category, index) => {
              const originalIndex = data.categories.findIndex(c => c.id === category.id);
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
            
            <div className="space-y-2">
              <label className="text-sm font-semibold">Customer Signature:</label>
              <SignatureCanvas
                signature={data.customerSignature}
                onSave={(signature) => setData({ ...data, customerSignature: signature })}
                disabled={!editMode}
              />
            </div>
          </div>
        </div>
        </div>

        {/* PDF Button */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={generatePDF}
            size="lg"
            className="gap-2"
          >
            <FileDown className="w-5 h-5" />
            Generate PDF
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
