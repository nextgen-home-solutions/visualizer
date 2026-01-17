export type ProductItem = {
  sku: string;
  name: string;
  brand: string;
  price: number;
  unit: "each" | "sqft" | "gallon";
  image: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  items: ProductItem[];
};

export type ProductCatalog = {
  categories: ProductCategory[];
};

export type SelectedProduct = ProductItem & { qty: number };
