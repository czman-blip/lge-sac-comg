import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySection } from "@/components/CategorySection";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Category, ReportData } from "@/types/report";
import { Plus, FileDown } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  inspectionDate: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }),
  signature: "",
};

const Index = () => {
  const [editMode, setEditMode] = useState(false);
  const [data, setData] = useState<ReportData>(defaultData);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

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
      const element = document.getElementById("report-content");
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save("LGE_SAC_Commissioning_Report.pdf");
      toast.success("PDF generated successfully!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="min-h-screen bg-secondary py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-card border-2 border-border rounded-lg shadow-lg mb-6 p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-primary">
              LGE SAC Commissioning Report
            </h1>
            <Button
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Edit mode" : "User mode"}
            </Button>
          </div>
        </div>

        {/* Main Report Content */}
        <div id="report-content" className="bg-card border-2 border-border rounded-lg shadow-lg p-8 space-y-8">
          {/* Product List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold border-b-2 border-primary pb-2">
              Product List
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border p-3 text-left font-semibold">Product</th>
                    <th className="border border-border p-3 text-left font-semibold">Model Name</th>
                    <th className="border border-border p-3 text-left font-semibold">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {data.products.map((product, index) => (
                    <tr key={index}>
                      <td className="border border-border p-3 font-medium">{product.name}</td>
                      <td className="border border-border p-3">
                        <Input
                          value={product.modelName}
                          onChange={(e) => {
                            const newProducts = [...data.products];
                            newProducts[index].modelName = e.target.value;
                            setData({ ...data, products: newProducts });
                          }}
                          placeholder="Enter model"
                          className="border-0 focus-visible:ring-0"
                        />
                      </td>
                      <td className="border border-border p-3">
                        <Input
                          value={product.quantity}
                          onChange={(e) => {
                            const newProducts = [...data.products];
                            newProducts[index].quantity = e.target.value;
                            setData({ ...data, products: newProducts });
                          }}
                          placeholder="Enter quantity"
                          className="border-0 focus-visible:ring-0"
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
            <Input
              type="text"
              value={data.inspectionDate}
              onChange={(e) => setData({ ...data, inspectionDate: e.target.value })}
              className="max-w-xs"
            />
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Signature:</label>
            <SignatureCanvas
              signature={data.signature}
              onSave={(signature) => setData({ ...data, signature })}
              disabled={!editMode}
            />
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
    </div>
  );
};

export default Index;
