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
  projectName: string;
  opportunityNumber: string;
  address: string;
  products: Product[];
  categories: Category[];
  inspectionDate: Date;
  commissionerSignature: string;
  customerSignature: string;
}
