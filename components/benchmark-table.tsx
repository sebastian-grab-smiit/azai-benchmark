'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BenchmarkProject, ProjectCategory } from '@/lib/mock-data';

interface BenchmarkTableProps {
  projects: BenchmarkProject[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

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

export function BenchmarkTable({
  projects,
  selectedIds,
  onSelectionChange,
}: BenchmarkTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  const countries = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.country))).sort();
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch =
        searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
      const matchesCountry = countryFilter === 'all' || p.country === countryFilter;
      return matchesSearch && matchesCategory && matchesCountry;
    });
  }, [projects, searchTerm, categoryFilter, countryFilter]);

  const toggleSelection = (id: string, isChecked: boolean) => {
    if (isChecked) {
      if (selectedIds.length < 6) {
        onSelectionChange([...selectedIds, id]);
      }
    } else {
      onSelectionChange(selectedIds.filter((pid) => pid !== id));
    }
  };

  const handleHeaderCheckboxChange = (isChecked: boolean) => {
    if (isChecked) {
      const newIds = [
        ...selectedIds,
        ...filteredProjects.filter((p) => !selectedIds.includes(p.id)).slice(0, 6 - selectedIds.length).map((p) => p.id),
      ];
      onSelectionChange(newIds.slice(0, 6));
    } else {
      const filteredIds = selectedIds.filter(
        (id) => !filteredProjects.some((p) => p.id === id)
      );
      onSelectionChange(filteredIds);
    }
  };

  const allFilteredSelected =
    filteredProjects.length > 0 &&
    filteredProjects.every((p) => selectedIds.includes(p.id));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Projektname</label>
          <Input
            placeholder="Suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-card border-border"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Kategorie</label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Kategorien</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Land</label>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Länder</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={handleHeaderCheckboxChange}
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Projektname</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Kategorie</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Location</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Fläche (m²)</th>
              <th className="px-4 py-3 text-right font-semibold text-foreground">Kosten (Mio.)</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  <Checkbox
                    checked={selectedIds.includes(project.id)}
                    onCheckedChange={(isChecked) => toggleSelection(project.id, isChecked as boolean)}
                    disabled={selectedIds.length >= 6 && !selectedIds.includes(project.id)}
                  />
                </td>
                <td className="px-4 py-3 text-foreground font-medium">{project.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{project.category}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {project.city}, {project.country}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  {project.floorAreaSqm.toLocaleString('de-CH')}
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground font-medium">
                  {project.totalCostMillion.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground font-medium">
        {selectedIds.length}/6 Projekte ausgewählt
      </p>
    </div>
  );
}
