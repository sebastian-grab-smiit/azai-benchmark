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
  Label,
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
  const comparisonProjects = data.filter(
    (p) =>
      p.id !== userProjectId &&
      !(userProject &&
        p.totalCostMillion === userProject.totalCostMillion &&
        p.floorAreaSqm === userProject.floorAreaSqm),
  );

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
            <p className={`text-xs mt-1 ${costDiff > 0 ? 'text-green-500' : 'text-red-500'}`}>
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
    <ResponsiveContainer width="100%" height={500}>
      <ScatterChart margin={{ top: 16, right: 16, bottom: 26, left: 64 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          type="number"
          dataKey="totalCostMillion"
          name="Gesamtpreis (Mio.)"
          stroke="hsl(var(--muted-foreground))"
          tickMargin={8}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tick={(props: any) => {
            const { x, y, payload } = props;
            return (
              <text x={x} y={y} dy={12} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={12}>
                {Number(payload.value).toLocaleString('de-CH')}
              </text>
            );
          }}
        >
          <Label value="Gesamtpreis (Mio. EUR/CHF)" position="insideBottom" offset={24} />
        </XAxis>
        <YAxis
          type="number"
          dataKey="floorAreaSqm"
          name="Fläche (m²)"
          stroke="hsl(var(--muted-foreground))"
          tickMargin={8}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tick={(props: any) => {
            const { x, y, payload } = props;
            return (
              <text x={x} y={y} dx={-8} dy={4} textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={12}>
                {Number(payload.value).toLocaleString('de-CH')}
              </text>
            );
          }}
        >
          <Label value="Fläche (m²)" angle={-90} position="left" offset={46} />
        </YAxis>
        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          align="center"
          layout="horizontal"
          iconType="circle"
          height={36}
          wrapperStyle={{ marginTop: 8 }}
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
