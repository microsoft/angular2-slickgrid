import { Observable } from 'rxjs/Rx';
import { SelectionModel } from './selectionmodel';
export declare class GridSyncService {
    columnMinWidthPX: number;
    private _scrollLeftPX;
    private _scrollBarWidthPX;
    private _columnWidthPXs;
    private _rowNumberColumnWidthPX;
    private _updated;
    private _typeDropdownOffset;
    private _selectionModel;
    private _initialColumnWidthPXsOnResize;
    private _isGridReadOnly;
    initialColumnResize(): void;
    resizeColumn(index: number, deltaWidthPX: number): void;
    openTypeDropdown(columnIndex: number): void;
    private setColumnWidthPX(index, widthPX);
    underlyingSelectionModel: any;
    readonly updated: Observable<string>;
    readonly typeDropdownOffset: Observable<[number, number]>;
    scrollLeftPX: number;
    scrollBarWidthPX: number;
    columnWidthPXs: number[];
    rowNumberColumnWidthPX: number;
    readonly selectionModel: SelectionModel;
    isGridReadOnly: boolean;
    private notifyUpdates(propertyName);
}
