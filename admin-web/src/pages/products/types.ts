export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface Branch {
  id: string;
  categoryId: string;
  name: string;
  image: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface Product {
  id: string;
  branchId: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  isAvailable: boolean;
  options: ProductOption[];
}
