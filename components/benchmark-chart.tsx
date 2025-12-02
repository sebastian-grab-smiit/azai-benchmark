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
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

type DomainOptions = { padPct?: number; lockMinToZero?: boolean };

export function computePaddedNiceDomain(values: number[], opts: DomainOptions = {}): [number, number] {
  const padPct = opts.padPct ?? 0.12;
  const lockMinToZero = opts.lockMinToZero ?? true;

  const nums = values.filter((v) => typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v));
  if (nums.length === 0) {
    return [0, 1];
  }

  let min = Math.min(...nums);
  let max = Math.max(...nums);

  if (min === max) {
    const v = min;
    if (v === 0) {
      return [0, 1];
    } else {
      min = v * (1 - padPct);
      max = v * (1 + padPct);
    }
  }

  let span = max - min;
  let minP = min - span * padPct;
  let maxP = max + span * padPct;

  if (lockMinToZero) {
    minP = Math.max(0, minP);
  }

  let spanP = maxP - minP;
  if (!Number.isFinite(spanP) || spanP <= 0) {
    spanP = Math.abs(maxP || 1);
  }

  const magnitude = Math.pow(10, Math.floor(Math.log10(spanP)));
  let step = magnitude / 10;

  if (!Number.isFinite(step) || step <= 0) {
    step = 1;
  }

  const minN = Math.floor(minP / step) * step;
  const maxN = Math.ceil(maxP / step) * step;

  return [minN, maxN];
}

export interface ChartDataPoint {
  id: string;
  name: string;
  category: string;
  city: string;
  country: string;
  totalCostMillion: number;
  floorAreaSqm: number;
  costPerSqm?: number;
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

const toCostPerSqm = (totalCostMillion: number, floorAreaSqm: number) =>
  floorAreaSqm > 0 ? (totalCostMillion * 1_000_000) / floorAreaSqm : undefined;

function getQuantile(values: number[], q: number) {
  if (!values.length) return undefined;
  const pos = (values.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (values[base + 1] !== undefined) {
    return values[base] + rest * (values[base + 1] - values[base]);
  }
  return values[base];
}

export function BenchmarkChart({ data, userProjectId }: BenchmarkChartProps) {
  // Daten mit Kosten/m² anreichern
  const enhancedData: ChartDataPoint[] = data
    .filter(
      (p) =>
        typeof p.totalCostMillion === 'number' &&
        !Number.isNaN(p.totalCostMillion) &&
        typeof p.floorAreaSqm === 'number' &&
        !Number.isNaN(p.floorAreaSqm),
    )
    .map((p) => ({
      ...p,
      costPerSqm: p.costPerSqm ?? toCostPerSqm(p.totalCostMillion, p.floorAreaSqm),
    }));

  const userProject = enhancedData.find((p) => p.id === userProjectId);
  const comparisonProjects = enhancedData.filter(
    (p) =>
      p.id !== userProjectId &&
      !(userProject &&
        p.totalCostMillion === userProject.totalCostMillion &&
        p.floorAreaSqm === userProject.floorAreaSqm),
  );

  // Verteilung Kosten/m² für Quartile
  const costPerSqmValues = comparisonProjects
    .map((p) => p.costPerSqm)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v))
    .sort((a, b) => a - b);

  const q1 = getQuantile(costPerSqmValues, 0.25);
  const median = getQuantile(costPerSqmValues, 0.5);
  const q3 = getQuantile(costPerSqmValues, 0.75);

  const hasDistribution =
    typeof q1 === 'number' &&
    typeof q3 === 'number' &&
    !Number.isNaN(q1) &&
    !Number.isNaN(q3) &&
    q1 < q3;

  const totalValues = comparisonProjects
    .map((p) => p.totalCostMillion)
    .filter((v) => typeof v === 'number' && !Number.isNaN(v));

  const minTotal =
    totalValues.length > 0 ? Math.min(...totalValues) : userProject?.totalCostMillion ?? 0;
  const maxTotal =
    totalValues.length > 0 ? Math.max(...totalValues) : userProject?.totalCostMillion ?? 0;

  // Achsendomains dynamisch auf Basis der tatsächlich gerenderten Punkte
  const allPoints: ChartDataPoint[] = [
    ...(userProject ? [userProject] : []),
    ...comparisonProjects,
  ];

  const xValues = allPoints
    .map((p) => p.totalCostMillion)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

  const yValues = allPoints
    .map((p) => p.costPerSqm ?? toCostPerSqm(p.totalCostMillion, p.floorAreaSqm))
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

  const xDomain = computePaddedNiceDomain(xValues, { padPct: 0.12, lockMinToZero: true });
  const yDomain = computePaddedNiceDomain(yValues, { padPct: 0.12, lockMinToZero: true });

  const CustomTooltip = (props: any) => {
    const { active, payload, activePayload } = props;
    if (!active) return null;

    // Wichtig: Immer den wirklich aktiven Punkt verwenden.
    // Recharts liefert bei mehreren Reihen u.U. mehrere Payload-Items; activePayload[0]
    // referenziert das Element, das das Hover/Ereignis ausgelöst hat.
    const ap = Array.isArray(activePayload) && activePayload.length ? activePayload : payload;
    if (!ap?.length) return null;

    const point = (ap[0]?.payload ?? null) as ChartDataPoint | null;
    if (!point) return null;

    const totalCostDiff =
      userProject ? point.totalCostMillion - userProject.totalCostMillion : 0;
    const totalCostDiffPercent =
      userProject && userProject.totalCostMillion
        ? (totalCostDiff / userProject.totalCostMillion) * 100
        : 0;

    const costPerSqmValue = point.costPerSqm ?? toCostPerSqm(point.totalCostMillion, point.floorAreaSqm);
    const userCostPerSqm =
      userProject && userProject.floorAreaSqm > 0
        ? userProject.costPerSqm ??
          toCostPerSqm(userProject.totalCostMillion, userProject.floorAreaSqm)
        : undefined;

    const costPerSqmDiff =
      userCostPerSqm != null && costPerSqmValue != null ? costPerSqmValue - userCostPerSqm : 0;
    const costPerSqmDiffPercent =
      userCostPerSqm && costPerSqmValue != null ? (costPerSqmDiff / userCostPerSqm) * 100 : 0;

    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground text-sm">{point.name}</p>
        <p className="text-xs text-muted-foreground">{point.category}</p>
        <p className="text-xs text-muted-foreground">
          {point.city}, {point.country}
        </p>

        <div className="mt-2 space-y-1">
          <p className="text-xs text-foreground">
            Gesamtpreis:{' '}
            <span className="font-semibold">
              {point.totalCostMillion.toLocaleString('de-CH', {
                maximumFractionDigits: 1,
              })}{' '}
              Mio.
            </span>
          </p>
          <p className="text-xs text-foreground">
            Fläche:{' '}
            <span className="font-semibold">
              {point.floorAreaSqm.toLocaleString('de-CH')} m²
            </span>
          </p>
          {costPerSqmValue != null && (
            <p className="text-xs text-foreground">
              Kosten/m²:{' '}
              <span className="font-semibold">
                CHF {Math.round(costPerSqmValue).toLocaleString('de-CH')} /m²
              </span>
            </p>
          )}
          {userCostPerSqm != null && costPerSqmValue != null && (
            <p
              className={`text-xs mt-1 ${
                costPerSqmDiff <= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {costPerSqmDiff <= 0 ? '−' : '+'}
              {Math.abs(Math.round(costPerSqmDiff)).toLocaleString('de-CH')}{' '}
              CHF/m² ({costPerSqmDiffPercent.toFixed(1)}%) vs. dein Projekt
            </p>
          )}
          {userProject && totalCostDiff !== 0 && (
            <p
              className={`text-xs ${
                totalCostDiff <= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              Gesamtbudget: {totalCostDiff <= 0 ? '−' : '+'}
              {Math.abs(totalCostDiff).toLocaleString('de-CH', {
                maximumFractionDigits: 1,
              })}{' '}
              Mio. ({totalCostDiffPercent.toFixed(1)}%) vs. dein Projekt
            </p>
          )}
        </div>
      </div>
    );
  };

  // Custom-Renderer für Punkt + immer sichtbares Label
  const renderDotWithLabel = (props: any) => {
    const { cx, cy, r = 3, fill, fillOpacity, payload } = props;
    if (cx == null || cy == null) return <g />;

    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={fillOpacity} />
        <text
          x={cx + 6}
          y={cy - 6}
          fontSize={10}
          fontWeight={payload?.isUserProject ? 600 : 400}
          fill="hsl(var(--muted-foreground))"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {payload?.name}
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={500}>
      <ScatterChart margin={{ top: 24, right: 24, bottom: 24, left: 64 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

        {hasDistribution && minTotal !== 0 && maxTotal !== 0 && (
          <ReferenceArea
            y1={q1}
            y2={q3}
            x1={minTotal}
            x2={maxTotal}
            fill="hsl(var(--primary))"
            fillOpacity={0.04}
            strokeOpacity={0}
          />
        )}

        {typeof median === 'number' && !Number.isNaN(median) && (
          <ReferenceLine
            y={median}
            stroke="hsl(var(--primary))"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{
              value: 'Median Kosten/m²',
              position: 'right',
              fill: 'hsl(var(--primary))',
              fontSize: 10,
            }}
          />
        )}

        {userProject && typeof userProject.costPerSqm === 'number' && (
          <ReferenceLine
            y={userProject.costPerSqm}
            stroke="#f97316"
            strokeDasharray="4 2"
            strokeWidth={1}
            label={{
              value: 'Dein Projekt',
              position: 'right',
              fill: '#f97316',
              fontSize: 10,
            }}
          />
        )}

        <XAxis
          type="number"
          dataKey="totalCostMillion"
          domain={[xDomain[0], xDomain[1]]}
          name="Gesamtpreis"
          stroke="hsl(var(--muted-foreground))"
          tickMargin={8}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tick={(props: any) => {
            const { x, y, payload } = props;
            return (
              <text
                x={x}
                y={y}
                dy={12}
                textAnchor="middle"
                fill="hsl(var(--muted-foreground))"
                fontSize={12}
              >
                {Number(payload.value).toLocaleString('de-CH', {
                  maximumFractionDigits: 1,
                })}
              </text>
            );
          }}
        >
          <Label value="Gesamtpreis (Mio.)" position="insideBottom" offset={24} />
        </XAxis>

        <YAxis
          type="number"
          dataKey="costPerSqm"
          domain={[yDomain[0], yDomain[1]]}
          name="Kosten/m²"
          stroke="hsl(var(--muted-foreground))"
          tickMargin={8}
          tickLine={false}
          axisLine={{ stroke: 'hsl(var(--border))' }}
          tick={(props: any) => {
            const { x, y, payload } = props;
            return (
              <text
                x={x}
                y={y}
                dx={-8}
                dy={4}
                textAnchor="end"
                fill="hsl(var(--muted-foreground))"
                fontSize={12}
              >
                {Number(payload.value).toLocaleString('de-CH', {
                  maximumFractionDigits: 0,
                })}
              </text>
            );
          }}
        >
          <Label value="Kosten/m²" angle={-90} position="left" offset={46} />
        </YAxis>

        <Tooltip trigger="hover" cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
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
            data={[{ ...userProject }]}
            fill="#f97316"
            shape={renderDotWithLabel}
            fillOpacity={1}
          />
        )}
<Scatter
  name="comparison"
  data={comparisonProjects.map((p) => ({ ...p }))}
  fill="#06b6d4"
  fillOpacity={0.7}
  shape={renderDotWithLabel}
/>

      </ScatterChart>
    </ResponsiveContainer>
  );
}
