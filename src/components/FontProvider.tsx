"use client";

import { useEffect } from "react";
import { useFontStore } from "@/stores/use-font-store";

const FONT_CLASSES = [
  "font-inter",
  "font-roboto",
  "font-poppins",
  "font-lato",
  "font-montserrat",
  "font-open-sans",
  "font-source-sans-pro",
  "font-nunito",
  "font-raleway",
  "font-playfair-display",
];

export function FontProvider() {
  const { font } = useFontStore();

  useEffect(() => {
    document.documentElement.classList.remove(...FONT_CLASSES);
    document.documentElement.classList.add(`font-${font}`);
  }, [font]);

  return null;
}