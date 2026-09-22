'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { useUnit } from '@/context/UnitContext';
import { calculate1RM } from '@/lib/utils/calculations';
import { WorkoutSession } from '@/types/database';
import { Award, CalendarCheck, TrendingUp, Weight } from 'lucide-react';

interface TonnageDataPoint {
  date: string;
  tonnage_kg: number;
}

interface OneRMDataPoint {
  date: string;
  weight_kg: number;
  reps: number;
  exercise_name: string;
}

interface ClientAnalyticsChartsProps {
  sessions: WorkoutSession[];
  tonnageHistory: TonnageDataPoint[];
  oneRMHistory: OneRMDataPoint[];
  periodLabel?: string;
}

export default function ClientAnalyticsCharts({
  sessions,
  tonnageHistory,
  oneRMHistory,
  periodLabel,
}: ClientAnalyticsChartsProps) {
  const { unit, displayWeight } = useUnit();

  // 1. Datos para Cumplimiento de Calendario (agrupados por estado)
  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const partialCount = sessions.filter((s) => s.status === 'partial').length;
  const missedCount = sessions.filter((s) => s.status === 'missed').length;

  const complianceData = [
    { name: 'Completadas', cantidad: completedCount, fill: '#10b981' },
    { name: 'Parciales', cantidad: partialCount, fill: '#f59e0b' },
    { name: 'Falladas / Perdidas', cantidad: missedCount, fill: '#ef4444' },
  ];

  // 2. Datos para Tonelaje Total Levantado (adaptado a la unidad activa)
  const formattedTonnageData = tonnageHistory.map((item) => ({
    date: item.date,
    tonnage: displayWeight(item.tonnage_kg),
  }));

  // 3. Datos para Progresión de 1RM Estimada (Fórmula de Epley)
  const formattedOneRMData = oneRMHistory.map((item) => {
    const raw1RMKg = calculate1RM(item.weight_kg, item.reps);
    return {
      date: item.date,
      exercise: item.exercise_name,
      oneRM: displayWeight(raw1RMKg),
      reps: item.reps,
      weightUsed: displayWeight(item.weight_kg),
    };
  });

  return (
    <div className="space-y-6">
      {periodLabel && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-950/90 border border-gray-800 rounded-xl text-xs">
          <span className="text-gray-400 font-medium flex items-center space-x-1.5">
            <span>📅</span>
            <span>Periodo en gráficos:</span>
          </span>
          <span className="text-emerald-400 font-bold">{periodLabel}</span>
        </div>
      )}

      {/* 1. Cumplimiento de Calendario */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">
              Cumplimiento de Calendario
            </h4>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Total programadas: {sessions.length}
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={complianceData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#6b7280" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#111827',
                  borderColor: '#374151',
                  borderRadius: '0.75rem',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="cantidad" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Tonelaje Total Levantado */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Weight className="w-5 h-5 text-sky-400" />
            <div>
              <h4 className="text-sm font-bold text-white">
                Tonelaje Total Acumulado por Sesión
              </h4>
              <p className="text-[11px] text-gray-400">
                Volumen total de carga expresado en {unit.toUpperCase()}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950/60 border border-sky-800/40 px-2.5 py-1 rounded-lg">
            Unidad: {unit.toUpperCase()}
          </span>
        </div>

        <div className="h-64 w-full">
          {formattedTonnageData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-gray-500 space-y-2 p-4 text-center">
              <div className="p-3 bg-gray-950 border border-gray-800 rounded-2xl text-gray-600">
                <Weight className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-300">
                Sin registros de tonelaje acumulado
              </span>
              <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                El volumen se encuentra en cero (0 {unit.toUpperCase()}). Se actualizará automáticamente conforme el alumno complete series y registre cargas en su app móvil.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={formattedTonnageData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorTonnage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`${val} ${unit}`, 'Tonelaje']}
                />
                <Area
                  type="monotone"
                  dataKey="tonnage"
                  stroke="#0ea5e9"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTonnage)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 3. Progresión de Fuerza Máxima Estimada (1RM) */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">
                Progresión de 1RM Estimada (Epley)
              </h4>
              <p className="text-[11px] text-gray-400">
                Cálculo de repetición máxima en {unit.toUpperCase()} sobre series efectivas
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
            Fórmula Epley: w*(1 + r/30)
          </span>
        </div>

        <div className="h-64 w-full">
          {formattedOneRMData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-xs text-gray-500 space-y-2 p-4 text-center">
              <div className="p-3 bg-gray-950 border border-gray-800 rounded-2xl text-gray-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="font-bold text-gray-300">
                Sin series registradas para la curva de fuerza 1RM
              </span>
              <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                Los datos se encuentran en cero (0 {unit.toUpperCase()}). La progresión de 1RM se trazará dinámicamente cuando el alumno registre repeticiones y cargas efectivas.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={formattedOneRMData}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, _name: any, item: any) => [
                    `${val} ${unit}`,
                    item?.payload?.exercise ? `1RM (${item.payload.exercise})` : '1RM Estimado',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="oneRM"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
