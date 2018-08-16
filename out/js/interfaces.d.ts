import { Observable } from 'rxjs/Rx';
export declare enum NotificationType {
    Error = 0,
    UpdateAvailable = 1,
    UpdateDownloaded = 2,
}
export interface ISelectionRange {
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
}
export declare enum CollectionChange {
    ItemsReplaced = 0,
}
export interface IObservableCollection<T> {
    getLength(): number;
    at(index: number): T;
    getRange(start: number, end: number): T[];
    setCollectionChangedCallback(callback: (change: CollectionChange, startIndex: number, count: number) => void): void;
    resetWindowsAroundIndex(index: number): void;
}
export declare class CancellationToken {
    private _isCanceled;
    private _canceled;
    cancel(): void;
    readonly isCanceled: boolean;
    readonly canceled: Observable<any>;
}
export interface IGridColumnDefinition {
    id: string;
    type: number;
}
export interface IGridDataRow {
    row?: number;
    values: any[];
}
export interface ISlickColumn<T> extends Slick.Column<T> {
    isEditable?: boolean;
}
