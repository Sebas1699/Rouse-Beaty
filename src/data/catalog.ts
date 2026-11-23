export interface CatalogGroup {
  title: string;
  category?: string;
  discountedOnly?: boolean;
}

export interface CatalogPage {
  title: string;
  description: string;
  groups: CatalogGroup[];
}

export const catalogPages: Record<string, CatalogPage> = {
  "cuidado-facial": {
    title: "Cuidado facial",
    description: "Encuentra productos para crear una rutina a tu medida.",
    groups: [
      { title: "Rutinas faciales", category: "Rutinas faciales" },
      { title: "Hidratación", category: "Hidratación" },
    ],
  },
  "rutinas-faciales": {
    title: "Rutinas faciales",
    description: "Productos para limpiar y cuidar tu piel todos los días.",
    groups: [{ title: "Rutinas faciales", category: "Rutinas faciales" }],
  },
  hidratacion: {
    title: "Hidratación",
    description: "Opciones para mantener tu piel hidratada y protegida.",
    groups: [{ title: "Hidratación", category: "Hidratación" }],
  },
  maquillaje: {
    title: "Maquillaje",
    description: "Explora productos para rostro, ojos y labios.",
    groups: [
      { title: "Rostro", category: "Rostro" },
      { title: "Ojos", category: "Ojos" },
      { title: "Labios", category: "Labios" },
    ],
  },
  rostro: {
    title: "Maquillaje para rostro",
    description: "Bases, rubores y productos para crear tu look.",
    groups: [{ title: "Rostro", category: "Rostro" }],
  },
  ojos: {
    title: "Maquillaje para ojos",
    description: "Productos para definir y resaltar tu mirada.",
    groups: [{ title: "Ojos", category: "Ojos" }],
  },
  labios: {
    title: "Maquillaje para labios",
    description: "Color y brillo para completar tu maquillaje.",
    groups: [{ title: "Labios", category: "Labios" }],
  },
  "cuidado-corporal": {
    title: "Cuidado corporal",
    description: "Complementa tu rutina de bienestar y cuidado personal.",
    groups: [{ title: "Cuidado corporal", category: "Cuidado corporal" }],
  },
  descuentos: {
    title: "Descuentos",
    description: "Descubre productos seleccionados con precio especial.",
    groups: [{ title: "Productos en oferta", discountedOnly: true }],
  },
};

export const catalogLinks = [
  { href: "/catalogo/cuidado-facial", label: "Cuidado facial" },
  { href: "/catalogo/rutinas-faciales", label: "Rutinas faciales" },
  { href: "/catalogo/hidratacion", label: "Hidratación" },
  { href: "/catalogo/maquillaje", label: "Todo maquillaje" },
  { href: "/catalogo/rostro", label: "Rostro" },
  { href: "/catalogo/ojos", label: "Ojos" },
  { href: "/catalogo/labios", label: "Labios" },
  { href: "/catalogo/cuidado-corporal", label: "Cuidado corporal" },
  { href: "/catalogo/descuentos", label: "Descuentos" },
];
