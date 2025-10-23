import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySection } from "@/components/CategorySection";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Category, ReportData } from "@/types/report";
import { Plus, FileDown, CalendarIcon, KeyRound, MapPin, History } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PasswordDialog } from "@/components/PasswordDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { HistoryDialog } from "@/components/HistoryDialog";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "lge-sac-commissioning-report";

const defaultData: ReportData = {
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
        { id: "item-1", text: "Is SVC area secured?", ok: false, ng: false, issue: "", images: [] },
        { id: "item-2", text: "Are all connections tight?", ok: false, ng: false, issue: "", images: [] },
        { id: "item-3", text: "Is drainage properly installed?", ok: false, ng: false, issue: "", images: [] },
      ],
    },
    {
      id: "cat-2",
      name: "Start-up",
      items: [
        { id: "item-4", text: "System pressure check completed?", ok: false, ng: false, issue: "", images: [] },
        { id: "item-5", text: "Refrigerant charge verified?", ok: false, ng: false, issue: "", images: [] },
        { id: "item-6", text: "Test run successful?", ok: false, ng: false, issue: "", images: [] },
      ],
    },
  ],
  inspectionDate: new Date(),
  commissionerSignature: "",
  customerSignature: "",
};

const Index = () => {
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState<ReportData>(defaultData);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Convert inspectionDate string back to Date object
        if (parsedData.inspectionDate) {
          parsedData.inspectionDate = new Date(parsedData.inspectionDate);
        }
        setData(parsedData);
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
    loadOrCreateReport();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    saveToDatabase();
  }, [data]);

  const loadOrCreateReport = async () => {
    try {
      const savedReportId = localStorage.getItem("currentReportId");
      
      if (savedReportId) {
        // Load existing report
        const { data: report, error } = await supabase
          .from("reports")
          .select("*, categories(*, checklist_items(*)), products(*)")
          .eq("id", savedReportId)
          .single();

        if (error) throw error;

        if (report) {
          setCurrentReportId(report.id);
          // Convert DB format to app format
          const loadedData: ReportData = {
            projectName: report.project_name,
            opportunityNumber: report.opportunity_number || "",
            address: report.address || "",
            products: report.products.sort((a, b) => a.sort_order - b.sort_order).map(p => ({
              name: p.name,
              modelName: p.model_name || "",
              quantity: p.quantity || ""
            })),
            categories: report.categories.sort((a, b) => a.sort_order - b.sort_order).map(cat => ({
              id: cat.id,
              name: cat.name,
              items: cat.checklist_items.sort((a, b) => a.sort_order - b.sort_order).map(item => ({
                id: item.id,
                text: item.text,
                ok: item.ok,
                ng: item.ng,
                issue: item.issue || "",
                images: item.images || []
              }))
            })),
            inspectionDate: new Date(report.inspection_date),
            commissionerSignature: report.commissioner_signature || "",
            customerSignature: report.customer_signature || ""
          };
          setData(loadedData);
        }
      }
    } catch (error) {
      console.error("Failed to load report:", error);
    }
  };

  const saveToDatabase = async () => {
    if (!currentReportId) {
      // Create new report
      const { data: newReport, error: reportError } = await supabase
        .from("reports")
        .insert({
          project_name: data.projectName || "Untitled Report",
          opportunity_number: data.opportunityNumber,
          address: data.address,
          inspection_date: data.inspectionDate.toISOString(),
          commissioner_signature: data.commissionerSignature,
          customer_signature: data.customerSignature
        })
        .select()
        .single();

      if (reportError || !newReport) {
        console.error("Failed to create report:", reportError);
        return;
      }

      setCurrentReportId(newReport.id);
      localStorage.setItem("currentReportId", newReport.id);

      // Save products
      if (data.products.length > 0) {
        await supabase.from("products").insert(
          data.products.map((p, idx) => ({
            report_id: newReport.id,
            name: p.name,
            model_name: p.modelName,
            quantity: p.quantity,
            sort_order: idx
          }))
        );
      }

      // Save categories and items
      for (let catIdx = 0; catIdx < data.categories.length; catIdx++) {
        const cat = data.categories[catIdx];
        const { data: newCategory, error: catError } = await supabase
          .from("categories")
          .insert({
            report_id: newReport.id,
            name: cat.name,
            sort_order: catIdx
          })
          .select()
          .single();

        if (!catError && newCategory && cat.items.length > 0) {
          await supabase.from("checklist_items").insert(
            cat.items.map((item, itemIdx) => ({
              category_id: newCategory.id,
              text: item.text,
              ok: item.ok,
              ng: item.ng,
              issue: item.issue,
              images: item.images,
              sort_order: itemIdx
            }))
          );
        }
      }
    } else {
      // Update existing report
      await supabase
        .from("reports")
        .update({
          project_name: data.projectName,
          opportunity_number: data.opportunityNumber,
          address: data.address,
          inspection_date: data.inspectionDate.toISOString(),
          commissioner_signature: data.commissionerSignature,
          customer_signature: data.customerSignature
        })
        .eq("id", currentReportId);

      // Update products
      await supabase.from("products").delete().eq("report_id", currentReportId);
      if (data.products.length > 0) {
        await supabase.from("products").insert(
          data.products.map((p, idx) => ({
            report_id: currentReportId,
            name: p.name,
            model_name: p.modelName,
            quantity: p.quantity,
            sort_order: idx
          }))
        );
      }

      // Sync categories and items
      for (let catIdx = 0; catIdx < data.categories.length; catIdx++) {
        const cat = data.categories[catIdx];
        
        // Check if category exists in DB
        const { data: existingCat } = await supabase
          .from("categories")
          .select("id")
          .eq("id", cat.id)
          .eq("report_id", currentReportId)
          .single();

        let categoryId = cat.id;

        if (!existingCat) {
          // Create new category
          const { data: newCat } = await supabase
            .from("categories")
            .insert({
              report_id: currentReportId,
              name: cat.name,
              sort_order: catIdx
            })
            .select()
            .single();
          
          if (newCat) categoryId = newCat.id;
        } else {
          // Update existing category
          await supabase
            .from("categories")
            .update({ name: cat.name, sort_order: catIdx })
            .eq("id", cat.id);
        }

        // Sync items
        for (let itemIdx = 0; itemIdx < cat.items.length; itemIdx++) {
          const item = cat.items[itemIdx];
          
          const { data: existingItem } = await supabase
            .from("checklist_items")
            .select("id")
            .eq("id", item.id)
            .single();

          if (!existingItem) {
            // Create new item
            await supabase.from("checklist_items").insert({
              category_id: categoryId,
              text: item.text,
              ok: item.ok,
              ng: item.ng,
              issue: item.issue,
              images: item.images,
              sort_order: itemIdx
            });
          } else {
            // Update existing item (triggers will log changes)
            await supabase
              .from("checklist_items")
              .update({
                text: item.text,
                ok: item.ok,
                ng: item.ng,
                issue: item.issue,
                images: item.images,
                sort_order: itemIdx
              })
              .eq("id", item.id);
          }
        }
      }
    }
  };

  const handleEditModeToggle = () => {
    if (!editMode) {
      // Entering edit mode - always ask for password
      setShowPasswordDialog(true);
    } else {
      // Exiting edit mode
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

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    toast.loading("Getting your location...");
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Use reverse geocoding to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setData(prev => ({ ...prev, address: data.display_name }));
            toast.success("Location retrieved successfully!");
          } else {
            setData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
            toast.success("Coordinates retrieved!");
          }
        } catch (error) {
          setData(prev => ({ ...prev, address: `${latitude}, ${longitude}` }));
          toast.success("Coordinates retrieved!");
        }
      },
      (error) => {
        toast.error("Unable to retrieve your location");
        console.error("Geolocation error:", error);
      }
    );
  };

  const generatePDF = async () => {
    try {
      toast.loading("Generating PDF...");
      const element = document.getElementById("pdf-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        windowWidth: 1200,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.85);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const fileName = data.projectName 
        ? `${data.projectName}_Commissioning_Report.pdf`
        : "LGE_SAC_Commissioning_Report.pdf";
      pdf.save(fileName);
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="min-h-screen bg-secondary py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* PDF Content - includes everything */}
        <div id="pdf-content" className="space-y-6">
          {/* Header */}
          <div className="bg-card border-2 border-border rounded-lg shadow-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-3xl font-bold text-primary">
                LGE SAC Commissioning Report
              </h1>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowHistoryDialog(true)}
                  title="View change history"
                >
                  <History className="w-4 h-4" />
                </Button>
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
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-center">
                <label className="text-sm font-semibold">Opportunity number:</label>
                <Input
                  value={data.opportunityNumber}
                  onChange={(e) => setData({ ...data, opportunityNumber: e.target.value })}
                  placeholder="Enter opportunity number"
                  className="h-10"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 items-start">
                <label className="text-sm font-semibold pt-2">Address:</label>
                <div className="space-y-2">
                  <Input
                    value={data.address}
                    onChange={(e) => setData({ ...data, address: e.target.value })}
                    placeholder="Enter address or use location button"
                    className="h-10"
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
                    <th className="border border-border p-2 sm:p-3 text-left font-semibold text-sm">Product</th>
                    <th className="border border-border p-2 sm:p-3 text-left font-semibold text-sm">Model Name</th>
                    <th className="border border-border p-2 sm:p-3 text-left font-semibold text-sm">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product, index) => (
                    <tr key={index}>
                      <td className="border border-border p-2 sm:p-3 font-medium text-sm">{product.name}</td>
                      <td className="border border-border p-2 sm:p-3">
                        <Input
                          value={product.modelName}
                          onChange={(e) => {
                            const newProducts = [...data.products];
                            newProducts[index].modelName = e.target.value;
                            setData({ ...data, products: newProducts });
                          }}
                          placeholder="Enter model"
                          className="border-0 focus-visible:ring-0 text-sm h-8"
                        />
                      </td>
                      <td className="border border-border p-2 sm:p-3">
                        <Input
                          value={product.quantity}
                          onChange={(e) => {
                            const newProducts = [...data.products];
                            newProducts[index].quantity = e.target.value;
                            setData({ ...data, products: newProducts });
                          }}
                          placeholder="Enter quantity"
                          className="border-0 focus-visible:ring-0 text-sm h-8"
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
            {data.categories.map((category, index) => (
              <CategorySection
                key={category.id}
                category={category}
                onUpdate={(updated) => updateCategory(index, updated)}
                onDelete={() => deleteCategory(index)}
                editMode={editMode}
              />
            ))}

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
      <HistoryDialog
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
      />
    </div>
  );
};

export default Index;
