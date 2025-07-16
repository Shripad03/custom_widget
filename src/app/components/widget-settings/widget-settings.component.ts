import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { Observable } from 'rxjs';
import { Widget, ChartSettings, TableSettings, TableColumn, TreeSettings } from '../../models/widget.model';
import { DataService } from '../../services/data.service';
import { SelectMetricsDialogComponent } from './components/select-metrics-dialog/select-metrics-dialog'; // Ensure this component exists or remove the import if not needed
// Uncomment and ensure the file exists if you need this component.

@Component({
  selector: 'app-widget-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTabsModule,
    MatFormFieldModule,
    MatRadioModule
  ],
  templateUrl: './widget-settings.component.html',
  styleUrls: ['./widget-settings.component.css'],
})
export class WidgetSettingsComponent implements OnInit {
  widget: Widget;

  chartSettings: ChartSettings = {
    chartType: 'line',
    title: '',
    showLegend: false,
    showDataLabels: true,
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
    categoryField: '',
    valueField: ''
  };

  tableSettings: TableSettings = {
    title: '',
    showHeader: true,
    showPagination: true,
    pageSize: 10,
    sortable: true,
    filterable: true,
    columns: []
  };

  treeSettings: TreeSettings = {
    title: '',
    showIcons: false,
    expandedByDefault: false,
    colors: ['#2b6cb0', '#2d3748']
  };

  chartTypes = [
    { value: 'pie', label: 'Pie Chart' },
    { value: 'bar', label: 'Bar Chart' },
    { value: 'line', label: 'Line Chart' },
    { value: 'column', label: 'Column Chart' },
    { value: 'doughnut', label: 'Doughnut Chart' }
  ];

  pageSizeOptions = [
    { value: 5, label: '5 rows' },
    { value: 10, label: '10 rows' },
    { value: 25, label: '25 rows' },
    { value: 50, label: '50 rows' }
  ];

  selectedDataSource: string = '';
  dataSources$: Observable<any>;
  dataSourceKeys: string[] = [];
  availableFields: string[] = [];
  numericFields: string[] = [];
  widgetTypeSelection: 'report' | 'metric' = 'report';

  constructor(
    public dialogRef: MatDialogRef<WidgetSettingsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { widget: Widget },
    private dataService: DataService,
    private dialog: MatDialog
  ) {
    this.widget = { ...data.widget };
    this.dataSources$ = this.dataService.getDataSources();
    this.initializeSettings();
  }

  ngOnInit(): void {
    this.dataSources$.subscribe(sources => {
      const keys = Object.keys(sources);
      this.dataSourceKeys = this.widget.type === 'tree'
        ? keys.filter(k => k === 'supervisor-tree')
        : keys.filter(k => k !== 'supervisor-tree');
    });

    if (this.widget.dataSource?.type === 'json' && typeof this.widget.dataSource.data === 'string') {
      this.selectedDataSource = this.widget.dataSource.data;
      this.onDataSourceChange();
    }
  }

  private initializeSettings(): void {
    this.chartSettings = {
      chartType: this.widget.config?.chart?.type || 'line',
      title: this.widget.config?.title?.text || this.widget.title,
      showLegend: this.widget.config?.legend?.enabled !== false,
      showDataLabels: this.widget.config?.plotOptions?.pie?.dataLabels?.enabled !== false,
      colors: this.widget.config?.colors || this.chartSettings.colors,
      categoryField: this.widget.config?.categoryField || '',
      valueField: this.widget.config?.valueField || ''
    };

    this.tableSettings = {
      title: this.widget.title,
      showHeader: this.widget.config?.showHeader !== false,
      showPagination: this.widget.config?.pagination !== false,
      pageSize: this.widget.config?.pageSize || 10,
      sortable: this.widget.config?.sorting !== false,
      filterable: this.widget.config?.filtering !== false,
      columns: this.widget.config?.columns || []
    };

    this.treeSettings = {
      title: this.widget.config?.title?.text || this.widget.title,
      showIcons: this.widget.config?.showIcons !== false,
      expandedByDefault: this.widget.config?.expandedByDefault === true,
      colors: this.widget.config?.colors || this.treeSettings.colors
    };

    // Initialize widget type selection from config or default to 'report'
    this.widgetTypeSelection = this.widget.config?.widgetType || 'report';
  }

  onDataSourceChange(): void {
    if (!this.selectedDataSource) return;

    this.dataService.getDataSource(this.selectedDataSource).subscribe(source => {
      if (!source?.data?.length) return;

      const firstItem = source.data[0];
      this.availableFields = Object.keys(firstItem);
      this.numericFields = this.availableFields.filter(f => typeof firstItem[f] === 'number');

      switch (this.widget.type) {
        case 'chart':
          this.chartSettings.categoryField = this.availableFields.find(f => typeof firstItem[f] === 'string') || this.availableFields[0];
          this.chartSettings.valueField = this.numericFields[0] || '';
          break;
        case 'table':
          this.tableSettings.columns = this.availableFields.map(field => ({
            field,
            header: this.formatFieldName(field),
            type: this.getFieldType(firstItem[field]),
            sortable: true,
            filterable: true,
            width: 'auto'
          }));
          break;
        case 'tree':
          this.treeSettings.title = source.name || this.widget.title;
          break;
      }
    });
  }

  // Utilities
  private formatFieldName(field: string): string {
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  }

  private getFieldType(value: any): 'text' | 'number' | 'date' | 'boolean' {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    return 'text';
  }

  getDataSourceName(key: string): string {
    let name = '';
    this.dataSources$.subscribe(sources => {
      name = sources[key]?.name || key;
    }).unsubscribe();
    return name;
  }

  getDataPreview(): string {
    let preview = '';
    this.dataService.getDataSource(this.selectedDataSource).subscribe(source => {
      if (source?.data) {
        preview = JSON.stringify(source.data.slice(0, 3), null, 2);
      }
    }).unsubscribe();
    return preview;
  }

  isColumnSelected(field: string): boolean {
    return this.tableSettings.columns.some(col => col.field === field);
  }

  toggleColumn(field: string, selected: boolean): void {
    if (selected) {
      if (!this.isColumnSelected(field)) {
        this.tableSettings.columns.push({
          field,
          header: this.formatFieldName(field),
          type: 'text',
          sortable: true,
          filterable: true,
          width: 'auto'
        });
      }
    } else {
      this.tableSettings.columns = this.tableSettings.columns.filter(col => col.field !== field);
    }
  }

  // Save & cancel
  onSave(): void {
    const updatedWidget: Widget = {
      ...this.widget,
      title: this.widget.title,
      dataSource: this.selectedDataSource ? { type: 'json', data: this.selectedDataSource } : this.widget.dataSource,
      config: this.buildConfig()
    };
    this.dialogRef.close(updatedWidget);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // Build configs based on type
  private buildConfig(): any {
    const baseConfig = {
      widgetType: this.widgetTypeSelection
    };

    switch (this.widget.type) {
      case 'chart': return { ...baseConfig, ...this.buildChartConfig() };
      case 'table': return { ...baseConfig, ...this.buildTableConfig() };
      case 'tree': return { ...baseConfig, ...this.buildTreeConfig() };
      default: return baseConfig;
    }
  }

  onWidgetTypeChange(value: 'report' | 'metric'): void {
    this.widgetTypeSelection = value;
    
    if (value === 'metric') {
      this.openMetricPopup();
    }
  }

  private openMetricPopup(): void {
    const dialogRef = this.dialog.open(MetricConfigDialogComponent, {
      width: '500px',
      maxWidth: '90vw',
      data: {
        widget: this.widget,
        currentConfig: this.widget.config?.metricConfig || {}
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle metric configuration result
        console.log('Metric configuration:', result);
      } else {
        // If user cancels, revert to report
        this.widgetTypeSelection = 'report';
      }
    });
  }

  private buildChartConfig(): any {
    return {
      chart: { type: this.chartSettings.chartType, height: 250 },
      title: { text: this.chartSettings.title, style: { fontSize: '16px', fontWeight: 'bold' } },
      legend: { enabled: this.chartSettings.showLegend, align: 'bottom', verticalAlign: 'bottom', layout: 'horizontal' },
      plotOptions: {
        [this.chartSettings.chartType]: {
          dataLabels: {
            enabled: this.chartSettings.showDataLabels,
            format: this.chartSettings.chartType === 'pie' ? '{point.name}: {point.percentage:.1f}%' : '{point.y}'
          },
          showInLegend: this.chartSettings.showLegend
        }
      },
      accessibility: {
        enabled: false
      },
      tooltip: {
        valueSuffix: '%',
        stickOnContact: true
      },
      colors: this.chartSettings.colors,
      categoryField: this.chartSettings.categoryField,
      valueField: this.chartSettings.valueField
    };
  }

  private buildTableConfig(): any {
    return {
      title: this.tableSettings.title,
      showHeader: this.tableSettings.showHeader,
      pagination: this.tableSettings.showPagination,
      pageSize: this.tableSettings.pageSize,
      sorting: this.tableSettings.sortable,
      filtering: this.tableSettings.filterable,
      columns: this.tableSettings.columns
    };
  }

  private buildTreeConfig(): TreeSettings {
    return {
      title: this.treeSettings.title,
      showIcons: this.treeSettings.showIcons,
      expandedByDefault: this.treeSettings.expandedByDefault,
      colors: this.treeSettings.colors
    };
  }
}

// Metric Configuration Dialog Component
@Component({
  selector: 'app-metric-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  template: `
    <div class="metric-dialog">
      <div class="dialog-header">
        <h2 class="dialog-title">Widget Settings</h2>
        <button mat-icon-button (click)="onCancel()" class="close-btn">
          <span class="material-icons">close</span>
        </button>
      </div>

      <div class="dialog-content">
        <!-- Display Name Section -->
        <div class="section">
          <label class="section-label">DISPLAY NAME</label>
          <mat-form-field appearance="outline" class="full-width">
            <input matInput [(ngModel)]="metricConfig.displayName" placeholder="Metric Breakdown">
          </mat-form-field>
          <div class="character-count">{{ getCharacterCount() }} characters remaining</div>
        </div>

        <!-- Metrics Section -->
        <div class="section">
          <label class="section-label">Metrics</label>
          <button class="select-metric-btn" (click)="openMetricSelector()">Select Metric</button>
        </div>

        <!-- View Section -->
        <div class="section">
          <label class="section-label">View</label>
          <label class="field-label">VIEW BY</label>
          <mat-form-field appearance="outline" class="full-width">
            <mat-select [(ngModel)]="metricConfig.viewBy">
              <mat-option value="agent">Agent</mat-option>
              <mat-option value="team">Team</mat-option>
              <mat-option value="campaign">Campaign</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Employee Groups Section -->
        <div class="section">
          <label class="section-label">Employee Groups</label>
          <div class="form-row">
            <div class="form-col">
              <label class="field-label">TEAM</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-select [(ngModel)]="metricConfig.team">
                  <mat-option value="99">99 selected</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <div class="form-col">
              <label class="field-label">AGENT</label>
              <mat-form-field appearance="outline" class="full-width">
                <mat-select [(ngModel)]="metricConfig.agent">
                  <mat-option value="3937">3937 selected</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>
        </div>

        <!-- Contact Groups Section -->
        <div class="section">
          <label class="section-label">Contact Groups</label>
          <label class="field-label">CAMPAIGN</label>
          <mat-form-field appearance="outline" class="full-width">
            <mat-select [(ngModel)]="metricConfig.campaign">
              <mat-option value="49">49 selected</mat-option>
            </mat-select>
          </mat-form-field>
          
          <label class="field-label">SKILL</label>
          <mat-form-field appearance="outline" class="full-width">
            <mat-select [(ngModel)]="metricConfig.skill">
              <mat-option value="5354">5354 selected</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Additional Filters Section -->
        <div class="section">
          <label class="section-label">Additional Filters</label>
          <label class="field-label">DATA ATTRIBUTES</label>
          <mat-form-field appearance="outline" class="full-width">
            <mat-select [(ngModel)]="metricConfig.dataAttributes">
              <mat-option value="">Select Items</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-button (click)="onCancel()" class="cancel-btn">Cancel</button>
        <button mat-raised-button color="primary" (click)="onSave()" class="save-btn">Save</button>
      </div>
    </div>
  `,
  styles: [`
    .metric-dialog {
      width: 500px;
      max-width: 95vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .dialog-title {
      color: #1e293b;
      font-weight: 600;
      font-size: 1.125rem;
      margin: 0;
    }

    .close-btn {
      color: #6b7280;
    }

    .dialog-content {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .field-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
      margin-bottom: 0.5rem;
      margin-top: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .field-label:first-of-type {
      margin-top: 0;
    }

    .character-count {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .select-metric-btn {
      background: none;
      border: none;
      color: #3b82f6;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }

    .select-metric-btn:hover {
      color: #2563eb;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-col {
      display: flex;
      flex-direction: column;
    }

    .full-width {
      width: 100%;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper .mat-mdc-form-field-input-control {
      padding: 12px 16px !important;
    }

    ::ng-deep .mat-mdc-select-value {
      padding: 12px 16px !important;
    }

    ::ng-deep .mat-mdc-select-panel {
      background: white !important;
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
      max-height: 300px !important;
      z-index: 9999 !important;
    }

    ::ng-deep .mat-mdc-option {
      background: white !important;
      color: #374151 !important;
      padding: 12px 16px !important;
      font-size: 14px !important;
      line-height: 1.4 !important;
      border-bottom: 1px solid #f1f5f9 !important;
    }

    ::ng-deep .mat-mdc-option:hover {
      background: #f8fafc !important;
      color: #1e293b !important;
    }

    ::ng-deep .mat-mdc-option.mdc-list-item--selected {
      background: #eff6ff !important;
      color: #3b82f6 !important;
    }

    ::ng-deep .mat-mdc-option:last-child {
      border-bottom: none !important;
    }

    ::ng-deep .mat-mdc-form-field-outline {
      color: #e2e8f0 !important;
    }

    ::ng-deep .mat-mdc-form-field-outline-thick {
      color: #3b82f6 !important;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    .cancel-btn {
      color: #6b7280;
    }

    .save-btn {
      background: #3b82f6;
      color: white;
    }

    .material-icons {
      font-family: 'Material Icons';
      font-size: 1.125rem;
    }

    @media (max-width: 768px) {
      .metric-dialog {
        width: 100vw;
        max-width: 100vw;
        height: 100vh;
        max-height: 100vh;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MetricConfigDialogComponent {
  metricConfig = {
    displayName: 'Metric Breakdown',
    viewBy: 'agent',
    team: '99',
    agent: '3937',
    campaign: '49',
    skill: '5354',
    dataAttributes: ''
  };

  constructor(
    public dialogRef: MatDialogRef<MetricConfigDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    // Initialize with existing config if available
    if (data.currentConfig) {
      this.metricConfig = { ...this.metricConfig, ...data.currentConfig };
    }
  }

  getCharacterCount(): number {
    const maxLength = 50;
    const currentLength = this.metricConfig.displayName.length;
    return maxLength - currentLength;
  }

  openMetricSelector(): void {
      const dialogRef = this.dialog.open(SelectMetricsDialogComponent, {
    width: '900px',
    height: '700px',
    data: { /* pass any data if needed */ }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // Handle selected metrics here
      console.log('Selected metrics:', result);
    }
  });
  }

  onSave(): void {
    this.dialogRef.close(this.metricConfig);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}