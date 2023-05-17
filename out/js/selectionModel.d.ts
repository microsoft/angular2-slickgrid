import { ISelectionRange } from './interfaces';
export interface ISlickSelectionModel {
    range: Slick.Range[];
    onSelectedRangesChanged: any;
    init(grid: any): void;
    destroy(): void;
    setSelectedRanges(ranges: Slick.Range[]): void;
    getSelectedRanges(): Slick.Range[];
}
export declare class SelectionModel implements ISlickSelectionModel {
    private _rowSelectionModel;
    private _handler;
    private _onSelectedRangesChanged;
    private _slickRangeFactory;
    constructor(_rowSelectionModel: ISlickSelectionModel, _handler: ISlickEventHandler, _onSelectedRangesChanged: ISlickEvent, _slickRangeFactory: (fromRow: number, fromCell: number, toRow: number, toCell: number) => Slick.Range);
    readonly range: Slick.Range[];
    readonly onSelectedRangesChanged: ISlickEvent;
    init(grid: ISlickGrid): void;
    destroy(): void;
    setSelectedRanges(ranges: Slick.Range[]): void;
    getSelectedRanges(): Slick.Range[];
    changeSelectedRanges(selections: ISelectionRange[]): void;
    toggleSingleColumnSelection(columnId: string): void;
    setSingleColumnSelection(columnId: string): void;
    toggleMultiColumnSelection(columnId: string): void;
    extendMultiColumnSelection(columnId: string): void;
    clearSelection(): void;
    private _grid;
    private _ranges;
    private _lastSelectedColumnIndexSequence;
    private static areRangesIdentical(lhs, rhs);
    private getColumnRange(columnId);
    private getColumnRangeByIndex(columnIndex);
    private readonly isColumnSelectionCurrently;
    private updateSelectedRanges(ranges);
}
export interface ISlickEventHandler {
    subscribe(event: any, handler: any): void;
    unsubscribeAll(): void;
}
export interface ISlickEvent {
    notify(eventData: Slick.Range[]): void;
    subscribe(handler: (e: any, args: any) => void): void;
}
export interface ISlickGrid {
    getActiveCellNode(): any;
    getCanvasNode(): any;
    resetActiveCell(): void;
    focus(): void;
    getColumnIndex(columnId: string): number;
    getDataLength(): number;
}
