import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySection } from "@/components/CategorySection";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Category, ReportData } from "@/types/report";
import { Plus, FileDown, CalendarIcon, KeyRound, FileCode } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PasswordDialog } from "@/components/PasswordDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";

const STORAGE_KEY = "lge-sac-commissioning-report";

const defaultData: ReportData = {
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
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

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

      pdf.save("LGE_SAC_Commissioning_Report.pdf");
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const exportHTML = () => {
    try {
      // Clone the entire document
      const docClone = document.documentElement.cloneNode(true) as HTMLElement;
      
      // Remove edit/user mode buttons and password change button
      const buttons = docClone.querySelectorAll('button');
      buttons.forEach(button => {
        const text = button.textContent;
        if (text?.includes('Edit mode') || text?.includes('User mode')) {
          button.remove();
        }
        // Remove password change button by checking for KeyRound icon
        const keyIcon = button.querySelector('svg');
        if (keyIcon?.querySelector('path[d*="m15.5"]')) {
          button.remove();
        }
      });

      // Remove password dialogs
      const dialogs = docClone.querySelectorAll('[role="dialog"]');
      dialogs.forEach(dialog => dialog.remove());

      // Get the current origin for base href
      const baseUrl = window.location.origin;

      // Serialize the current report data
      const reportDataScript = `
        <script>
          // Restore report data
          window.__REPORT_DATA__ = ${JSON.stringify(data)};
          
          // Initialize after DOM is loaded
          document.addEventListener('DOMContentLoaded', function() {
            console.log('Report loaded with data:', window.__REPORT_DATA__);
          });
        </script>
      `;

      // Get all inline styles from head
      const headContent = docClone.querySelector('head')?.innerHTML || '';
      
      // Create the complete HTML
      let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <base href="${baseUrl}/">
  ${headContent}
  ${reportDataScript}
</head>
<body>
  ${docClone.querySelector('body')?.innerHTML || ''}
</body>
</html>`;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LGE_SAC_Commissioning_Report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("HTML exported successfully!");
    } catch (error) {
      console.error("HTML export failed:", error);
      toast.error("Failed to export HTML");
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

        {/* Export Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <Button
            onClick={generatePDF}
            size="lg"
            className="gap-2"
          >
            <FileDown className="w-5 h-5" />
            Generate PDF
          </Button>
          <Button
            onClick={exportHTML}
            size="lg"
            variant="outline"
            className="gap-2"
          >
            <FileCode className="w-5 h-5" />
            Export HTML
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
