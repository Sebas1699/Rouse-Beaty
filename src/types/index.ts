export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  addressDetails: string;
  paymentHolder: string;
  paymentBrand: string;
  paymentLast4: string;
  paymentExpirationMonth: number | null;
  paymentExpirationYear: number | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  category: string;
  color: string;
  image?: string;
  stock: number;
  originalPrice?: number;
  isActive?: boolean;
}

export interface Address {
  id: string;
  recipient: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expirationMonth: number;
  expirationYear: number;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  deliveryAddress: string;
  paymentNote: string;
}

export interface AdminOrder extends Order {
  customerName: string;
  customerEmail: string;
}

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}
