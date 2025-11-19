'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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

type BenchmarkMode = 'location' | 'cost' | 'manual';

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

  const userProject = useMemo(() => {
    if (!totalCost || !floorArea) return null;
    return {
      id: 'user-project',
      name: projectName || 'Mein Projekt',
      category,
      city,
      country,
      totalCostMillion: parseFloat(totalCost),
      floorAreaSqm: parseFloat(floorArea),
      isUserProject: true,
    };
  }, [projectName, category, city, country, totalCost, floorArea]);

  const comparisonProjects = useMemo(() => {
    if (!userProject) return [];

    let filtered = [...MOCK_PROJECTS];

    if (benchmarkMode === 'location') {
      // Filter by location
      filtered = filtered.filter((p) => p.country === country);
      // Sort by cost similarity
      filtered.sort((a, b) => {
        const diffA = Math.abs(a.totalCostMillion - userProject.totalCostMillion);
        const diffB = Math.abs(b.totalCostMillion - userProject.totalCostMillion);
        return diffA - diffB;
      });
    } else if (benchmarkMode === 'cost') {
      // Sort by cost similarity (ignore location)
      filtered.sort((a, b) => {
        const diffA = Math.abs(a.totalCostMillion - userProject.totalCostMillion);
        const diffB = Math.abs(b.totalCostMillion - userProject.totalCostMillion);
        return diffA - diffB;
      });
    } else if (benchmarkMode === 'manual') {
      // Only show selected projects
      filtered = filtered.filter((p) => selectedProjects.includes(p.id));
      return filtered;
    }

    return filtered.slice(0, 6);
  }, [userProject, benchmarkMode, country, selectedProjects]);

  const chartData = useMemo(() => {
    if (!userProject) return [];
    return [userProject, ...comparisonProjects];
  }, [userProject, comparisonProjects]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-5xl font-bold text-foreground mb-3">Projekt-Benchmark</h1>
        <p className="text-lg text-muted-foreground max-w-none leading-relaxed">
          Vergleiche dein Bauprojekt mit ähnlichen Projekten und erkenne deine Position im Markt.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Input & Filters */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card 1: Your Project */}
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
                  placeholder="z.B. Neubau Bürocomplex"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="bg-card border-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Kategorie
                </label>
                <Select value={category} onValueChange={(v) => setCategory(v as ProjectCategory)}>
                  <SelectTrigger className="bg-card border-border">
                    <SelectValue />
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Stadt</label>
                  <Input
                    placeholder="z.B. Zürich"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="bg-card border-border"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Land</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-card border-border">
                      <SelectValue />
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

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Gesamtpreis (Mio. EUR/CHF)
                </label>
                <Input
                  type="number"
                  placeholder="z.B. 45.5"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  className="bg-card border-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Fläche (m²)
                </label>
                <Input
                  type="number"
                  placeholder="z.B. 25000"
                  value={floorArea}
                  onChange={(e) => setFloorArea(e.target.value)}
                  className="bg-card border-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Benchmark Mode */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Benchmark-Modus</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={benchmarkMode} onValueChange={(v) => setBenchmarkMode(v as BenchmarkMode)}>
                <TabsList className="grid w-full grid-cols-3 bg-muted/50 border border-border">
                  <TabsTrigger value="location" className="text-xs">
                    Region
                  </TabsTrigger>
                  <TabsTrigger value="cost" className="text-xs">
                    Budget
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

        {/* Right Column - Chart & Table */}
        <div className="lg:col-span-2 space-y-6">
          {userProject && (
            <>
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold">Benchmark Scatter Plot</CardTitle>
                  <CardDescription className="text-sm">
                    Vergleich: Gesamtpreis vs. Fläche deines Projekts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <BenchmarkChart data={chartData} userProjectId="user-project" />
                  <p className="text-xs text-muted-foreground">
                    Es werden die {Math.min(6, comparisonProjects.length)} Projekte mit den
                    ähnlichsten Gesamtkosten im gewählten Modus angezeigt.
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
          )}

          {!userProject && (
            <Card className="border-border border-dashed bg-muted/30">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground">
                  Gib die Eckdaten deines Projekts ein, um den Benchmark zu sehen.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
