'use client';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  totalCostMillion: number;
  floorAreaSqm: number;
  isUserProject?: boolean;
}

interface BenchmarkChartProps {
  data: ChartDataPoint[];
  userProjectId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Flughafen: '#3b82f6',
  Stadion: '#8b5cf6',
  Bürogebäude: '#06b6d4',
  Wohnhaus: '#10b981',
  Krankenhaus: '#f59e0b',
  Logistikzentrum: '#ef4444',
  Schule: '#ec4899',
  Sonstiges: '#6b7280',
};

export function BenchmarkChart({ data, userProjectId }: BenchmarkChartProps) {
  const userProject = data.find((p) => p.id === userProjectId);
  const comparisonProjects = data.filter((p) => p.id !== userProjectId);

  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const costDiff = userProject ? data.totalCostMillion - userProject.totalCostMillion : 0;
      const costDiffPercent =
        userProject && userProject.totalCostMillion
          ? ((costDiff / userProject.totalCostMillion) * 100).toFixed(1)
          : 0;
      const costPerSqm = (data.totalCostMillion * 1000000) / data.floorAreaSqm;

      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground text-sm">{data.name}</p>
          <p className="text-xs text-muted-foreground">{data.category}</p>
          <p className="text-xs text-muted-foreground">
            {data.city}, {data.country}
          </p>
          <hr className="my-2 border-border" />
          <p className="text-xs text-foreground">Fläche: {data.floorAreaSqm.toLocaleString()} m²</p>
          <p className="text-xs text-foreground">
            Kosten: {data.totalCostMillion.toFixed(1)} Mio.
          </p>
          <p className="text-xs text-foreground">
            Kosten/m²: CHF {costPerSqm.toLocaleString('de-CH', { maximumFractionDigits: 0 })}
          </p>
          {userProject && costDiff !== 0 && (
            <p className={`text-xs mt-1 ${costDiff > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {costDiff > 0 ? '+' : ''}
              {costDiffPercent}% vs. dein Projekt
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey="totalCostMillion"
          name="Gesamtpreis (Mio.)"
          label={{ value: 'Gesamtpreis (Mio. EUR/CHF)', position: 'insideBottomRight', offset: -5 }}
          stroke="hsl(var(--muted-foreground))"
        />
        <YAxis
          type="number"
          dataKey="floorAreaSqm"
          name="Fläche (m²)"
          label={{ value: 'Fläche (m²)', angle: -90, position: 'insideLeft' }}
          stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
          formatter={(value) => {
            if (value === 'user-project') return 'Dein Projekt';
            if (value === 'comparison') return 'Vergleichsprojekte';
            return value;
          }}
        />

        {userProject && (
          <Scatter
            name="user-project"
            data={[userProject]}
            fill="#ef4444"
            shape="circle"
            fillOpacity={1}
          />
        )}

        <Scatter
          name="comparison"
          data={comparisonProjects}
          fill="#06b6d4"
          fillOpacity={0.7}
          shape="circle"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
