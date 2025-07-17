// filepath: c:\Users\shreepada\Saved Games\Personal Repos\custom_widget_sparkathon\custom_widget\src\app\components\select-metrics-dialog\select-metrics-dialog.component.ts
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatLineModule } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-select-metrics-dialog',
  templateUrl: './select-metrics-dialog.html',
  styleUrls: ['./select-metrics-dialog.css'],
  imports: [CommonModule, MatDialogModule, MatCheckboxModule, MatButtonModule, MatLineModule, MatInputModule, FormsModule, MatListModule]
})
export class SelectMetricsDialogComponent {
  categories = ['0z', 'ACD', 'AGENT CALL DETAILS', 'CALL DETAILS', 'CALLING', 'Coaching', 'Custom', 'Deprecated'];
  metrics = [
    { name: 'QA Test', category: '0z', selected: false },
    { name: 'QA Test 11', category: '0z', selected: false },
    { name: 'Agent ACW Time', category: 'AGENT CALL DETAILS', selected: false },
    // ...add more metrics as needed
  ];
  searchText = '';
  selectedCategory = this.categories[0];

  constructor(
    public dialogRef: MatDialogRef<SelectMetricsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  get selectedMetrics() {
    return this.metrics.filter(m => m.selected);
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
  }

  filteredMetrics() {
    return this.metrics.filter(m =>
      m.category === this.selectedCategory &&
      (!this.searchText || m.name.toLowerCase().includes(this.searchText.toLowerCase()))
    );
  }

  onMetricSelect(metric: any) {
    // Only allow one selection
    if (metric.selected) {
      this.metrics.forEach(m => {
        if (m !== metric) m.selected = false;
      });
    }
  }

  clearAll() {
    this.metrics.forEach(m => m.selected = false);
  }

  confirmSelection() {
    this.dialogRef.close(this.selectedMetrics);
  }
}