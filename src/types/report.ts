export interface Product {
  name: string;
  modelName: string;
  quantity: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  ok: boolean;
  ng: boolean;
  issue: string;
  images: string[];
}

export interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface ReportData {
  products: Product[];
  categories: Category[];
  inspectionDate: Date;
  commissionerSignature: string;
  customerSignature: string;
}
