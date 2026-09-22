import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightUnit } from '@/types/database';

const LBS_PER_KG = 2.20462262;
const KG_PER_LB = 0.45359237;
const UNIT_STORAGE_KEY = '@fitnesspro_unit_preference';

interface UnitContextType {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => Promise<void>;
  toggleUnit: () => Promise<void>;
  toDisplayWeight: (weightKg: number) => number;
  toStandardKg: (weight: number, fromUnit?: WeightUnit) => number;
  formatWeight: (weightKg: number) => string;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const UnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unit, setUnitState] = useState<WeightUnit>('kg');

  useEffect(() => {
    const loadUnit = async () => {
      try {
        const stored = await AsyncStorage.getItem(UNIT_STORAGE_KEY);
        if (stored === 'kg' || stored === 'lbs') {
          setUnitState(stored);
        }
      } catch (e) {
        console.error('Error al cargar preferencia de unidad:', e);
      }
    };
    loadUnit();
  }, []);

  const setUnit = async (newUnit: WeightUnit) => {
    setUnitState(newUnit);
    try {
      await AsyncStorage.setItem(UNIT_STORAGE_KEY, newUnit);
    } catch (e) {
      console.error('Error al guardar preferencia de unidad:', e);
    }
  };

  const toggleUnit = async () => {
    const next = unit === 'kg' ? 'lbs' : 'kg';
    await setUnit(next);
  };

  const toDisplayWeight = (weightKg: number): number => {
    if (unit === 'lbs') {
      return Math.round(weightKg * LBS_PER_KG);
    }
    return Math.round(weightKg);
  };

  const toStandardKg = (weight: number, fromUnit?: WeightUnit): number => {
    const targetUnit = fromUnit || unit;
    if (targetUnit === 'lbs') {
      return Math.round(weight * KG_PER_LB);
    }
    return Math.round(weight);
  };

  const formatWeight = (weightKg: number): string => {
    const val = toDisplayWeight(weightKg);
    return `${val} ${unit}`;
  };

  return (
    <UnitContext.Provider
      value={{
        unit,
        setUnit,
        toggleUnit,
        toDisplayWeight,
        toStandardKg,
        formatWeight,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
};

export const useUnit = () => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnit debe ser usado dentro de UnitProvider');
  }
  return context;
};
