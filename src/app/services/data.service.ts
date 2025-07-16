import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
interface CustomWidgetDataResponse {
  dataSources: { [key: string]: any };
}
@Injectable({
  providedIn: 'root'
})
export class DataService {
  private dataSources = new BehaviorSubject<any>({});
  private dataLoaded = false;

  constructor(private http: HttpClient) {
    this.loadDataFromJson();
  }

  /** Load data from JSON file **/
  private loadDataFromJson(): void {
    if (this.dataLoaded) return;

    this.http.get<CustomWidgetDataResponse>('/assets/data/custom-widget-data.json').pipe(
      catchError(error => {
        console.warn('Could not load custom-widget-data.json:', error);
        // Return empty dataSources object instead of fallback data
        return of({ dataSources: {} });
      })
    ).subscribe(data => {
      if (data && data.dataSources) {
        this.dataSources.next(data.dataSources);
      } else {
        this.initializeEmptyData();
      }
      this.dataLoaded = true;
    });
  }

  private initializeEmptyData(): void {
    this.dataSources.next({});
  }

  /** CRUD operations **/

  getDataSources(): Observable<any> {
    return this.dataSources.asObservable();
  }

  getDataSource(id: string): Observable<any> {
    return this.dataSources.pipe(
      map(sources => sources[id] || null)
    );
  }

  addDataSource(id: string, name: string, data: any, description?: string): void {
    const updated = { ...this.dataSources.value };
    updated[id] = {
      name,
      data,
      description: description || `Custom data source: ${name}`,
      createdAt: new Date().toISOString()
    };
    this.dataSources.next(updated);
  }

  updateDataSource(id: string, data: any): void {
    const updated = { ...this.dataSources.value };
    if (updated[id]) {
      updated[id] = {
        ...updated[id],
        data,
        updatedAt: new Date().toISOString()
      };
      this.dataSources.next(updated);
    }
  }

  deleteDataSource(id: string): void {
    const updated = { ...this.dataSources.value };
    delete updated[id];
    this.dataSources.next(updated);
  }

  /** Utilities **/

  getDataSourceFields(id: string): Observable<string[]> {
    return this.getDataSource(id).pipe(
      map(source =>
        (source?.data?.length > 0) ? Object.keys(source.data[0]) : []
      )
    );
  }

  getNumericFields(id: string): Observable<string[]> {
    return this.getDataSource(id).pipe(
      map(source => {
        if (source?.data?.length > 0) {
          const firstItem = source.data[0];
          return Object.keys(firstItem).filter(key => typeof firstItem[key] === 'number');
        }
        return [];
      })
    );
  }

  loadFromUrl(url: string): Observable<any> {
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error loading data from URL:', error);
        return of(null);
      })
    );
  }

  /** Force refresh data from JSON **/
  refreshData(): void {
    this.dataLoaded = false;
    this.loadDataFromJson();
  }
}
