import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // product id
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  agaveType?: string;
  volume?: string;
  alcoholContent?: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        if (quantity < 1) return;
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id);
          if (existingItem) {
            const newQuantity = existingItem.quantity + quantity;
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: newQuantity } : i
              ),
              isOpen: true,
            };
          }
          return {
            items: [...state.items, { ...item, quantity }],
            isOpen: true,
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },
    }),
    {
      name: 'cart-storage',
      version: 3,
      migrate: (persistedState: any, version: number) => {
        if (!persistedState) return { items: [], isOpen: false };
        if (version < 3) {
          // Limpiar carrito antiguo con estructura de botellas
          const legacyItems = persistedState.items || [];
          const migratedItems = legacyItems.map((item: any) => {
            // Extraer productId de la clave combinada si existe
            const productId = item.productId || (item.id?.includes('::') ? item.id.split('::')[0] : item.id);
            return {
              id: productId,
              productId: productId,
              name: item.name,
              price: item.basePrice ?? item.price ?? 0,
              image: item.image,
              quantity: item.quantity ?? 1,
              agaveType: item.agaveType,
              volume: item.volume,
              alcoholContent: item.alcoholContent
            };
          });
          return { ...persistedState, items: migratedItems };
        }
        return persistedState;
      }
    }
  )
);

export default useCartStore;
