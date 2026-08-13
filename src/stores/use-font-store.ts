import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontOption =
  | 'inter'
  | 'roboto'
  | 'poppins'
  | 'lato'
  | 'montserrat'
  | 'open-sans'
  | 'source-sans-pro'
  | 'nunito'
  | 'raleway'
  | 'playfair-display';

function applyFontToDOM(font: FontOption) {
  if (typeof document === 'undefined') return;
  // Remove any existing font utility classes
  const fontClasses = [
    'font-inter',
    'font-roboto',
    'font-poppins',
    'font-lato',
    'font-montserrat',
    'font-open-sans',
    'font-source-sans-pro',
    'font-nunito',
    'font-raleway',
    'font-playfair-display',
  ];
  document.documentElement.classList.remove(...fontClasses);
  // Add the new font class
  document.documentElement.classList.add(`font-${font}`);
}

interface FontState {
  font: FontOption;
  setFont: (font: FontOption) => void;
}

export const useFontStore = create<FontState>()(
  persist(
    (set, get) => ({
      font: 'inter',
      setFont: (font) => {
        applyFontToDOM(font);
        set({ font });
      },
    }),
    {
      name: 'dweller_font_store',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyFontToDOM(state.font);
        }
      },
    }
  )
);
