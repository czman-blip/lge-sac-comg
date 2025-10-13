import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CategorySection } from "@/components/CategorySection";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { Category, ReportData } from "@/types/report";
import { Plus, FileDown, Download } from "lucide-react";
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
  commissionerSignature: "",
  customerSignature: "",
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

  const downloadHTML = () => {
    try {
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LGE SAC Commissioning Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #A50034; font-size: 32px; margin-bottom: 30px; border-bottom: 3px solid #A50034; padding-bottom: 15px; }
    h2 { color: #333; font-size: 20px; margin: 30px 0 15px; border-bottom: 2px solid #A50034; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #f5f5f5; font-weight: bold; }
    .checklist-item { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 6px; background: #fafafa; }
    .checklist-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .checklist-text { font-weight: 500; flex: 1; }
    .checkbox-group { display: flex; gap: 20px; }
    .checkbox-label { display: flex; align-items: center; gap: 5px; }
    .issue-section { margin-top: 10px; }
    .issue-label { font-weight: 500; margin-bottom: 5px; }
    .issue-text { padding: 8px; background: white; border: 1px solid #ddd; border-radius: 4px; }
    .images { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-top: 10px; }
    .images img { width: 100%; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
    .signature-box { border: 2px solid #ddd; padding: 10px; border-radius: 6px; }
    .signature-label { font-weight: bold; margin-bottom: 10px; }
    .signature-img { width: 100%; height: 120px; border: 1px solid #ddd; background: white; }
    .date-section { margin: 20px 0; }
    .date-label { font-weight: bold; }
    @media print { body { background: white; padding: 0; } .container { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>LGE SAC Commissioning Report</h1>
    
    <h2>Product List</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Model Name</th>
          <th>Quantity</th>
        </tr>
      </thead>
      <tbody>
        ${data.products.map(p => `
          <tr>
            <td>${p.name}</td>
            <td>${p.modelName || '-'}</td>
            <td>${p.quantity || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${data.categories.map(cat => `
      <h2>${cat.name}</h2>
      ${cat.items.map(item => `
        <div class="checklist-item">
          <div class="checklist-header">
            <div class="checklist-text">${item.text}</div>
            <div class="checkbox-group">
              <div class="checkbox-label">
                <span>OK</span>
                <input type="checkbox" ${item.ok ? 'checked' : ''} disabled>
              </div>
              <div class="checkbox-label">
                <span>NG</span>
                <input type="checkbox" ${item.ng ? 'checked' : ''} disabled>
              </div>
            </div>
          </div>
          ${item.issue ? `
            <div class="issue-section">
              <div class="issue-label">Issue:</div>
              <div class="issue-text">${item.issue}</div>
            </div>
          ` : ''}
          ${item.images.length > 0 ? `
            <div class="images">
              ${item.images.map(img => `<img src="${img}" alt="Issue photo">`).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    `).join('')}

    <div class="date-section">
      <span class="date-label">Inspection Date:</span> ${data.inspectionDate}
    </div>

    <div class="signatures">
      <div class="signature-box">
        <div class="signature-label">Commissioner Signature:</div>
        ${data.commissionerSignature ? `<img src="${data.commissionerSignature}" alt="Commissioner signature" class="signature-img">` : '<div class="signature-img"></div>'}
      </div>
      <div class="signature-box">
        <div class="signature-label">Customer Signature:</div>
        ${data.customerSignature ? `<img src="${data.customerSignature}" alt="Customer signature" class="signature-img">` : '<div class="signature-img"></div>'}
      </div>
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LGE_SAC_Commissioning_Report.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("HTML file downloaded successfully!");
    } catch (error) {
      console.error("HTML download failed:", error);
      toast.error("Failed to download HTML");
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

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center gap-4">
          <Button
            onClick={downloadHTML}
            size="lg"
            className="gap-2"
            variant="outline"
          >
            <Download className="w-5 h-5" />
            Download HTML
          </Button>
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
