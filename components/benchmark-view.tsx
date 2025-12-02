'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

type BenchmarkMode = 'location' | 'cost' | 'efficiency' | 'area' | 'manual';

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
    } else if (benchmarkMode === 'area') {
      // Flächen-Fokus (m²)
      if (userProject.floorAreaSqm > 0) {
        filtered = filtered.filter((p) => p.floorAreaSqm > 0);
        filtered.sort((a, b) => {
          const diffA = Math.abs(a.floorAreaSqm - userProject.floorAreaSqm);
          const diffB = Math.abs(b.floorAreaSqm - userProject.floorAreaSqm);
          return diffA - diffB;
        });
      } else {
        // Robustheit: Falls Fläche ungültig, keine Sortierung nach Fläche erzwingen
        filtered = filtered.filter((p) => p.floorAreaSqm > 0);
      }
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
                <TabsList className="grid w-full grid-cols-5 bg-muted/50 border border-border">
                  <TabsTrigger value="location" className="text-xs">
                    Region
                  </TabsTrigger>
                  <TabsTrigger value="cost" className="text-xs">
                    Budget
                  </TabsTrigger>
                  <TabsTrigger value="efficiency" className="text-xs">
                    Effizienz
                  </TabsTrigger>
                  <TabsTrigger value="area" className="text-xs">
                    Fläche
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

                <TabsContent value="area" className="mt-5 space-y-3">
                  <div className="text-sm space-y-1">
                    <p className="font-semibold text-foreground">Flächen-Fokus</p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Vergleicht dein Projekt anhand der Gesamtfläche mit Projekten ähnlicher Größenordnung.
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
                <CardHeader className="pb-4">
                  <div>
                    <CardTitle className="text-lg font-semibold">Benchmark Scatter Plot</CardTitle>
                    <CardDescription className="text-sm">
                      Vergleich: Gesamtpreis vs. Kosten/m² deines Projekts.
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {efficiencyStats && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                      <div className="rounded-md border border-border bg-muted/40 px-3 py-2 sm:col-span-1">
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

                      <div className="rounded-md border border-border bg-muted/40 px-3 py-2 sm:col-span-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Interpretation</p>
                        <p className="text-muted-foreground">
                          Ihr Projekt liegt im <span className="font-semibold">{efficiencyStats.percentile.toFixed(0)}. Perzentil</span> der Kosten/m² – Sie bauen damit effizienter als etwa <span className="font-semibold">{Math.max(0, 100 - Math.round(efficiencyStats.percentile))}%</span> der Vergleichsprojekte.
                        </p>
                      </div>
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
