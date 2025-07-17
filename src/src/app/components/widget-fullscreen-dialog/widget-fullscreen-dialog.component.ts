import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { HighchartsChartModule } from 'highcharts-angular';

@Component({
    selector: 'app-widget-fullscreen-dialog',
    standalone: true,
    imports: [CommonModule, HighchartsChartModule, MatIcon, CdkTreeModule],
    templateUrl: './widget-fullscreen-dialog.component.html',
    styleUrls: ['./widget-fullscreen-dialog.component.css']
})
export class WidgetFullscreenDialogComponent {
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        public dialogRef: MatDialogRef<WidgetFullscreenDialogComponent>
        ) { }

    closeDialog() {
        this.dialogRef.close();
    }
    formatCellValue(value: any, type: string): any {
        return value;
    }

    getChildren = (node: any) => node.children || [];
    hasChild = (_: number, node: any) => !!node.children && node.children.length > 0;
    isExpanded = (node: any) => !!node.expanded;
    toggleNode(node: any) { node.expanded = !node.expanded; }
}
