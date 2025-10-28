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
    // Only rebuild the PDF pipeline for robust text rendering; keep all other features intact
    let hiddenContainer: HTMLDivElement | null = null;
    let styleEl: HTMLStyleElement | null = null;
    // Track elements we tag so we can clean them after
    const tagged: HTMLElement[] = [];

    try {
      const element = document.getElementById("pdf-content");
      if (!element) {
        toast.dismiss(loadingToast);
        return;
      }

      // Ensure fonts are fully loaded before rasterization
      const anyDoc = document as any;
      if (anyDoc.fonts && anyDoc.fonts.ready) {
        try { await anyDoc.fonts.ready; } catch {}
      }

      // Tag originals with stable ids so we can map clone -> original
      let idCounter = 0;
      element.querySelectorAll<HTMLElement>('input, textarea, button[aria-haspopup="listbox"]').forEach((el) => {
        idCounter += 1;
        el.setAttribute('data-pdf-id', String(idCounter));
        tagged.push(el);
      });

      // Deep clone and normalize inside the clone using the original metrics
      const snapshot = element.cloneNode(true) as HTMLElement;
      snapshot.classList.add("pdf-snapshot");

      const getOriginal = (id: string) => element.querySelector<HTMLElement>(`[data-pdf-id="${id}"]`)!;

      snapshot.querySelectorAll<HTMLElement>('[data-pdf-id]').forEach((cloneEl) => {
        const id = cloneEl.getAttribute('data-pdf-id')!;
        const origEl = getOriginal(id);
        const cs = getComputedStyle(origEl);
        const rect = origEl.getBoundingClientRect();

        // Compute robust text metrics
        const fontSize = parseFloat(cs.fontSize || '16');
        const lineH = cs.lineHeight === 'normal' ? Math.round(fontSize * 1.5) : Math.round(parseFloat(cs.lineHeight || String(fontSize * 1.5)));
        const pt = parseFloat(cs.paddingTop || '0');
        const pb = parseFloat(cs.paddingBottom || '0');
        const pl = parseFloat(cs.paddingLeft || '0');
        const pr = parseFloat(cs.paddingRight || '0');
        const bt = parseFloat(cs.borderTopWidth || '0');
        const bb = parseFloat(cs.borderBottomWidth || '0');
        const bl = parseFloat(cs.borderLeftWidth || '0');
        const br = parseFloat(cs.borderRightWidth || '0');

        // Build static display box to prevent input/select baseline clipping
        const box = document.createElement('div');
        box.style.boxSizing = 'border-box';
        box.style.height = `${Math.ceil(rect.height)}px`;
        box.style.width = `${Math.ceil(rect.width)}px`;
        box.style.borderStyle = 'solid';
        box.style.borderWidth = `${bt}px ${br}px ${bb}px ${bl}px`;
        box.style.borderColor = cs.borderColor || 'hsl(var(--input))';
        box.style.borderRadius = cs.borderRadius || 'var(--radius)';
        // Bias padding slightly to the bottom to avoid visual clipping
        const adjTop = Math.max(0, pt - 1);
        const adjBottom = pb + 2;
        box.style.paddingTop = `${adjTop}px`;
        box.style.paddingBottom = `${adjBottom}px`;
        box.style.paddingLeft = `${pl}px`;
        box.style.paddingRight = `${pr}px`;
        box.style.background = cs.backgroundColor || '#ffffff';
        box.style.color = cs.color || '#000';
        box.style.fontFamily = cs.fontFamily;
        box.style.fontSize = cs.fontSize;
        box.style.fontWeight = cs.fontWeight;
        box.style.letterSpacing = cs.letterSpacing;
        box.style.lineHeight = `${lineH}px`;
        box.style.transform = 'translateY(-1px)';
        box.style.display = 'block';

        const isTextarea = origEl.tagName === 'TEXTAREA';
        const isInput = origEl.tagName === 'INPUT';
        const isSelectTrigger = origEl.matches('button[aria-haspopup="listbox"]');

        // Skip select triggers here; we'll handle them separately (filter as text, others removed)
        if (isSelectTrigger) {
          return;
        }

        let text = '';
        if (isInput) {
          const input = origEl as HTMLInputElement;
          text = input.value ?? input.getAttribute('value') ?? '';
        } else if (isTextarea) {
          const ta = origEl as HTMLTextAreaElement;
          text = ta.value ?? ta.textContent ?? '';
        }

        box.textContent = text;
        if (isTextarea) {
          box.style.whiteSpace = 'pre-wrap';
          box.style.overflow = 'visible';
        } else {
          box.style.whiteSpace = 'nowrap';
          box.style.overflow = 'hidden';
          box.style.textOverflow = 'ellipsis';
        }

        cloneEl.replaceWith(box);
      });

      // Render Product Type Filter value as plain text and remove all comboboxes
      const selectedFilterText = selectedProductType === 'all' ? 'All Products' : selectedProductType;
      const filterLabel = Array.from(snapshot.querySelectorAll('label')).find((l) => ((l.textContent || '').trim().startsWith('Product Type Filter')));
      if (filterLabel && filterLabel.parentElement) {
        const filterContainer = filterLabel.parentElement;
        filterContainer.querySelectorAll('button[aria-haspopup="listbox"]').forEach((btn) => btn.remove());
        const span = document.createElement('span');
        span.textContent = ' ' + selectedFilterText;
        span.style.display = 'inline-block';
        span.style.marginLeft = '6px';
        span.style.lineHeight = '1.5';
        span.style.transform = 'translateY(-1px)';
        filterLabel.insertAdjacentElement('afterend', span);
      }
      // Remove all remaining select triggers across the document
      snapshot.querySelectorAll('button[aria-haspopup="listbox"]').forEach((btn) => (btn as HTMLElement).remove());

      // Add a hidden off-screen container to render the snapshot
      hiddenContainer = document.createElement("div");
      hiddenContainer.style.position = "fixed";
      hiddenContainer.style.left = "-10000px";
      hiddenContainer.style.top = "0";
      hiddenContainer.style.width = element.getBoundingClientRect().width + "px";
      hiddenContainer.style.background = "#ffffff";
      hiddenContainer.appendChild(snapshot);
      document.body.appendChild(hiddenContainer);

      // Temporary CSS to help avoid breaks and enforce color accuracy during rasterization
      styleEl = document.createElement("style");
      styleEl.textContent = `
        .pdf-snapshot .avoid-break { break-inside: avoid; page-break-inside: avoid; }
        .pdf-snapshot * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      `;
      document.head.appendChild(styleEl);

      const fileName = data.projectName 
        ? `${data.projectName}_Commissioning_Report.pdf`
        : "LGE_SAC_Commissioning_Report.pdf";

      const scale = Math.max(2, Math.min(3, (window.devicePixelRatio || 2)));
      const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale,
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
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const, avoid: ['.avoid-break', 'tr', 'img'] },
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
      // Clean up added attributes on live DOM
      tagged.forEach((el) => el.removeAttribute('data-pdf-id'));
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
