/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import {
    Component, Input, Output, Inject, forwardRef, OnChanges, OnInit, OnDestroy, ElementRef, SimpleChange, EventEmitter,
    ViewEncapsulation, HostListener, AfterViewInit
} from '@angular/core';
import { Observable, Subscription } from 'rxjs/Rx';
import { IObservableCollection, CollectionChange, ISlickColumn } from './interfaces';

declare let Slick;

////////// Interfaces /////////////////////////////////////////////////////////

interface ISlickGridData {
    // https://github.com/mleibman/SlickGrid/wiki/DataView
    getLength(): number;
    getItem(index: number): any;
    getRange(start: number, end: number): any; // only available in the forked SlickGrid
    getItemMetadata(index: number): any;
}

////////// Text Editors ///////////////////////////////////////////////////////

export function getOverridableTextEditorClass(grid: SlickGrid): any {
    class OverridableTextEditor {
        private _textEditor: any;
        public keyCaptureList: number[];

        constructor(private _args: any) {
            this._textEditor = new Slick.Editors.Text(_args);            
            const END = 35;
            const HOME = 36;

            // These are the special keys the text editor should capture instead of letting 
            // the grid handle them
            this.keyCaptureList = [END, HOME];
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
            this._textEditor.loadValue(item);
        };

        serializeValue(): string {
            return this._textEditor.serializeValue();
        };

        applyValue(item, state): void {
            let activeRow = grid.activeCell.row;
            let currentRow = grid.dataRows.at(activeRow);
            let colIndex = grid.getColumnIndex(this._args.column.name);
            let dataLength: number = grid.dataRows.getLength();

            // If this is not the "new row" at the very bottom
            if (activeRow !== dataLength) {
                currentRow[colIndex] = state;
                this._textEditor.applyValue(item, state);
            }
        };

        isValueChanged(): boolean {
            return this._textEditor.isValueChanged();
        };

        validate(): any {
            let activeRow = grid.activeCell.row;
            let result: any = { valid: true, msg: undefined };
            let colIndex: number = grid.getColumnIndex(this._args.column.name);
            let newValue: any = this._textEditor.getValue();

            // TODO: It would be nice if we could support the isCellEditValid as a promise 
            if (grid.isCellEditValid && !grid.isCellEditValid(activeRow, colIndex, newValue)) {
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
    encapsulation: ViewEncapsulation.None
})
export class SlickGrid implements OnChanges, OnInit, OnDestroy, AfterViewInit {

    @Input() columnDefinitions: ISlickColumn<any>[];
    @Input() dataRows: IObservableCollection<{}>;
    @Input() resized: Observable<any>;
    @Input() highlightedCells: { row: number, column: number }[] = [];
    @Input() blurredColumns: string[] = [];
    @Input() contextColumns: string[] = [];
    @Input() columnsLoading: string[] = [];
    @Input() showHeader: boolean = true;
    @Input() enableColumnReorder: boolean = false;
    @Input() enableAsyncPostRender: boolean = false;
    @Input() selectionModel: string | Slick.SelectionModel<any, any> = '';
    @Input() plugins: Array<string | Slick.Plugin<any>> = [];
    @Input() enableEditing: boolean = false;
    @Input() topRowNumber: number;

    @Input() overrideCellFn: (rowNumber, columnId, value?, data?) => string;
    @Input() isCellEditValid: (row: number, column: number, newValue: any) => boolean;

    @Output() loadFinished: EventEmitter<void> = new EventEmitter<void>();

    // SLickGrid Events
    @Output() onContextMenu: EventEmitter<Slick.EventData> = new EventEmitter<Slick.EventData>();
    @Output() onScroll: EventEmitter<Slick.OnScrollEventArgs<any>> = new EventEmitter<Slick.OnScrollEventArgs<any>>();
    @Output() onActiveCellChanged: EventEmitter<Slick.OnActiveCellChangedEventArgs<any>> = new EventEmitter<Slick.OnActiveCellChangedEventArgs<any>>();
    @Output() onBeforeEditCell: EventEmitter<Slick.OnBeforeEditCellEventArgs<any>> = new EventEmitter<Slick.OnBeforeEditCellEventArgs<any>>();
    @Output() onCellChange: EventEmitter<Slick.OnCellChangeEventArgs<any>> = new EventEmitter<Slick.OnCellChangeEventArgs<any>>();

    @HostListener('focus')
    onFocus(): void {
        if (this._grid) {
            this._grid.focus();
        }
    }

    @Input() public set rowHeight(val: number) {
        this._rowHeight = val;
        if (this._grid) {
            this._grid.setOptions({ rowHeight: this.rowHeight });
        }
    }

    public get rowHeight(): number {
        return this._rowHeight;
    }

    private _rowHeight = 29;
    private _grid: Slick.Grid<any>;
    private _gridColumns: ISlickColumn<any>[];
    private _columnNameToIndex: any;
    private _gridData: ISlickGridData;
    private _resizeSubscription: Subscription;
    private _gridSyncSubscription: Subscription;

    ////////// Constructor and Angular functions //////////////////////////////

    constructor(@Inject(forwardRef(() => ElementRef)) private _el) {
        this._gridData = {
            getLength: (): number => {
                return this.dataRows && this._gridColumns ? this.dataRows.getLength() : 0;
            },
            getItem: (index): any => {
                return !this.dataRows ? undefined : this.dataRows.at(index);
            },
            getRange: (start, end): any => {
                return !this.dataRows ? undefined : this.dataRows.getRange(start, end);
            },
            getItemMetadata: undefined
        };
    }

    ngOnChanges(changes: { [propName: string]: SimpleChange }): void {
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
    }

    ngOnInit(): void {
        // ngOnInit() will be called *after* the first time ngOnChanges() is called
        // so, grid must be there already
        if (this.topRowNumber === undefined) {
            this.topRowNumber = 0;
        }
        if (this.dataRows && this.dataRows.getLength() > 0) {
            this._grid.scrollRowToTop(this.topRowNumber);
        }

        if (this.resized) {
            // Re-rendering the grid is expensive. Throttle so we only do so every 100ms.
            this.resized.throttleTime(100)
                .subscribe(() => this.onResize());
        }

        // subscribe to slick events
        // https://github.com/mleibman/SlickGrid/wiki/Grid-Events
        this.setupEvents();
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
    public get onSelectedRowsChanged(): Slick.Event<Slick.OnSelectedRowsChangedEventArgs<any>> {
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
    public getSelectedRanges(): Slick.Range[] {
        let selectionModel = this._grid.getSelectionModel();
        if (selectionModel && selectionModel.getSelectedRanges) {
            return selectionModel.getSelectedRanges();
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
    }

    // Set the grid's selection
    public set selection(ranges: Slick.Range[] | boolean) {
        if (typeof ranges === 'boolean') {
            if (ranges) {
                let rows = [];
                for (let i = 0; i < this._grid.getDataLength(); i++) {
                    rows.push(i);
                }
                this._grid.setSelectedRows(rows);
            } else {
                this._grid.setSelectedRows([]);
            }
        } else {
            let selectionModel = this._grid.getSelectionModel();
            if (selectionModel && selectionModel.setSelectedRanges) {
                selectionModel.setSelectedRanges(ranges);
            }
        }
    }

    ////////// Private functions //////////////////////////////////////////////

    private initGrid(): void {
        // https://github.com/mleibman/SlickGrid/wiki/Grid-Options
        let options = {
            enableCellNavigation: true,
            enableColumnReorder: this.enableColumnReorder,
            renderRowWithRange: true,
            showHeader: this.showHeader,
            rowHeight: this.rowHeight,
            defaultColumnWidth: 120,
            editable: this.enableEditing,
            autoEdit: this.enableEditing,
            enableAddRow: false, // TODO change when we support enableAddRow
            enableAsyncPostRender: this.enableAsyncPostRender,
            editorFactory: {
                getEditor: (column: ISlickColumn<any>) => this.getColumnEditor(column)
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

        if (this.selectionModel) {
            if (typeof this.selectionModel === 'object') {
                this._grid.setSelectionModel(this.selectionModel);
            } else if (typeof this.selectionModel === 'string' && Slick[this.selectionModel] && typeof Slick[this.selectionModel] === 'function') {
                this._grid.setSelectionModel(new Slick[this.selectionModel]());
            } else {
                console.error(`Tried to register selection model ${this.selectionModel}, 
                                   but none was found to be attached to Slick Grid or it was not a function.
                                   Please extend the Slick namespace with the selection model as a function before registering`);
            }
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

    private getColumnEditor(column: ISlickColumn<any>): any {
        if (column.isEditable === false || typeof column.isEditable === 'undefined') {
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
        return (row, cell, value, columnDef, dataContext) => {
            let columnId = cell > 0 && this.columnDefinitions.length > cell - 1 ? this.columnDefinitions[cell - 1].id : undefined;
            if (columnId) {
                let isHighlighted = this.highlightedCells && !!this.highlightedCells.find(c => c.row === row && c.column + 1 === cell);
                let isColumnLoading = this.columnsLoading && this.columnsLoading.indexOf(columnId) !== -1;
                let isShadowed = this.blurredColumns && !!this.blurredColumns.find(c => c === columnId);
                let isContext = this.contextColumns && !!this.contextColumns.find(c => c === columnId);
                let overrideValue = this.overrideCellFn && this.overrideCellFn(row, columnId, value, dataContext);

                let valueToDisplay = (value + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                let cellClasses = 'grid-cell-value-container';

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

    private setupEvents(): void {
        this._grid.onScroll.subscribe((e, args) => {
            this.onScroll.emit(args);
        });
        this._grid.onCellChange.subscribe((e, args) => {
            this.onCellChange.emit(args);
        });
        this._grid.onBeforeEditCell.subscribe((e, args) => {
            this.onBeforeEditCell.emit(args);
        });
        // Subscribe to all active cell changes to be able to catch when we tab to the header on the next row
        this._grid.onActiveCellChanged.subscribe((e, args) => {
            // Emit that we've changed active cells
            this.onActiveCellChanged.emit(args);
        });
        this._grid.onContextMenu.subscribe((e, args) => {
            this.onContextMenu.emit(e);
        });
    }

    private updateSchema(): void {
        if (!this.columnDefinitions) {
            return;
        }

        this._gridColumns = this.columnDefinitions;
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

    public get activeCell(): Slick.Cell {
        return this._grid.getActiveCell();
    }

    private renderGridDataRowsRange(startIndex: number, count: number): void {
        let editor = this._grid.getCellEditor();
        let oldValue = editor ? editor.getValue() : undefined;
        let wasValueChanged = editor ? editor.isValueChanged() : false;
        this.invalidateRange(startIndex, startIndex + count);
        let activeCell = this.activeCell;
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
