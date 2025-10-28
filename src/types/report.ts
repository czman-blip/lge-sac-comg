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
  productType: string;
  referenceImages?: string[];
}

export interface Category {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface ReportData {
  title: string;
  projectName: string;
  opportunityNumber: string;
  address: string;
  products: Product[];
  categories: Category[];
  inspectionDate: Date;
  commissionerSignature: string;
  installerSignature: string;
  customerSignature: string;
  productTypes: string[];
}
