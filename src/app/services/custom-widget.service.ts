import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Widget, WidgetHelper, WidgetTemplate } from '../models/widget.model';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class CustomWidgetService {
  private widgetsSubject = new BehaviorSubject<WidgetHelper[]>([]);
  private currentWidgetSubject = new BehaviorSubject<WidgetHelper | null>(null);
  private widgetTemplatesSubject = new BehaviorSubject<WidgetTemplate[]>([
    {
      id: 'table-template',
      type: 'table',
      title: 'Table',
      icon: 'table_chart',
      description: 'Interactive data grid with sorting and pagination',
      imagePath: 'assets/img/table.svg'
    },
    {
      id: 'chart-template',
      type: 'chart',
      title: 'Chart',
      icon: 'pie_chart',
      description: 'Customizable data visualization charts',
      imagePath: 'assets/img/chart.svg'
    },
    {
      id: 'supervisor-tree',
      type: 'tree',
      title: 'Tree',
      icon: 'account_tree',
      description: 'Displays the hierarchy of supervisors and agents',
      imagePath: 'assets/img/tree.svg'
    },
    {
      id: 'import-widget',
      type: 'import',
      title: 'Import',
      icon: 'cloud_upload',
      description: 'Import CSV or Excel as JSON',
      imagePath: 'assets/img/import.svg'
    }
  ]);

  customWidgets$ = this.widgetsSubject.asObservable();
  currentCustomWidget$ = this.currentWidgetSubject.asObservable();
  widgetTemplates$ = this.widgetTemplatesSubject.asObservable();

  constructor(private dataService: DataService) {
    this.loadCustomWidgets();
  }

  /** Load custom widgets from localStorage or create a default one */
  private loadCustomWidgets(): void {
    const savedCustomWidgets = localStorage.getItem('customWidgets');
    if (savedCustomWidgets) {
      const customWidgets = JSON.parse(savedCustomWidgets);
      this.widgetsSubject.next(customWidgets);
      if (customWidgets.length > 0) {
        this.currentWidgetSubject.next(customWidgets[0]);
      }
    } else {
      this.createDefaultCustomWidget();
    }
  }

  private createDefaultCustomWidget(): void {
    const defaultCustomWidget: WidgetHelper = {
      id: 'default-custom-widget',
      name: 'My Custom Widget',
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.widgetsSubject.next([defaultCustomWidget]);
    this.currentWidgetSubject.next(defaultCustomWidget);
    this.saveCustomWidget();
  }

  private saveCustomWidget(): void {
    localStorage.setItem('customWidgets', JSON.stringify(this.widgetsSubject.value));
  }

  /** Public methods **/

  selectCustomWidget(customWidget: WidgetHelper): void {
    this.currentWidgetSubject.next(customWidget);
  }

  addWidget(widgetTemplate: WidgetTemplate): void {
    const currentCustomWidget = this.currentWidgetSubject.value;
    if (!currentCustomWidget) return;

    console.log('Adding widget from template:', widgetTemplate);

    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: widgetTemplate.type,
      title: widgetTemplate.title,
      position: { x: 0, y: 0 },
      size: { width: 360, height: 350 },
      data: null,
      config: null,
      dataSource: {
        type: 'json',
        data: widgetTemplate['defaultDataSource'] // fallback if defined
      }
    };

    console.log('Created new widget:', newWidget);

    const updatedCustomWidget = {
      ...currentCustomWidget,
      widgets: [...currentCustomWidget.widgets, newWidget],
      updatedAt: new Date()
    };

    this.updateCustomWidget(updatedCustomWidget);
  }

  updateWidget(widgetId: string, updates: Partial<Widget>): void {
    const currentCustomWidget = this.currentWidgetSubject.value;
    if (!currentCustomWidget) return;

    const updatedWidgets = currentCustomWidget.widgets.map(w =>
      w.id === widgetId ? { ...w, ...updates } : w
    );

    const updatedCustomWidget = {
      ...currentCustomWidget,
      widgets: updatedWidgets,
      updatedAt: new Date()
    };

    this.updateCustomWidget(updatedCustomWidget);
  }

  removeWidget(widgetId: string): void {
    const currentCustomWidget = this.currentWidgetSubject.value;
    if (!currentCustomWidget) return;

    const updatedCustomWidget = {
      ...currentCustomWidget,
      widgets: currentCustomWidget.widgets.filter(w => w.id !== widgetId),
      updatedAt: new Date()
    };

    this.updateCustomWidget(updatedCustomWidget);
  }

  /** Helpers **/

  private updateCustomWidget(updatedCustomWidget: WidgetHelper): void {
    this.currentWidgetSubject.next(updatedCustomWidget);
    this.updateCustomWidgetInList(updatedCustomWidget);
    this.saveCustomWidget();
  }

  private updateCustomWidgetInList(customWidget: WidgetHelper): void {
    const customWidgets = this.widgetsSubject.value.map(d =>
      d.id === customWidget.id ? customWidget : d
    );
    this.widgetsSubject.next(customWidgets);
  }

  /** Default data & config (optional fallback, not currently used directly) **/

  private getDefaultWidgetData(type: 'table' | 'chart'): any {
    switch (type) {
      case 'table':
        return {
          columns: ['Name', 'Email', 'Role', 'Status'],
          rows: [
            ['John Doe', 'john@example.com', 'Admin', 'Active'],
            ['Jane Smith', 'jane@example.com', 'User', 'Active'],
            ['Bob Johnson', 'bob@example.com', 'User', 'Inactive']
          ]
        };
      case 'chart':
        return {
          series: [{
            name: 'Sample Data',
            data: [
              { name: 'Category A', y: 35 },
              { name: 'Category B', y: 25 },
              { name: 'Category C', y: 20 },
              { name: 'Category D', y: 20 }
            ]
          }]
        };
      default:
        return {};
    }
  }

  private getDefaultWidgetConfig(type: 'table' | 'chart'): any {
    switch (type) {
      case 'table':
        return {
          showHeader: true,
          pagination: true,
          pageSize: 10,
          sorting: true,
          filtering: true
        };
      case 'chart':
        return {
          chart: {
            type: 'pie',
            height: null,
            width: null
          },
          title: {
            text: 'Sample Chart',
            style: { fontSize: '16px', fontWeight: 'bold' }
          },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: 'pointer',
              dataLabels: {
                enabled: true,
                format: '{point.name}: {point.percentage:.1f}%'
              },
              showInLegend: false
            }
          },
          legend: {
            align: 'bottom',
            verticalAlign: 'bottom',
            layout: 'horizontal',
            maxHeight: 60,
            itemStyle: { fontSize: '11px', fontWeight: 'normal' }
          },
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        };
      default:
        return {};
    }
  }
}
