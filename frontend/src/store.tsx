import React, { createContext, useContext, useState } from "react";
import { Selection, ComputeResult, Jacket } from "@/src/api";

export const DEFAULT_SELECTION: Selection = {
  silhouette: "overshirt",
  quilt: "geometric",
  colour: "ivory",
  craft: "conversation",
  personal: "none",
  personal_value: null,
};

type DnaResult = {
  id: string;
  name: string;
  description: string;
  palette: string;
  silhouette: string;
  craft_affinity: string;
  tags: string[];
  recommended_jackets: Jacket[];
  recommended_craft?: string;
};

type DesignState = {
  selection: Selection;
  setSelection: (s: Selection) => void;
  compute: ComputeResult | null;
  setCompute: (c: ComputeResult | null) => void;
  activeJacket: Jacket | null;
  setActiveJacket: (j: Jacket | null) => void;
  dna: DnaResult | null;
  setDna: (d: DnaResult | null) => void;
  size: string;
  setSize: (s: string) => void;
  profileId: string | null;
  setProfileId: (id: string | null) => void;
};

const DesignContext = createContext<DesignState | null>(null);

export function DesignProvider({ children }: { children: React.ReactNode }) {
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);
  const [compute, setCompute] = useState<ComputeResult | null>(null);
  const [activeJacket, setActiveJacket] = useState<Jacket | null>(null);
  const [dna, setDna] = useState<DnaResult | null>(null);
  const [size, setSize] = useState<string>("M");

  const [profileId, setProfileId] = useState<string | null>(null);

  return (
    <DesignContext.Provider
      value={{
        selection, setSelection,
        compute, setCompute,
        activeJacket, setActiveJacket,
        dna, setDna,
        size, setSize,
        profileId, setProfileId,
      }}
    >
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error("useDesign must be used within DesignProvider");
  return ctx;
}
