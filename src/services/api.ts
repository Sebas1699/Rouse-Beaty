import type {
  AdminOrder,
  CustomerAccount,
  Order,
  OrderStatus,
  Product,
  User,
  UserProfile,
} from "@/types";

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");

  const response = await fetch(input, { ...init, headers });

  if (!response.ok) {
    let message = `La petición falló (${response.status} ${response.statusText}).`;
    if (response.headers.get("content-type")?.includes("application/json")) {
      const body: unknown = await response.json();
      if (
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
      ) {
        message = body.message;
      }
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export type ProfileUpdate =
  | { section: "personal"; firstName: string; lastName: string }
  | { section: "address"; address: string; addressDetails: string }
  | {
      section: "payment";
      paymentHolder: string;
      paymentBrand: string;
      paymentLast4: string;
      paymentExpirationMonth: number;
      paymentExpirationYear: number;
    };

export function getProfile() {
  return apiFetch<{ profile: UserProfile }>("/api/profile", {
    cache: "no-store",
  });
}

export function saveProfile(update: ProfileUpdate) {
  return apiFetch<{ profile: UserProfile; user: User }>("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  originalPrice: number | null;
  category: string;
  color: string;
  stock: number;
}

export function saveProduct(input: ProductInput, id?: string) {
  return apiFetch<{ product: Product }>(
    id ? `/api/products/${encodeURIComponent(id)}` : "/api/products",
    {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export function setProductActive(id: string, isActive: boolean, product: ProductInput) {
  return apiFetch<{ product: Product }>(
    `/api/products/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, isActive }),
    },
  );
}

export function deleteProduct(id: string) {
  return apiFetch<{ ok: boolean }>(
    `/api/products/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function createOrder(input: {
  items: Array<{ productId: string; quantity: number }>;
  deliveryAddress: string;
}) {
  return apiFetch<{ order: Order }>("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getAdminOrders() {
  return apiFetch<{ orders: AdminOrder[] }>("/api/admin/orders", {
    cache: "no-store",
  });
}

export function updateOrderStatus(id: string, status: OrderStatus) {
  return apiFetch<{ status: OrderStatus }>(
    `/api/admin/orders/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
}

export function getAdminCustomers() {
  return apiFetch<{ customers: CustomerAccount[] }>("/api/admin/customers", {
    cache: "no-store",
  });
}

export function setCustomerActive(id: string, isActive: boolean) {
  return apiFetch<{ customer: CustomerAccount }>(
    `/api/admin/customers/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    },
  );
}
