import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CdkTreeModule } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';
import { Subscription } from 'rxjs';
import * as Highcharts from 'highcharts';
import * as XLSX from 'xlsx'; // npm install xlsx
import { Widget } from '../../models/widget.model';
import { CustomWidgetService } from '../../services/custom-widget.service';
import { DataService } from '../../services/data.service';
import { WidgetSettingsComponent } from '../widget-settings/widget-settings.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import html2canvas from 'html2canvas';
import { WidgetFullscreenDialogComponent } from '../widget-fullscreen-dialog/widget-fullscreen-dialog.component';

interface TreeNode {
  name: string;
  role: string;
  children?: TreeNode[];
}

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule, HighchartsChartModule, CdkTreeModule, MatIconModule, MatDialogModule],
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.css'],
})
export class WidgetComponent implements OnInit, OnDestroy {

  /*** ────── Inputs & state ────── ***/
  @Input() widget!: Widget;
  @Input() allWidgets: Widget[] = [];

  highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options | null = null;
  isLoading = false;
  subscriptions: Subscription[] = [];

  /*** ────── Tree properties ────── ***/
  TREE_DATA: TreeNode[] = [];
  expandedNodes = new Set<TreeNode>();

  /*** ────── Table properties ────── ***/
  tableData: any[] = [];
  displayColumns: any[] = [];
  showHeader = true;
  showPagination = true;
  pageSize = 10;
  currentPage = 0;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  /*** ────── Resize properties ────── ***/
  private isResizing = false;
  private resizeDirection = '';
  private startX = 0;
  private startY = 0;
  private startWidth = 0;
  private startHeight = 0;
  public importedData: any[] = [];
  /*** ────── Lifecycle ────── ***/
  constructor(
    private customWidgetService: CustomWidgetService,
    private dataService: DataService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {

    this.loadWidgetData();
    this.setupResizeListeners();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.removeResizeListeners();
  }

  /*** ────── Tree methods ────── ***/
  isExpanded(node: TreeNode): boolean {
    return this.expandedNodes.has(node);
  }

  toggleNode(node: TreeNode): void {
    this.expandedNodes.has(node) ? this.expandedNodes.delete(node) : this.expandedNodes.add(node);
  }

  hasChild(_: number, node: TreeNode): boolean {
    return !!node.children?.length;
  }

  getChildren = (node: TreeNode) => node.children ?? [];

  /*** ────── Data loading & processing ────── ***/
  private loadWidgetData(): void {
    this.isLoading = true;
    setTimeout(() => {
      if (this.widget.dataSource) {
        if (this.widget.dataSource.type === 'json') {
          if (typeof this.widget.dataSource.data === 'string') {
            const sub = this.dataService.getDataSource(this.widget.dataSource.data).subscribe(source => {
              if (source?.data) this.processData(source.data);
              this.isLoading = false;
            });
            this.subscriptions.push(sub);
          } else {
            this.processData(this.widget.dataSource.data);
            this.isLoading = false;
          }
        }
      } else {
        this.processData(this.widget.data);
        this.isLoading = false;
      }
    }, 800);
  }

  private processData(data: any): void {
    switch (this.widget.type) {
      case 'table': this.setupTableData(data); break;
      case 'chart': this.setupChartData(data); break;
      case 'tree': this.setupTreeData(data); break;
    }
  }

  /*** ────── Tree data ────── ***/
  private setupTreeData(data: any): void {
    this.TREE_DATA = Array.isArray(data) ? data : [];
  }

  /*** ────── Table data ────── ***/
  private setupTableData(data: any): void {
    if (Array.isArray(data)) {
      this.tableData = data;
      this.displayColumns = this.widget.config?.columns?.length
        ? this.widget.config.columns
        : this.inferColumns(data[0]);

      this.showHeader = this.widget.config?.showHeader !== false;
      this.showPagination = this.widget.config?.pagination !== false;
      this.pageSize = this.widget.config?.pageSize || 10;

    } else if (data?.columns && data?.rows) {
      this.displayColumns = data.columns.map((col: string, i: number) => ({
        field: `col_${i}`,
        header: col, type: 'text', sortable: true, filterable: true, width: 'auto'
      }));

      this.tableData = data.rows.map((row: any[]) =>
        row.reduce((obj, cell, i) => ({ ...obj, [`col_${i}`]: cell }), {})
      );
    }
  }

  private inferColumns(item: any): any[] {
    return Object.keys(item).map(key => ({
      field: key,
      header: this.formatFieldName(key),
      type: this.getFieldType(item[key]),
      sortable: true, filterable: true, width: 'auto'
    }));
  }

  /*** ────── Chart data ────── ***/
  private setupChartData(data: any): void {
    if (!data) return;

    const config = this.widget.config || {};
    const baseChart = {
      ...config.chart, width: null, height: null
    };

    const legendStyle = {
      ...config.legend,
      maxHeight: 60,
      itemStyle: { fontSize: '11px', fontWeight: 'normal' }
    };

    if (Array.isArray(data) && config.categoryField && config.valueField) {
      const seriesData = data.map(item => ({ name: item[config.categoryField], y: item[config.valueField] }));
      this.chartOptions = { ...config, chart: baseChart, series: [{ name: config.title?.text || 'Data', data: seriesData }], credits: { enabled: false }, legend: legendStyle };
    }
    else if (data.series) {
      this.chartOptions = { ...config, chart: baseChart, series: data.series, credits: { enabled: false }, legend: legendStyle };
    }
    else {
      this.chartOptions = { ...config, chart: baseChart, series: this.widget.data?.series || [], credits: { enabled: false }, legend: legendStyle };
    }
  }

  /*** ────── Resize methods ────── ***/
  startResize(event: MouseEvent, direction: string): void {
    event.preventDefault();
    event.stopPropagation()
    this.isResizing = true;
    this.resizeDirection = direction;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startWidth = this.widget.size.width;
    this.startHeight = this.widget.size.height;

    document.body.style.cursor = `${direction}-resize`;
    document.body.style.userSelect = 'none';
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const dropZone = document.querySelector('#workspace-drop-zone') as HTMLElement;
    const widgetElement = document.querySelector(`#widget-${this.widget.id}`) as HTMLElement;
    if (!dropZone || !widgetElement) return;

    const dropRect = dropZone.getBoundingClientRect();
    const widgetRect = widgetElement.getBoundingClientRect();
    const padding = 1.5 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);
    const minWidth = 300;
    const minHeight = 200;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;

    // Compute widget's position relative to drop zone
    const widgetLeft = widgetRect.left - dropRect.left;
    const widgetTop = widgetRect.top - dropRect.top;

    // Start with new width/height based on mouse movement
    let newWidth = this.startWidth + (this.resizeDirection.includes('e') ? deltaX : 0);
    let newHeight = this.startHeight + (this.resizeDirection.includes('s') ? deltaY : 0);

    // Limit to drop zone boundaries
    const maxWidth = dropRect.width - widgetLeft - padding;
    const maxHeight = dropRect.height - widgetTop - padding;
    newWidth = Math.min(newWidth, maxWidth);
    newHeight = Math.min(newHeight, maxHeight);

    // Check collisions against all other widgets using live DOM positions
    for (const otherWidget of this.allWidgets) {
      if (otherWidget.id === this.widget.id) continue;

      const otherElement = document.querySelector(`#widget-${otherWidget.id}`) as HTMLElement;
      if (!otherElement) continue;

      const otherRect = otherElement.getBoundingClientRect();

      // Other widget's position relative to drop zone
      const otherLeft = otherRect.left - dropRect.left;
      const otherTop = otherRect.top - dropRect.top;
      const otherRight = otherLeft + otherRect.width;
      const otherBottom = otherTop + otherRect.height;

      // Future edges after resize
      const futureRight = widgetLeft + newWidth;
      const futureBottom = widgetTop + newHeight;

      // Check vertical overlap for east resize
      const verticalOverlap = !(widgetTop + this.startHeight <= otherTop || widgetTop >= otherBottom);
      if (this.resizeDirection.includes('e') && verticalOverlap) {
        if (futureRight > otherLeft - padding && widgetLeft < otherLeft) {
          newWidth = otherLeft - padding - widgetLeft;
        }
      }

      // Check horizontal overlap for south resize
      const horizontalOverlap = !(widgetLeft + this.startWidth <= otherLeft || widgetLeft >= otherRight);
      if (this.resizeDirection.includes('s') && horizontalOverlap) {
        if (futureBottom > otherTop - padding && widgetTop < otherTop) {
          newHeight = otherTop - padding - widgetTop;
        }
      }
    }

    // Enforce minimum sizes
    newWidth = Math.max(minWidth, newWidth);
    newHeight = Math.max(minHeight, newHeight);

    // Update widget data
    this.widget.size = { width: newWidth, height: newHeight };

    // Force chart redraw if needed
    if (this.widget.type === 'chart' && this.chartOptions) {
      setTimeout(() => {
        this.chartOptions = { ...this.chartOptions };
      }, 0);
    }
  }


  private onMouseUp(): void {
    if (this.isResizing) {
      this.isResizing = false;
      this.resizeDirection = '';
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      this.customWidgetService.updateWidget(this.widget.id, { size: this.widget.size });
    }
  }


  private setupResizeListeners(): void {
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
  }

  private removeResizeListeners(): void {
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  /*** ────── Utility & formatting ────── ***/
  getChartWidth(): number {
    return this.widget.size.width - 34; // Account for padding
  }

  getChartHeight(): number {
    return this.widget.size.height - 120; // Account for header and padding
  }
  private formatFieldName(field: string): string {
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
  }

  private getFieldType(value: any): 'text' | 'number' | 'date' | 'boolean' {
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(value)) return 'date';
    return 'text';
  }

  formatCellValue(value: any, type: string): string {
    if (value == null) return '';
    if (type === 'number') return typeof value === 'number' ? value.toLocaleString() : value;
    if (type === 'date') return new Date(value).toLocaleDateString();
    if (type === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  }

  /*** ────── Sorting & pagination ────── ***/
  get paginatedData(): any[] {
    return this.showPagination
      ? this.tableData.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize)
      : this.tableData;
  }

  getStartIndex(): number {
    return this.currentPage * this.pageSize;
  }

  getEndIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.tableData.length);
  }

  getTotalPages(): number {
    return Math.ceil(this.tableData.length / this.pageSize);
  }

  nextPage(): void { if (this.currentPage < this.getTotalPages() - 1) this.currentPage++; }
  previousPage(): void { if (this.currentPage > 0) this.currentPage--; }

  sortTable(field: string): void {
    const column = this.displayColumns.find(col => col.field === field);
    if (!column?.sortable) return;

    this.sortDirection = this.sortField === field && this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortField = field;

    this.tableData.sort((a, b) => {
      const comp = a[field] < b[field] ? -1 : 1;
      return this.sortDirection === 'asc' ? comp : -comp;
    });
    this.currentPage = 0;
  }

  /*** ────── Widget actions ────── ***/
  refreshData(): void { this.loadWidgetData(); }

  editWidget(): void {
    const dialogRef = this.dialog.open(WidgetSettingsComponent, {
      width: '600px', maxWidth: '90vw', data: { widget: this.widget }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customWidgetService.updateWidget(this.widget.id, result);
        this.widget = { ...this.widget, ...result };
        this.loadWidgetData();
      }
    });
  }

  deleteWidget(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Widget',
        message: 'Are you sure you want to delete this widget?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.customWidgetService.removeWidget(this.widget.id);
      }
    });
  }

  handleFileImport(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length) {
      const file = target.files[0];
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

        this.importedData = json.slice(0, 5); // Show preview
        this.saveDataToJsonFile(json); // save to data.json
      };

      reader.readAsArrayBuffer(file);
    }
  }

  saveDataToJsonFile(data: any[]): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  exportTableToCSV(): void {
    if (!this.tableData || this.tableData.length === 0) return;

    const headers = this.displayColumns.map(col => col.header);
    const rows = this.tableData.map(row =>
      this.displayColumns.map(col => {
        const cell = row[col.field];
        return typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell;
      }).join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.widget.title || 'table-data'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  exportChartAsPNG(): void {
    const element = document.getElementById(`chart-container-${this.widget.id}`);
    if (!element) {
      console.error('Chart container not found!');
      return;
    }

    html2canvas(element, { backgroundColor: null }).then(canvas => {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = this.widget.title ? `${this.widget.title}.png` : 'chart.png';
      link.click();
    }).catch(error => {
      console.error('Error exporting chart as PNG:', error);
    });
  }

  openWidgetFullscreen() {
    console.log('Opening dialog with:', {
      widget: this.widget,
      tableData: this.tableData,
      chartOptions: this.chartOptions,
      TREE_DATA: this.TREE_DATA,
      importedData: this.importedData,
      highcharts: this.highcharts
    });
    this.dialog.open(WidgetFullscreenDialogComponent, {
      width: '90vw',    // 90% of viewport width
      height: '90vh',   // 90% of viewport height
      maxWidth: '90vw',
      panelClass: 'fullscreen-dialog-panel',
      data: {
        widget: this.widget,
        tableData: this.tableData,
        chartOptions: this.chartOptions,
        TREE_DATA: this.TREE_DATA,
        importedData: this.importedData,
        displayColumns: this.displayColumns,
        sortField: this.sortField,
        sortDirection: this.sortDirection,
        showHeader: this.showHeader,
        showPagination: this.showPagination,
        currentPage: this.currentPage,
        highcharts: this.highcharts
      }
    });
  }
}
