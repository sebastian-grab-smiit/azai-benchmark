export type ProjectCategory =
  | 'Flughafen'
  | 'Stadion'
  | 'Bürogebäude'
  | 'Wohnhaus'
  | 'Krankenhaus'
  | 'Logistikzentrum'
  | 'Schule'
  | 'Sonstiges';

export interface BenchmarkProject {
  id: string;
  name: string;
  category: ProjectCategory;
  city: string;
  country: string;
  totalCostMillion: number;
  floorAreaSqm: number;
}

export const MOCK_PROJECTS: BenchmarkProject[] = [
  {
    id: '1',
    name: 'Flughafen Zürich Terminal 3',
    category: 'Flughafen',
    city: 'Zürich',
    country: 'Schweiz',
    totalCostMillion: 850,
    floorAreaSqm: 125000,
  },
  {
    id: '2',
    name: 'Stadion Bern',
    category: 'Stadion',
    city: 'Bern',
    country: 'Schweiz',
    totalCostMillion: 250,
    floorAreaSqm: 45000,
  },
  {
    id: '3',
    name: 'Bürokomplex Prime Tower',
    category: 'Bürogebäude',
    city: 'Zürich',
    country: 'Schweiz',
    totalCostMillion: 480,
    floorAreaSqm: 85000,
  },
  {
    id: '4',
    name: 'Wohnprojekt Europaallee',
    category: 'Wohnhaus',
    city: 'Zürich',
    country: 'Schweiz',
    totalCostMillion: 320,
    floorAreaSqm: 42000,
  },
  {
    id: '5',
    name: 'Spital Universitätsspital Basel',
    category: 'Krankenhaus',
    city: 'Basel',
    country: 'Schweiz',
    totalCostMillion: 750,
    floorAreaSqm: 150000,
  },
  {
    id: '6',
    name: 'Logistikzentrum Frenkendorf',
    category: 'Logistikzentrum',
    city: 'Frenkendorf',
    country: 'Schweiz',
    totalCostMillion: 180,
    floorAreaSqm: 95000,
  },
  {
    id: '7',
    name: 'Schulkomplex Bern-West',
    category: 'Schule',
    city: 'Bern',
    country: 'Schweiz',
    totalCostMillion: 95,
    floorAreaSqm: 28000,
  },
  {
    id: '8',
    name: 'Flughafen München Terminal 2',
    category: 'Flughafen',
    city: 'München',
    country: 'Deutschland',
    totalCostMillion: 920,
    floorAreaSqm: 148000,
  },
  {
    id: '9',
    name: 'Bürozentrum Frankfurt',
    category: 'Bürogebäude',
    city: 'Frankfurt',
    country: 'Deutschland',
    totalCostMillion: 520,
    floorAreaSqm: 92000,
  },
  {
    id: '10',
    name: 'Allianz Arena München',
    category: 'Stadion',
    city: 'München',
    country: 'Deutschland',
    totalCostMillion: 340,
    floorAreaSqm: 75000,
  },
  {
    id: '11',
    name: 'Wohnquartier Berlin-Mitte',
    category: 'Wohnhaus',
    city: 'Berlin',
    country: 'Deutschland',
    totalCostMillion: 420,
    floorAreaSqm: 58000,
  },
  {
    id: '12',
    name: 'Uniklinik Heidelberg',
    category: 'Krankenhaus',
    city: 'Heidelberg',
    country: 'Deutschland',
    totalCostMillion: 680,
    floorAreaSqm: 140000,
  },
  {
    id: '13',
    name: 'Logistik Hub Köln',
    category: 'Logistikzentrum',
    city: 'Köln',
    country: 'Deutschland',
    totalCostMillion: 220,
    floorAreaSqm: 120000,
  },
  {
    id: '14',
    name: 'Ecole Polytechnique Paris',
    category: 'Schule',
    city: 'Paris',
    country: 'Frankreich',
    totalCostMillion: 280,
    floorAreaSqm: 55000,
  },
  {
    id: '15',
    name: 'Flughafen Paris CDG Terminal 4',
    category: 'Flughafen',
    city: 'Paris',
    country: 'Frankreich',
    totalCostMillion: 1100,
    floorAreaSqm: 165000,
  },
  {
    id: '16',
    name: 'Stade de France Paris',
    category: 'Stadion',
    city: 'Paris',
    country: 'Frankreich',
    totalCostMillion: 290,
    floorAreaSqm: 82000,
  },
  {
    id: '17',
    name: 'La Défense Office Complex',
    category: 'Bürogebäude',
    city: 'Paris',
    country: 'Frankreich',
    totalCostMillion: 610,
    floorAreaSqm: 110000,
  },
  {
    id: '18',
    name: 'Hôpital Necker Paris',
    category: 'Krankenhaus',
    city: 'Paris',
    country: 'Frankreich',
    totalCostMillion: 820,
    floorAreaSqm: 175000,
  },
  {
    id: '19',
    name: 'Logistik Center Lyon',
    category: 'Logistikzentrum',
    city: 'Lyon',
    country: 'Frankreich',
    totalCostMillion: 195,
    floorAreaSqm: 110000,
  },
  {
    id: '20',
    name: 'Stephansdom Restaurierung Wien',
    category: 'Sonstiges',
    city: 'Wien',
    country: 'Österreich',
    totalCostMillion: 75,
    floorAreaSqm: 12000,
  },
];
