/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Component, Input, Output, Inject, forwardRef, OnChanges, OnInit, OnDestroy, ElementRef, SimpleChange, EventEmitter,
    ViewEncapsulation, Optional, HostListener, AfterViewInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';
import { IObservableCollection, CollectionChange, IGridDataRow, IColumnDefinition, FieldType } from './interfaces';
import { GridSyncService } from './gridsync.service';
import { ISlickRange, ISlickEvent } from './selectionmodel';

declare let Slick;

////////// Interfaces /////////////////////////////////////////////////////////

interface ISlickGridData {
    // https://github.com/mleibman/SlickGrid/wiki/DataView
    getLength(): number;
    getItem(index: number): any;
    getRange(start: number, end: number): any; // only available in the forked SlickGrid
    getItemMetadata(index: number): any;
}

interface ISlickGridColumn {
    // https://github.com/mleibman/SlickGrid/wiki/Column-Options
    name: string;
    field: string;
    id: string;
    icon: string;
    resizable: boolean;
    minWidth?: number;
    width?: number;
    asyncPostRender?: (cellRef: string, row: number, dataContext: JSON, colDef: any) => void;
    formatter?: (row: number, cell: any, value: any, columnDef: any, dataContext: any) => string;
}

////////// Text Editors ///////////////////////////////////////////////////////

function getOverridableTextEditorClass(grid: SlickGrid): any {
    class OverridableTextEditor {
        private _textEditor: any;
        private _rowIndex: number;

        constructor(private _args: any) {
            this._textEditor = new Slick.Editors.Text(_args);
        }

        destroy(): void {
            this._textEditor.destroy();
        };

        focus(): void {
            this._textEditor.focus();
        };

        getValue(): string {
            return this._textEditor.getValue();
        };

        setValue(val): void {
            this._textEditor.setValue(val);
        };

        loadValue(item, rowNumber): void {
            if (grid.overrideCellFn) {
                let overrideValue = grid.overrideCellFn(rowNumber, this._args.column.id, item[this._args.column.id]);
                if (overrideValue !== undefined) {
                    item[this._args.column.id] = overrideValue;
                }
            }

            this._rowIndex = rowNumber;
            this._textEditor.loadValue(item);
        };

        serializeValue(): string {
            return this._textEditor.serializeValue();
        };

        applyValue(item, state): void {
            let currentRow = grid.dataRows.at(this._rowIndex);
            let colIndex = grid.getColumnIndex(this._args.column.name);
            let dataLength: number = grid.dataRows.getLength();

            // If this is not the "new row" at the very bottom
            if (this._rowIndex !== dataLength) {
                currentRow.values[colIndex] = state;
                this._textEditor.applyValue(item, state);
            }
        };

        isValueChanged(): boolean {
            return this._textEditor.isValueChanged();
        };

        validate(): any {
            let result: any =  { valid: true, msg: undefined };
            let colIndex: number = grid.getColumnIndex(this._args.column.name);
            let newValue: any = this._textEditor.getValue();

            // TODO: It would be nice if we could support the isCellEditValid as a promise 
            if (grid.isCellEditValid && !grid.isCellEditValid(this._rowIndex, colIndex, newValue)) {
                result.valid = false;
            }

            return result;
        };
    }

    return OverridableTextEditor;
}

////////// Implementation /////////////////////////////////////////////////////

@Component({
    selector: 'slick-grid',
    template: '<div class="grid" (window:resize)="onResize()"></div>',
    providers: [GridSyncService],
    encapsulation: ViewEncapsulation.None
})
export class SlickGrid implements OnChanges, OnInit, OnDestroy, AfterViewInit {

    @Input() columnDefinitions: IColumnDefinition[];
    @Input() dataRows: IObservableCollection<IGridDataRow>;
    @Input() resized: Observable<any>;
    @Input() highlightedCells: {row: number, column: number}[] = [];
    @Input() blurredColumns: string[] = [];
    @Input() contextColumns: string[] = [];
    @Input() columnsLoading: string[] = [];
    @Input() showHeader: boolean = true;
    @Input() showDataTypeIcon: boolean = true;
    @Input() enableColumnReorder: boolean = false;
    @Input() enableAsyncPostRender: boolean = false;
    @Input() selectionModel: string | Slick.SelectionModel<any, any> = '';
    @Input() plugins: Array<string | Slick.Plugin<any>> = [];
    @Input() enableEditing: boolean = false;
    @Input() topRowNumber: number;

    @Input() overrideCellFn: (rowNumber, columnId, value?, data?) => string;
    @Input() isColumnEditable: (column: number) => boolean;
    @Input() isCellEditValid: (row: number, column: number, newValue: any) => boolean;

    @Output() loadFinished: EventEmitter<void> = new EventEmitter<void>();
    @Output() editingFinished: EventEmitter<any> = new EventEmitter();
    @Output() contextMenu: EventEmitter<any> = new EventEmitter<any>();
    @Output() topRowNumberChange: EventEmitter<number> = new EventEmitter<number>();

    @Output() cellEditBegin: EventEmitter<{row: number, column: number }> = new EventEmitter<{row: number, column: number}>();
    @Output() cellEditExit: EventEmitter<{row: number, column: number, newValue: any}> = new EventEmitter<{row: number, column: number, newValue: any}>();
    @Output() rowEditBegin: EventEmitter<{row: number}> = new EventEmitter<{row: number}>();
    @Output() rowEditExit: EventEmitter<{row: number}> = new EventEmitter<{row: number}>();

    @HostListener('focus')
    onFocus(): void {
        if (this._grid) {
            this._grid.focus();
        }
    }

    private _grid: any;
    private _gridColumns: ISlickGridColumn[];
    private _columnNameToIndex: any;
    private _gridData: ISlickGridData;
    private _rowHeight = 29;
    private _resizeSubscription: Subscription;
    private _gridSyncSubscription: Subscription;
    private _topRow: number = 0;
    private _leftPx: number = 0;
    private _activeEditingRow: number;
    private _activeEditingRowHasChanges: boolean;
    /* andresse: commented out 11/1/2016 due to minification issues
    private _finishGridEditingFn: (e: any, args: any) => void;
    */

    ////////// Constructor and Angular functions //////////////////////////////

    constructor(@Inject(forwardRef(() => ElementRef)) private _el,
                @Optional() @Inject(forwardRef(() => GridSyncService)) private _gridSyncService) {
        this._gridData = {
            getLength: (): number => {
                return this.dataRows && this._gridColumns ? this.dataRows.getLength() : 0;
            },
            getItem: (index): any => {
                return SlickGrid.getDataWithSchema(this.dataRows.at(index), this._gridColumns);
            },
            getRange: (start, end): any => {
                return !this.dataRows ? undefined : this.dataRows.getRange(start, end).map(d =>  {
                    return SlickGrid.getDataWithSchema(d, this._gridColumns);
                });
            },
            getItemMetadata: undefined
        };
    }

    ngOnChanges(changes: {[propName: string]: SimpleChange}): void {
        let columnDefinitionChanges = changes['columnDefinitions'];
        let activeCell = this._grid ? this._grid.getActiveCell() : undefined;
        let hasGridStructureChanges = false;
        let wasEditing = this._grid ? !!this._grid.getCellEditor() : false;

        if (columnDefinitionChanges
            && !_.isEqual(columnDefinitionChanges.previousValue, columnDefinitionChanges.currentValue)) {
            this.updateSchema();
            if (!this._grid) {
                this.initGrid();
            } else {
                this._grid.resetActiveCell();
                this._grid.setColumns(this._gridColumns);
            }
            if (this._gridSyncService) {
                let gridColumnWidths: number[] = this._grid.getColumnWidths();
                this._gridSyncService.rowNumberColumnWidthPX = gridColumnWidths[0];
                this._gridSyncService.columnWidthPXs = gridColumnWidths.slice(1);
            }
            hasGridStructureChanges = true;

            if (!columnDefinitionChanges.currentValue || columnDefinitionChanges.currentValue.length === 0) {
                activeCell = undefined;
            }
            if (activeCell) {
                let columnThatContainedActiveCell = columnDefinitionChanges.previousValue[Math.max(activeCell.cell - 1, 0)];
                let newActiveColumnIndex = columnThatContainedActiveCell
                    ? columnDefinitionChanges.currentValue.findIndex(c => c.id === columnThatContainedActiveCell.id)
                    : -1;
                activeCell.cell = newActiveColumnIndex !== -1 ? newActiveColumnIndex + 1 : 0;
            }
        }

        if (changes['dataRows']
            || (changes['highlightedCells'] && !_.isEqual(changes['highlightedCells'].currentValue, changes['highlightedCells'].previousValue))
            || (changes['blurredColumns'] && !_.isEqual(changes['blurredColumns'].currentValue, changes['blurredColumns'].previousValue))
            || (changes['columnsLoading'] && !_.isEqual(changes['columnsLoading'].currentValue, changes['columnsLoading'].previousValue))) {
            this.setCallbackOnDataRowsChanged();
            this._grid.updateRowCount();
            this._grid.setColumns(this._grid.getColumns());
            this._grid.invalidateAllRows();
            this._grid.render();
            if (this._gridSyncService) {
                this._gridSyncService.rowNumberColumnWidthPX = this._grid.getColumnWidths()[0];
            }
            hasGridStructureChanges = true;
        }

        if (hasGridStructureChanges) {
            if (activeCell) {
                this._grid.setActiveCell(activeCell.row, activeCell.cell);
            } else {
                this._grid.resetActiveCell();
            }
        }

        if (wasEditing && hasGridStructureChanges) {
            this._grid.editActiveCell();
        }

        /* andresse: commented out 11/1/2016 due to minification issues
        if (changes['editableColumnIds']) {
            let newValue = changes['editableColumnIds'].currentValue;
            if (!_.isEqual(newValue, changes['editableColumnIds'].previousValue)) {
                this._grid.onKeyDown.unsubscribe(this.finishGridEditingFn);
                if (newValue && newValue.length > 0) {
                    this._grid.onKeyDown.subscribe(this.finishGridEditingFn);
                    let firstEditableColumn = this._grid.getColumnIndex(newValue[0]) + 1;
                    let rowToFocus = activeCell ? activeCell.row : this._grid.getViewport().top;
                    this._grid.gotoCell(rowToFocus, firstEditableColumn, true);
                }
            }
        }
        */
    }

    ngOnInit(): void {
        // ngOnInit() will be called *after* the first time ngOnChanges() is called
        // so, grid must be there already
        if (this.topRowNumber === undefined) {
            this.topRowNumber = 0;
        }
        this._grid.scrollRowToTop(this.topRowNumber);

        if (this.resized) {
            // Re-rendering the grid is expensive. Throttle so we only do so every 100ms.
            this.resized.throttleTime(100)
                .subscribe(() => this.onResize());
        }

        // subscribe to slick events
        // https://github.com/mleibman/SlickGrid/wiki/Grid-Events
        this.subscribeToScroll();
        this.subscribeToCellChanged();
        this.subscribeToBeforeEditCell();
        this.subscribeToContextMenu();
        this.subscribeToActiveCellChanged();

        this._activeEditingRowHasChanges = false;
    }

    ngAfterViewInit(): void {
        this.loadFinished.emit();
    }

    ngOnDestroy(): void {
        if (this._resizeSubscription !== undefined) {
            this._resizeSubscription.unsubscribe();
        }
        if (this._gridSyncSubscription !== undefined) {
            this._gridSyncSubscription.unsubscribe();
        }
    }

    ////////// Public functions  - Add public API functions here //////////////

    // Enables editing on the grid
    public enterEditSession(): void {
        this.changeEditSession(true);
    }

    // Disables editing on the grid
    public endEditSession(): void {
        this.changeEditSession(false);
    }

    // Called whenever the grid's selected rows change 
    // Event args: { rows: number[] }
    public get onSelectedRowsChanged(): ISlickEvent {
        return this._grid.onSelectedRowsChanged;
    }

    // Returns an array of row indices corresponding to the currently selected rows.
    public getSelectedRows(): number[] {
        return this._grid.getSelectedRows();
    }

    // Gets the column index of the column with the given name
    public getColumnIndex(name: string): number {
        return this._columnNameToIndex[name];
    }

    // Gets a ISlickRange corresponding to the current selection on the grid
    public getSelectedRanges(): ISlickRange[] {
        if (this._gridSyncService && this._gridSyncService.selectionModel) {
            return this._gridSyncService.selectionModel.getSelectedRanges();
        }
    }

    // Registers a Slick plugin with the given name
    public registerPlugin(plugin: Slick.Plugin<any> | string): void {
        if (typeof plugin === 'object') {
            this._grid.registerPlugin(plugin);
        } else if (typeof plugin === 'string' && Slick[plugin] && typeof Slick[plugin] === 'function') {
            this._grid.registerPlugin(new Slick[plugin]);
        } else {
            console.error(`Tried to register plugin ${plugin}, but none was found to be attached to Slick Grid or it was not a function.
                        Please extend the Slick with the plugin as a function before registering`);
        }
    }

    // Set this grid to be the active grid
    public setActive(): void {
        this._grid.setActiveCell(0, 1);
        if (this._gridSyncService && this._gridSyncService.selectionModel) {
            this._gridSyncService.selectionModel.setSelectedRanges([new Slick.Range(0, 0, 0, 0)]);
        }
    }

    // Set the grid's selection
    public set selection(range: ISlickRange[] | boolean) {
        if (typeof range === 'boolean') {
            if (range) {
                this._gridSyncService.selectionModel.setSelectedRanges(
                    [new Slick.Range(0, 0, this._grid.getDataLength() - 1, this._grid.getColumns().length - 1)]
                );
            } else {
                this._gridSyncService.selectionModel.clearSelection();
            }
        } else {
            this._gridSyncService.selectionModel.setSelectedRanges(range);
        }
    }

    // Add a context menu to SlickGrid
    public subscribeToContextMenu(): void {
        const self = this;
        this._grid.onContextMenu.subscribe(function (event): void {
            event.preventDefault();
            self.contextMenu.emit(event);
        });
    }

    ////////// Private functions //////////////////////////////////////////////

    private initGrid(): void {
        // https://github.com/mleibman/SlickGrid/wiki/Grid-Options
        let options = {
            enableCellNavigation: true,
            enableColumnReorder: this.enableColumnReorder,
            renderRowWithRange: true,
            showRowNumber: true,
            showDataTypeIcon: this.showDataTypeIcon,
            showHeader: this.showHeader,
            rowHeight: this._rowHeight,
            defaultColumnWidth: 120,
            editable: this.enableEditing,
            autoEdit: this.enableEditing,
            enableAddRow: false, // TODO change when we support enableAddRow
            enableAsyncPostRender: this.enableAsyncPostRender,
            editorFactory: {
                getEditor: this.getColumnEditor
            },
            formatterFactory: {
                getFormatter: this.getFormatter
            }
        };

        this._grid = new Slick.Grid(
            this._el.nativeElement.getElementsByClassName('grid')[0],
            this._gridData,
            this._gridColumns,
            options);

        if (this._gridSyncService) {
            if (this.selectionModel) {
                if (typeof this.selectionModel === 'object') {
                    this._gridSyncService.underlyingSelectionModel = this.selectionModel;
                    this._grid.setSelectionModel(this._gridSyncService.selectionModel);
                } else if (typeof this.selectionModel === 'string' && Slick[this.selectionModel] && typeof Slick[this.selectionModel] === 'function') {
                    this._gridSyncService.underlyingSelectionModel = new Slick[this.selectionModel]();
                    this._grid.setSelectionModel(this._gridSyncService.selectionModel);
                } else {
                    console.error(`Tried to register selection model ${this.selectionModel}, 
                                   but none was found to be attached to Slick Grid or it was not a function.
                                   Please extend the Slick with the selection model as a function before registering`);
                }
            }
            this._gridSyncService.scrollBarWidthPX = this._grid.getScrollbarDimensions().width;
            this._gridSyncSubscription = this._gridSyncService.updated
                .filter(p => p === 'columnWidthPXs')
                .debounceTime(10)
                .subscribe(p => {
                    this.updateColumnWidths();
                });
        }

        for (let plugin of this.plugins) {
                this.registerPlugin(plugin);
        }

        this._columnNameToIndex = {};
        for (let i = 0; i < this._gridColumns.length; i++) {
            this._columnNameToIndex[this._gridColumns[i].name] = i;
        }

        this.onResize();
    }

    private changeEditSession(enabled: boolean): void {
        this.enableEditing = enabled;
        let options: any = this._grid.getOptions();
        options.editable = enabled;
        options.enableAddRow = false; // TODO change to " options.enableAddRow = false;" when we support enableAddRow
        this._grid.setOptions(options);
    }

    private handleEditorCellChange(rowNumber: number): void {
        // Need explicit undefined check due to row 0
        let firstTimeEditingRow = this._activeEditingRow === undefined;
        let editingNewRow = rowNumber !== this._activeEditingRow;

        // Check if we have existing edits on a row and we are leaving that row
        if (!firstTimeEditingRow && editingNewRow && this._activeEditingRowHasChanges) {
            this._activeEditingRowHasChanges = false;
            this.rowEditExit.emit({
                row: this._activeEditingRow
            });
            this._activeEditingRow = undefined;
        }

        // Check if we are entering a new row
        if (firstTimeEditingRow || editingNewRow) {
            this._activeEditingRow = rowNumber;
            this.rowEditBegin.emit({
                row: rowNumber
            });
        }
    }

    private static getDataWithSchema(data: IGridDataRow, columns: ISlickGridColumn[]): any {
        let dataWithSchema = {};
        for (let i = 0; i < columns.length; i++) {
            dataWithSchema[columns[i].field] = data.values[i];
        }

        return dataWithSchema;
    }

    private onResize(): void {
        if (this._grid !== undefined) {
            // this will make sure the grid header and body to be re-rendered
            this._grid.resizeCanvas();
        }
    }

    private invalidateRange(start: number, end: number): void {
        let refreshedRows = _.range(start, end);
        this._grid.invalidateRows(refreshedRows, true);
        this._grid.render();
    }

    /* tslint:disable:member-ordering */
    private getColumnEditor = (column: any): any => {
        if (this.isColumnEditable && !this.isColumnEditable(this.getColumnIndex(column.name))) {
            return undefined;
        }

        let columnId = column.id;
        let isColumnLoading = this.columnsLoading && this.columnsLoading.indexOf(columnId) !== -1;
        let canEditColumn = columnId !== undefined && !isColumnLoading;
        if (canEditColumn) {
            return getOverridableTextEditorClass(this);
        }
        return undefined;
    };

    private getFormatter = (column: any): any => {
        if (column.isRowNumber === true) {
            return undefined; // use default formatter for row number cell
        }
        return (row, cell, value, columnDef, dataContext) => {
            let columnId = cell > 0 && this.columnDefinitions.length > cell - 1 ? this.columnDefinitions[cell - 1].id : undefined;
            if (columnId) {
                let columnType = this.columnDefinitions[cell - 1].type;
                let isHighlighted = this.highlightedCells && !!this.highlightedCells.find(c => c.row === row && c.column + 1 === cell);
                let isColumnLoading = this.columnsLoading && this.columnsLoading.indexOf(columnId) !== -1;
                let isShadowed = this.blurredColumns && !!this.blurredColumns.find(c => c === columnId);
                let isContext = this.contextColumns && !!this.contextColumns.find(c => c === columnId);
                let overrideValue = this.overrideCellFn && this.overrideCellFn(row, columnId, value, dataContext);

                let valueToDisplay = (value + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                let cellClasses = 'grid-cell-value-container';
                if (columnType !== FieldType.String) {
                    cellClasses += ' right-justified';
                }

                /* tslint:disable:no-null-keyword */
                let valueMissing = value === undefined || value === null;
                /* tslint:disable:no-null-keyword */
                let isOverridden = overrideValue !== undefined && overrideValue !== null;

                if (valueMissing && !isOverridden) {
                    cellClasses += ' missing-value';
                }

                if (isColumnLoading === true && !isOverridden) {
                    cellClasses += ' loading-cell';
                    valueToDisplay = '';
                }

                if (isOverridden) {
                    cellClasses += ' override-cell';
                    valueToDisplay = overrideValue;
                }

                if (isContext) {
                    cellClasses += ' context';
                }

                if (isHighlighted === true) {
                    cellClasses += ' highlighted';
                }

                if (isShadowed && !isHighlighted && !isOverridden) {
                    cellClasses += ' blurred';
                }

                return '<span title="' + valueToDisplay + '" class="' + cellClasses + '">' + valueToDisplay + '</span>';
            }

        };
    };

    private subscribeToScroll(): void {
        this._grid.onScroll.subscribe((e, args) => {
            let scrollTop = args.scrollTop;
            let scrollRow = Math.floor(scrollTop / this._rowHeight);
            scrollRow = scrollRow < 0 ? 0 : scrollRow;
            if (scrollRow !== this._topRow) {
                this._topRow = scrollRow;
                this.topRowNumberChange.emit(scrollRow);
            }

            if (this._gridSyncService && args.scrollLeft !== this._leftPx) {
                this._leftPx = args.scrollLeft;
                this._gridSyncService.scrollLeftPX = this._leftPx;
            }
        });
    }

    private subscribeToCellChanged(): void {
        this._grid.onCellChange.subscribe((e, args) => {
            let modifiedColumn = this.columnDefinitions[args.cell - 1];
            this._activeEditingRowHasChanges = true;
            this.cellEditExit.emit({
                column: this.getColumnIndex(modifiedColumn.name),
                row: args.row,
                newValue: args.item[modifiedColumn.id]
            });
        });
    }

    private subscribeToBeforeEditCell(): void {
        this._grid.onBeforeEditCell.subscribe((e, args) => {
            this.handleEditorCellChange(args.row);
            this.cellEditBegin.emit({
                column: this.getColumnIndex(args.column.name),
                row: args.row
            });
        });
    }

    private subscribeToActiveCellChanged (): void {
        // Subscribe to all active cell changes to be able to catch when we tab to the header on the next row
        this._grid.onActiveCellChanged.subscribe((e, args) => {

            // If editing is disabled or this isn't the header, ignore. 
            // We assume the header is always column 0, as it is hardcoded to be that way in initGrid
            if (!this.enableEditing || args.cell !== 0) {
                return;
            }

            let rowNumber = args.row;
            let haveRowEdits = this._activeEditingRow !== undefined;
            let tabbedToNextRow = rowNumber !== this._activeEditingRow; // Need explicit undefined check due to row 0

            // If we tabbed from an edited row to the header of the next row, emit a rowEditExit
            if (haveRowEdits && tabbedToNextRow && this._activeEditingRowHasChanges) {
                this.rowEditExit.emit();
                this._activeEditingRow = undefined;
                this._activeEditingRowHasChanges = false;
            }
        });
    }

    private updateColumnWidths(): void {
        for (let i = 0; i < this._gridColumns.length; i++) {
            this._gridColumns[i].width = this._gridSyncService.columnWidthPXs[i];
        }
        this._grid.setColumnWidths(this._gridColumns, true);
    }

    private updateSchema(): void {
        if (!this.columnDefinitions) {
            return;
        }

        this._gridColumns = this.columnDefinitions.map((c, i) => {
            let column: ISlickGridColumn = {
                name: c.name,
                field: c.id,
                id: c.id ? c.id : c.name,
                icon: this.getImagePathForDataType(c.type),
                resizable: true
            };

            if (c.asyncPostRender) {
                column.asyncPostRender = c.asyncPostRender;
            }

            if (c.formatter) {
                column.formatter = c.formatter;
            }

            if (this._gridSyncService) {
                let columnWidth = this._gridSyncService.columnWidthPXs[i];
                column.width = columnWidth ? columnWidth : undefined;
                column.minWidth = this._gridSyncService.columnMinWidthPX;
            }

            return column;
        });
    }

    private getImagePathForDataType(type: FieldType): string {
        const resourcePath = './resources/';
        switch (type) {
            case FieldType.String:
                return resourcePath + 'col-type-string.svg';
            case FieldType.Boolean:
                return resourcePath + 'col-type-boolean.svg';
            case FieldType.Integer:
            case FieldType.Decimal:
                return resourcePath + 'col-type-number.svg';
            case FieldType.Date:
                return resourcePath + 'col-type-timedate.svg';
            case FieldType.Unknown:
            default:
                return resourcePath + 'circle.svg';
        }
    }

    private setCallbackOnDataRowsChanged(): void {
        if (this.dataRows) {
            // We must wait until we get the first set of dataRows before we enable editing or slickgrid will complain
            if (this.enableEditing) {
                this.enterEditSession();
            }

            this.dataRows.setCollectionChangedCallback((change: CollectionChange, startIndex: number, count: number) => {
                this.renderGridDataRowsRange(startIndex, count);
            });
        }
    }

    private renderGridDataRowsRange(startIndex: number, count: number): void {
        let editor = this._grid.getCellEditor();
        let oldValue = editor ? editor.getValue() : undefined;
        let wasValueChanged = editor ? editor.isValueChanged() : false;
        this.invalidateRange(startIndex, startIndex + count);
        let activeCell = this._grid.getActiveCell();
        if (editor && activeCell.row >= startIndex && activeCell.row < startIndex + count) {
            if (oldValue && wasValueChanged) {
                editor.setValue(oldValue);
            }
        }
    }

    /* andresse: commented out 11/1/2016 due to minification issues
    private get finishGridEditingFn(): (e: any, args: any) => void {
        if (this._finishGridEditingFn === undefined) {
            this._finishGridEditingFn = ((e: any, args: any) => {
                if (e.ctrlKey === true
                    && e.keyCode === 13
                    && this.editableColumnIds
                    && this.editableColumnIds.find(id => id === args.columnDef.id)) {
                    // pressed [Ctrl + Enter] in the editing area
                    this.editingFinished.next(undefined);
                }
            }).bind(this);
        }

        return this._finishGridEditingFn;
    }
    */
}
