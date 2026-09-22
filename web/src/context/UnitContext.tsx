'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WeightUnit } from '@/types/database';
import {
  toDisplayWeight,
  formatWeight as formatWeightUtil,
  toStandardKg,
} from '@/lib/utils/units';

interface UnitContextType {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
  toggleUnit: () => void;
  displayWeight: (weightKg: number) => number;
  formatWeight: (weightKg: number | null | undefined, decimals?: number) => string;
  toStandardKg: (weight: number) => number;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [unit, setUnitState] = useState<WeightUnit>('kg');

  useEffect(() => {
    const saved = localStorage.getItem('fitness_pro_unit') as WeightUnit | null;
    if (saved === 'kg' || saved === 'lbs') {
      setUnitState(saved);
    }
  }, []);

  const setUnit = (newUnit: WeightUnit) => {
    setUnitState(newUnit);
    localStorage.setItem('fitness_pro_unit', newUnit);
  };

  const toggleUnit = () => {
    const next = unit === 'kg' ? 'lbs' : 'kg';
    setUnit(next);
  };

  const displayWeight = (weightKg: number) => toDisplayWeight(weightKg, unit);

  const formatWeight = (weightKg: number | null | undefined, decimals = 1) =>
    formatWeightUtil(weightKg, unit, decimals);

  const convertToKg = (weight: number) => toStandardKg(weight, unit);

  return (
    <UnitContext.Provider
      value={{
        unit,
        setUnit,
        toggleUnit,
        displayWeight,
        formatWeight,
        toStandardKg: convertToKg,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnit debe ser utilizado dentro de un UnitProvider');
  }
  return context;
}
