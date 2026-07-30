export type CartRefType = "item" | "protocol";
export type CartStatus = "active" | "converted" | "abandoned";

export interface CartLine {
  refType: CartRefType;
  refId: string;
  slug: string;
  name: string;
  quantity: number;
  unitPrice: number; // snapshot p/ exibição — o valor cobrado é recalculado no checkout
  isUpsell: boolean;
  imageUrl: string;
}

export interface Cart {
  hash: string; // âncora estável (métrica de abandono / associação)
  status: CartStatus;
  score: number | null;
  lines: CartLine[];
  subtotal: number; // soma p/ o usuário entender; NÃO é o valor de cobrança
}
