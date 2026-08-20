"use client";

import { createContext, useContext } from "react";

export interface PCContextType {
  selectedOrg: string;
  setSelectedOrg: (org: string) => void;
}

export const PCContext = createContext<PCContextType>({
  selectedOrg: "ALL",
  setSelectedOrg: () => {},
});

export const usePCOrganization = () => useContext(PCContext);
