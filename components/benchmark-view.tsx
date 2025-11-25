'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BenchmarkChart } from './benchmark-chart';
import { BenchmarkTable } from './benchmark-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MOCK_PROJECTS, ProjectCategory } from '@/lib/mock-data';

type BenchmarkMode = 'location' | 'cost' | 'efficiency' | 'manual';

const CATEGORIES: ProjectCategory[] = [
  'Flughafen',
  'Stadion',
  'Bürogebäude',
  'Wohnhaus',
  'Krankenhaus',
  'Logistikzentrum',
  'Schule',
  'Sonstiges',
];

const COUNTRIES = ['Schweiz', 'Deutschland', 'Frankreich', 'Österreich', 'Italien'];

export function BenchmarkView() {
  const [projectName, setProjectName] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Bürogebäude');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Schweiz');
  const [totalCost, setTotalCost] = useState('');
  const [floorArea, setFloorArea] = useState('');
  const [benchmarkMode, setBenchmarkMode] = useState<BenchmarkMode>('cost');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const parseNumber = (value: string) => {
    if (!value) return NaN;
    return parseFloat(value.replace(',', '.'));
  };

  const userProject = useMemo(() => {
    const total = parseNumber(totalCost);
    const area = parseNumber(floorArea);

    if (!projectName || !category || !city || !country) return null;
    if (!Number.isFinite(total) || !Number.isFinite(area) || total <= 0 || area <= 0) return null;

    return {
      id: 'user-project',
      name: projectName,
      category,
      city,
      country,
      totalCostMillion: total,
      floorAreaSqm: area,
      isUserProject: true,
    };
  }, [projectName, category, city, country, totalCost, floorArea]);

  const handleExport = async () => {
    if (typeof window === 'undefined') return;

    const element = document.getElementById('benchmark-export-area');
    if (!element) return;

    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        try {
          const win = clonedDoc.defaultView;
          if (!win) return;

          // Coerce CSS Color 4 functions (lab/oklab/oklch/lch) into sRGB rgb(...)
          // by letting the browser compute them via a dummy element and a 2D canvas.
          const resolver = clonedDoc.createElement('span');
          resolver.style.display = 'none';
          clonedDoc.body.appendChild(resolver);

          // Use a canvas to normalize any supported CSS color to an sRGB string (rgb(...) or #hex).
          const canvasEl = clonedDoc.createElement('canvas');
          const ctx = canvasEl.getContext('2d');

          const resolveVarToRgb = (cssVarName: string) => {
            try {
              resolver.style.color = `var(${cssVarName})`;
              const col = win.getComputedStyle(resolver).color; // may be lab()/oklch()/...
              if (!col) return '';
              if (ctx) {
                // Set as fillStyle and read back the normalized sRGB representation.
                // If the browser supports the color syntax, this yields a normalized sRGB string.
                (ctx as CanvasRenderingContext2D).fillStyle = col as unknown as string;
                const normalized = (ctx as CanvasRenderingContext2D).fillStyle as unknown as string;
                // If normalization worked, we should get a different string like "rgb(...)" or "#rrggbb"
                if (normalized && typeof normalized === 'string' && normalized !== col) {
                  return normalized;
                }
              }
              // Fallback: if canvas isn't available or normalization didn't change the value
              // return empty so we don't inject unsupported values.
              return '';
            } catch {
              return '';
            }
          };

          const styleEl = clonedDoc.createElement('style');
          styleEl.setAttribute('data-export-color-fallbacks', 'true');

          const vars = [
            // base variables
            '--background','--foreground','--card','--card-foreground','--popover','--popover-foreground',
            '--primary','--primary-foreground','--secondary','--secondary-foreground','--muted','--muted-foreground',
            '--accent','--accent-foreground','--destructive','--destructive-foreground','--border','--input','--ring',
            '--chart-1','--chart-2','--chart-3','--chart-4','--chart-5',
            '--sidebar','--sidebar-foreground','--sidebar-primary','--sidebar-primary-foreground',
            '--sidebar-accent','--sidebar-accent-foreground','--sidebar-border','--sidebar-ring',
            // tailwind token-bridges (tailwind v4 maps bg-background -> var(--color-background))
            '--color-background','--color-foreground','--color-card','--color-card-foreground',
            '--color-popover','--color-popover-foreground','--color-primary','--color-primary-foreground',
            '--color-secondary','--color-secondary-foreground','--color-muted','--color-muted-foreground',
            '--color-accent','--color-accent-foreground','--color-destructive','--color-destructive-foreground',
            '--color-border','--color-input','--color-ring',
            '--color-sidebar','--color-sidebar-foreground','--color-sidebar-primary','--color-sidebar-primary-foreground',
            '--color-sidebar-accent','--color-sidebar-accent-foreground','--color-sidebar-border','--color-sidebar-ring'
          ];

          // Fallback sRGB palette used if normalization to rgb(...) fails.
          const fallback: Record<string, string> = {
            '--background': '#ffffff',
            '--foreground': '#0a0a0a',
            '--card': '#ffffff',
            '--card-foreground': '#0a0a0a',
            '--popover': '#ffffff',
            '--popover-foreground': '#0a0a0a',
            '--primary': '#1f2937',
            '--primary-foreground': '#ffffff',
            '--secondary': '#f3f4f6',
            '--secondary-foreground': '#111827',
            '--muted': '#f5f5f4',
            '--muted-foreground': '#6b7280',
            '--accent': '#1f2937',
            '--accent-foreground': '#ffffff',
            '--destructive': '#dc2626',
            '--destructive-foreground': '#ffffff',
            '--border': '#e5e7eb',
            '--input': '#f3f4f6',
            '--ring': '#1f2937',
            '--chart-1': '#1f2937',
            '--chart-2': '#059669',
            '--chart-3': '#2563eb',
            '--chart-4': '#f59e0b',
            '--chart-5': '#e11d48',
            '--sidebar': '#ffffff',
            '--sidebar-foreground': '#0a0a0a',
            '--sidebar-primary': '#1f2937',
            '--sidebar-primary-foreground': '#ffffff',
            '--sidebar-accent': '#f3f4f6',
            '--sidebar-accent-foreground': '#111827',
            '--sidebar-border': '#e5e7eb',
            '--sidebar-ring': '#1f2937'
          };

          // Build overrides for :root and .dark to out-prioritize earlier definitions.
          let css = ':root{';
          for (const v of vars) {
            const resolved = resolveVarToRgb(v) || fallback[v] || '';
            if (resolved) {
              css += `${v}:${resolved} !important;`;
            }
          }
          css += '}\n.dark{';
          for (const v of vars) {
            const resolved = resolveVarToRgb(v) || fallback[v] || '';
            if (resolved) {
              css += `${v}:${resolved} !important;`;
            }
          }
          css += '}';

          styleEl.textContent = css + `
#benchmark-export-area, #benchmark-export-area * {
  background-image: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  filter: none !important;
  border-image: none !important;
}
#benchmark-export-area *::before, #benchmark-export-area *::after {
  background-image: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  filter: none !important;
  border-image: none !important;
}
`;
          clonedDoc.head.appendChild(styleEl);
          resolver.remove();

          // Inline sRGB colors and drop complex backgrounds within the export area
          const exportRoot = clonedDoc.getElementById('benchmark-export-area');
          if (exportRoot) {
            // Convert any CSS color string to sRGB using a 2D canvas normalization
            const toSrgb = (val: string) => {
              if (!val) return '';
              try {
                if (ctx) {
                  (ctx as any).fillStyle = val as any;
                  const normalized = (ctx as any).fillStyle as string;
                  if (normalized && typeof normalized === 'string') {
                    return normalized; // usually rgb(...) or #rrggbb
                  }
                }
              } catch {}
              // Use value as-is only if already sRGB-ish
              return /^#|^rgb/i.test(val) ? val : '';
            };

            const applyColors = (el: Element) => {
              const c = win.getComputedStyle(el as HTMLElement);
              const node = el as HTMLElement;

              const bg = toSrgb(c.backgroundColor);
              const col = toSrgb(c.color);
              const bc = toSrgb(c.borderColor);
              const btc = toSrgb(c.borderTopColor);
              const brc = toSrgb(c.borderRightColor);
              const bbc = toSrgb(c.borderBottomColor);
              const blc = toSrgb(c.borderLeftColor);
              const oc = toSrgb(c.outlineColor);
              const fill = toSrgb((c as any).fill || '');
              const stroke = toSrgb((c as any).stroke || '');

              if (bg) node.style.setProperty('background-color', bg, 'important');
              // Disable background images (gradients) that may contain lab()/oklch()
              if (c.backgroundImage && c.backgroundImage !== 'none') {
                node.style.setProperty('background-image', 'none', 'important');
              }
              if (col) node.style.setProperty('color', col, 'important');
              if (bc) node.style.setProperty('border-color', bc, 'important');
              if (btc) node.style.setProperty('border-top-color', btc, 'important');
              if (brc) node.style.setProperty('border-right-color', brc, 'important');
              if (bbc) node.style.setProperty('border-bottom-color', bbc, 'important');
              if (blc) node.style.setProperty('border-left-color', blc, 'important');
              if (oc) node.style.setProperty('outline-color', oc, 'important');

              // Drop complex color-bearing effects that html2canvas may try to parse
              node.style.setProperty('box-shadow', 'none', 'important');
              node.style.setProperty('text-shadow', 'none', 'important');
              node.style.setProperty('filter', 'none', 'important');
              node.style.setProperty('border-image', 'none', 'important');
              node.style.setProperty('outline', 'none', 'important');

              if (fill) node.style.setProperty('fill', fill, 'important');
              if (stroke) node.style.setProperty('stroke', stroke, 'important');
            };

            // Walk all elements in the export subtree and inline colors in sRGB
            const walker = clonedDoc.createTreeWalker(exportRoot, NodeFilter.SHOW_ELEMENT);
            applyColors(exportRoot);
            let n = walker.nextNode();
            while (n) {
              applyColors(n as Element);
              n = walker.nextNode();
            }
          }
        } catch {
          // ignore conversion issues and let html2canvas continue
        }
      }
    });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const marginX = (pageWidth - imgWidth) / 2;
    const marginY = (pageHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', marginX, marginY, imgWidth, imgHeight, undefined, 'FAST');
    pdf.save('benchmark.pdf');
  };

  const comparisonProjects = useMemo(() => {
    if (!userProject) return [];

    let filtered = [...MOCK_PROJECTS];

    if (benchmarkMode === 'location') {
      // Filter by Location + Kostenähnlichkeit
      filtered = filtered.filter((p) => p.country === country);
      filtered.sort((a, b) => {
        const diffA = Math.abs(a.totalCostMillion - userProject.totalCostMillion);
        const diffB = Math.abs(b.totalCostMillion - userProject.totalCostMillion);
        return diffA - diffB;
      });
    } else if (benchmarkMode === 'cost') {
      // Nur Budget-Nähe
      filtered.sort((a, b) => {
        const diffA = Math.abs(a.totalCostMillion - userProject.totalCostMillion);
        const diffB = Math.abs(b.totalCostMillion - userProject.totalCostMillion);
        return diffA - diffB;
      });
    } else if (benchmarkMode === 'efficiency') {
      // Effizienz-Fokus (Kosten/m²)
      const userCostPerSqm =
        userProject.floorAreaSqm > 0
          ? (userProject.totalCostMillion * 1_000_000) / userProject.floorAreaSqm
          : 0;

      filtered = filtered.filter((p) => p.floorAreaSqm > 0);

      filtered.sort((a, b) => {
        const costPerSqmA = (a.totalCostMillion * 1_000_000) / a.floorAreaSqm;
        const costPerSqmB = (b.totalCostMillion * 1_000_000) / b.floorAreaSqm;
        const diffA = Math.abs(costPerSqmA - userCostPerSqm);
        const diffB = Math.abs(costPerSqmB - userCostPerSqm);
        return diffA - diffB;
      });
    } else if (benchmarkMode === 'manual') {
      // Manuelle Auswahl
      filtered = filtered.filter((p) => selectedProjects.includes(p.id));
      return filtered;
    }

    return filtered.slice(0, 6);
  }, [userProject, benchmarkMode, country, selectedProjects]);

  const chartData = useMemo(() => {
    if (!userProject) return [];
    return [userProject, ...comparisonProjects];
  }, [userProject, comparisonProjects]);

  const efficiencyStats = useMemo(() => {
    if (!userProject || comparisonProjects.length === 0) {
      return null;
    }

    if (userProject.floorAreaSqm <= 0) return null;

    const userCostPerSqm =
      (userProject.totalCostMillion * 1_000_000) / userProject.floorAreaSqm;

    const costs = comparisonProjects
      .filter((p) => p.floorAreaSqm > 0)
      .map((p) => (p.totalCostMillion * 1_000_000) / p.floorAreaSqm)
      .sort((a, b) => a - b);

    if (!costs.length) return null;

    const getQuantile = (values: number[], q: number) => {
      if (!values.length) return undefined;
      const pos = (values.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (values[base + 1] !== undefined) {
        return values[base] + rest * (values[base + 1] - values[base]);
      }
      return values[base];
    };

    const median = getQuantile(costs, 0.5);
    const q1 = getQuantile(costs, 0.25);
    const q3 = getQuantile(costs, 0.75);

    if (!median) return null;

    const delta = userCostPerSqm - median;
    const deltaPct = (delta / median) * 100;

    let index = costs.findIndex((v) => v >= userCostPerSqm);
    if (index === -1) index = costs.length - 1;
    const percentile = ((index + 1) / (costs.length + 1)) * 100;

    return {
      sampleSize: costs.length,
      userCostPerSqm,
      median,
      q1,
      q3,
      delta,
      deltaPct,
      percentile,
    };
  }, [userProject, comparisonProjects]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-foreground mb-3">Projekt-Benchmark</h1>
        <p className="text-lg text-muted-foreground max-w-none leading-relaxed">
          Vergleiche dein Bauprojekt mit ähnlichen Projekten und erkenne deine Position im Markt –
          inklusive Kosten/m², Perzentilen und einer kompakten Interpretation für das Management.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Left Column – Projekt & Einstellungen */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Dein Bauprojekt</CardTitle>
              <CardDescription className="text-sm">
                Gib die Eckdaten deines Projekts ein und sieh direkt, wo du im Markt liegst.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Projektname
                </label>
                <Input
                  placeholder="z.B. Neubau Bürokomplex"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Kategorie
                  </label>
                  <Select value={category} onValueChange={(v) => setCategory(v as ProjectCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Land
                  </label>
                  <Select value={country} onValueChange={(v) => setCountry(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Land wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Stadt
                  </label>
                  <Input
                    placeholder="z.B. Zürich"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Gesamtpreis (Mio.)
                  </label>
                  <Input
                    placeholder="z.B. 120"
                    value={totalCost}
                    onChange={(e) => setTotalCost(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Fläche (m²)
                </label>
                <Input
                  placeholder="z.B. 20 000"
                  value={floorArea}
                  onChange={(e) => setFloorArea(e.target.value)}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Tipp: Nutze grobe Schätzwerte für einen ersten Benchmark und verfeinere die Angaben
                später im Projektverlauf.
              </p>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Benchmark-Einstellungen</CardTitle>
              <CardDescription className="text-sm">
                Wähle, wie die Vergleichsprojekte ausgewählt werden sollen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={benchmarkMode} onValueChange={(v) => setBenchmarkMode(v as BenchmarkMode)}>
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 border border-border">
                  <TabsTrigger value="location" className="text-xs">
                    Region
                  </TabsTrigger>
                  <TabsTrigger value="cost" className="text-xs">
                    Budget
                  </TabsTrigger>
                  <TabsTrigger value="efficiency" className="text-xs">
                    Effizienz
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs">
                    Manuell
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="location" className="mt-5 space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">Location-Fokus</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Zeige Projekte aus demselben Großraum wie dein Projekt mit ähnlichen
                      Gesamtkosten.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="cost" className="mt-5 space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">Budget-Fokus</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Vergleiche dein Projekt mit Projekten mit ähnlichem Budget – unabhängig vom
                      Standort.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="efficiency" className="mt-5 space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">Effizienz-Fokus</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Vergleicht dein Projekt anhand der Kosten/m² mit Projekten ähnlicher
                      Größenordnung – ideal, um Baukosteneffizienz und Einsparpotenziale zu
                      diskutieren.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="mt-5 space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">Manuelle Auswahl</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Wähle gezielt Projekte aus, die du im Vergleich sehen möchtest (max. 6).
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column – Chart & Tabelle */}
        <div className="lg:col-span-2 space-y-6">
          {userProject ? (
            <>
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-4 flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-semibold">Benchmark Scatter Plot</CardTitle>
                    <CardDescription className="text-sm">
                      Vergleich: Gesamtpreis vs. Kosten/m² deines Projekts.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-1 flex items-center gap-1"
                    onClick={handleExport}
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Export</span>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4" id="benchmark-export-area">
                  {efficiencyStats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                      <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Kosten/m² (dein Projekt)
                        </p>
                        <p className="font-semibold">
                          {Math.round(efficiencyStats.userCostPerSqm).toLocaleString('de-CH')} CHF/m²
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Median: {Math.round(efficiencyStats.median).toLocaleString('de-CH')} CHF/m²
                        </p>
                      </div>

                      <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Position im Markt
                        </p>
                        <p className="font-semibold">
                          {efficiencyStats.delta <= 0 ? 'unter Median' : 'über Median'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {efficiencyStats.delta <= 0 ? '−' : '+'}
                          {Math.abs(Math.round(efficiencyStats.delta)).toLocaleString('de-CH')}{' '}
                          CHF/m² ({efficiencyStats.deltaPct.toFixed(1)}%)
                        </p>
                      </div>

                      <div className="rounded-md border border-border bg-muted/40 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          Percentile
                        </p>
                        <p className="font-semibold">
                          {efficiencyStats.percentile.toFixed(0)}. Perzentil
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Basis: {efficiencyStats.sampleSize} Vergleichsprojekte
                        </p>
                      </div>
                    </div>
                  )}

                  {efficiencyStats && (
                    <div className="rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs sm:text-sm leading-relaxed">
                      <p className="font-medium text-foreground mb-1">Interpretation</p>
                      <p className="text-muted-foreground">
                        Ihr Projekt liegt im{' '}
                        <span className="font-semibold">
                          {efficiencyStats.percentile.toFixed(0)}. Perzentil
                        </span>{' '}
                        der Kosten/m² – Sie bauen damit effizienter als etwa{' '}
                        <span className="font-semibold">
                          {Math.max(0, 100 - Math.round(efficiencyStats.percentile))}%
                        </span>{' '}
                        der Vergleichsprojekte.
                      </p>
                    </div>
                  )}

                  <BenchmarkChart data={chartData} userProjectId="user-project" />
                  <p className="text-xs text-muted-foreground">
                    Es werden die {Math.min(6, comparisonProjects.length)} Projekte mit den
                    ähnlichsten Eigenschaften im gewählten Modus angezeigt. Der schattierte Bereich
                    markiert den typischen Kosten/m²-Korridor (25.–75. Perzentil); die Linien zeigen
                    Median und dein Projekt.
                  </p>
                </CardContent>
              </Card>

              {benchmarkMode === 'manual' && (
                <Card className="border-border shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold">Projekte auswählen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BenchmarkTable
                      projects={MOCK_PROJECTS}
                      selectedIds={selectedProjects}
                      onSelectionChange={setSelectedProjects}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-border border-dashed bg-muted/30">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground">
                  Gib die Eckdaten deines Projekts ein, um den Benchmark und die Interpretation zu
                  sehen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
