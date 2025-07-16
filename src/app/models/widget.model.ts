export interface Widget {
  id: string;
  type: 'table' | 'chart' | 'tree' |'import';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data?: any;
  config?: any;
  dataSource?: DataSource;

}

export interface WidgetTemplate {
  id: string;
  type: 'table' | 'chart' | 'tree' | 'import';
  title: string;
  icon: string;
  description: string;
  defaultDataSource?: string; 
  imagePath?: string; // Optional path for widget image
}

export interface WidgetHelper {
  id: string;
  name: string;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSource {
  type: 'json' | 'api' | 'static';
  url?: string;
  data?: any;
  refreshInterval?: number;
}

export interface ChartSettings {
  chartType: 'pie' | 'bar' | 'line' | 'column' | 'doughnut';
  title: string;
  showLegend: boolean;
  showDataLabels: boolean;
  colors: string[];
  xAxisField?: string;
  yAxisField?: string;
  categoryField?: string;
  valueField?: string;
}

export interface TableSettings {
  title: string;
  showHeader: boolean;
  showPagination: boolean;
  pageSize: number;
  sortable: boolean;
  filterable: boolean;
  columns: TableColumn[];
}

export interface TableColumn {
  field: string;
  header: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  sortable: boolean;
  filterable: boolean;
  width?: string;
}
export interface TreeSettings {
  title: string;
  showIcons: boolean;
  expandedByDefault: boolean;
  colors?: string[];
}
export interface ImportSettings {
  title: string;
  showIcons: boolean;
  expandedByDefault: boolean;
  colors?: string[];
}