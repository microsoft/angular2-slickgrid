"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular/core");
const Rx_1 = require("rxjs/Rx");
const interfaces_1 = require("./interfaces");
const gridsync_service_1 = require("./gridsync.service");
////////// Text Editors ///////////////////////////////////////////////////////
function getOverridableTextEditorClass(grid) {
    class OverridableTextEditor {
        constructor(_args) {
            this._args = _args;
            this._textEditor = new Slick.Editors.Text(_args);
        }
        destroy() {
            this._textEditor.destroy();
        }
        ;
        focus() {
            this._textEditor.focus();
        }
        ;
        getValue() {
            return this._textEditor.getValue();
        }
        ;
        setValue(val) {
            this._textEditor.setValue(val);
        }
        ;
        loadValue(item, rowNumber) {
            if (grid.overrideCellFn) {
                let overrideValue = grid.overrideCellFn(rowNumber, this._args.column.id, item[this._args.column.id]);
                if (overrideValue !== undefined) {
                    item[this._args.column.id] = overrideValue;
                }
            }
            this._rowIndex = rowNumber;
            this._textEditor.loadValue(item);
        }
        ;
        serializeValue() {
            return this._textEditor.serializeValue();
        }
        ;
        applyValue(item, state) {
            let currentRow = grid.dataRows.at(this._rowIndex);
            let colIndex = grid.getColumnIndex(this._args.column.name);
            let dataLength = grid.dataRows.getLength();
            // If this is not the "new row" at the very bottom
            if (this._rowIndex !== dataLength) {
                currentRow.values[colIndex] = state;
                this._textEditor.applyValue(item, state);
            }
        }
        ;
        isValueChanged() {
            return this._textEditor.isValueChanged();
        }
        ;
        validate() {
            let result = { valid: true, msg: undefined };
            let colIndex = grid.getColumnIndex(this._args.column.name);
            let newValue = this._textEditor.getValue();
            // TODO: It would be nice if we could support the isCellEditValid as a promise 
            if (grid.isCellEditValid && !grid.isCellEditValid(this._rowIndex, colIndex, newValue)) {
                result.valid = false;
            }
            return result;
        }
        ;
    }
    return OverridableTextEditor;
}
////////// Implementation /////////////////////////////////////////////////////
let SlickGrid = SlickGrid_1 = class SlickGrid {
    /* andresse: commented out 11/1/2016 due to minification issues
    private _finishGridEditingFn: (e: any, args: any) => void;
    */
    ////////// Constructor and Angular functions //////////////////////////////
    constructor(_el, _gridSyncService) {
        this._el = _el;
        this._gridSyncService = _gridSyncService;
        this.highlightedCells = [];
        this.blurredColumns = [];
        this.contextColumns = [];
        this.columnsLoading = [];
        this.showHeader = true;
        this.showDataTypeIcon = true;
        this.enableColumnReorder = false;
        this.enableAsyncPostRender = false;
        this.selectionModel = '';
        this.plugins = [];
        this.enableEditing = false;
        this.loadFinished = new core_1.EventEmitter();
        this.editingFinished = new core_1.EventEmitter();
        this.contextMenu = new core_1.EventEmitter();
        this.topRowNumberChange = new core_1.EventEmitter();
        this.cellEditBegin = new core_1.EventEmitter();
        this.cellEditExit = new core_1.EventEmitter();
        this.rowEditBegin = new core_1.EventEmitter();
        this.rowEditExit = new core_1.EventEmitter();
        this._rowHeight = 29;
        this._topRow = 0;
        this._leftPx = 0;
        /* tslint:disable:member-ordering */
        this.getColumnEditor = (column) => {
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
        this.getFormatter = (column) => {
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
                    if (columnType !== interfaces_1.FieldType.String) {
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
        this._gridData = {
            getLength: () => {
                return this.dataRows && this._gridColumns ? this.dataRows.getLength() : 0;
            },
            getItem: (index) => {
                return SlickGrid_1.getDataWithSchema(this.dataRows.at(index), this._gridColumns);
            },
            getRange: (start, end) => {
                return !this.dataRows ? undefined : this.dataRows.getRange(start, end).map(d => {
                    return SlickGrid_1.getDataWithSchema(d, this._gridColumns);
                });
            },
            getItemMetadata: undefined
        };
    }
    onFocus() {
        if (this._grid) {
            this._grid.focus();
        }
    }
    ngOnChanges(changes) {
        let columnDefinitionChanges = changes['columnDefinitions'];
        let activeCell = this._grid ? this._grid.getActiveCell() : undefined;
        let hasGridStructureChanges = false;
        let wasEditing = this._grid ? !!this._grid.getCellEditor() : false;
        if (columnDefinitionChanges
            && !_.isEqual(columnDefinitionChanges.previousValue, columnDefinitionChanges.currentValue)) {
            this.updateSchema();
            if (!this._grid) {
                this.initGrid();
            }
            else {
                this._grid.resetActiveCell();
                this._grid.setColumns(this._gridColumns);
            }
            if (this._gridSyncService) {
                let gridColumnWidths = this._grid.getColumnWidths();
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
            }
            else {
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
    ngOnInit() {
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
    ngAfterViewInit() {
        this.loadFinished.emit();
    }
    ngOnDestroy() {
        if (this._resizeSubscription !== undefined) {
            this._resizeSubscription.unsubscribe();
        }
        if (this._gridSyncSubscription !== undefined) {
            this._gridSyncSubscription.unsubscribe();
        }
    }
    ////////// Public functions  - Add public API functions here //////////////
    // Enables editing on the grid
    enterEditSession() {
        this.changeEditSession(true);
    }
    // Disables editing on the grid
    endEditSession() {
        this.changeEditSession(false);
    }
    // Called whenever the grid's selected rows change 
    // Event args: { rows: number[] }
    get onSelectedRowsChanged() {
        return this._grid.onSelectedRowsChanged;
    }
    // Returns an array of row indices corresponding to the currently selected rows.
    getSelectedRows() {
        return this._grid.getSelectedRows();
    }
    // Gets the column index of the column with the given name
    getColumnIndex(name) {
        return this._columnNameToIndex[name];
    }
    // Gets a ISlickRange corresponding to the current selection on the grid
    getSelectedRanges() {
        if (this._gridSyncService && this._gridSyncService.selectionModel) {
            return this._gridSyncService.selectionModel.getSelectedRanges();
        }
    }
    // Registers a Slick plugin with the given name
    registerPlugin(plugin) {
        if (typeof plugin === 'object') {
            this._grid.registerPlugin(plugin);
        }
        else if (typeof plugin === 'string' && Slick[plugin] && typeof Slick[plugin] === 'function') {
            this._grid.registerPlugin(new Slick[plugin]);
        }
        else {
            console.error(`Tried to register plugin ${plugin}, but none was found to be attached to Slick Grid or it was not a function.
                        Please extend the Slick with the plugin as a function before registering`);
        }
    }
    // Set this grid to be the active grid
    setActive() {
        this._grid.setActiveCell(0, 1);
        if (this._gridSyncService && this._gridSyncService.selectionModel) {
            this._gridSyncService.selectionModel.setSelectedRanges([new Slick.Range(0, 0, 0, 0)]);
        }
    }
    // Set the grid's selection
    set selection(range) {
        if (typeof range === 'boolean') {
            if (range) {
                this._gridSyncService.selectionModel.setSelectedRanges([new Slick.Range(0, 0, this._grid.getDataLength() - 1, this._grid.getColumns().length - 1)]);
            }
            else {
                this._gridSyncService.selectionModel.clearSelection();
            }
        }
        else {
            this._gridSyncService.selectionModel.setSelectedRanges(range);
        }
    }
    // Add a context menu to SlickGrid
    subscribeToContextMenu() {
        const self = this;
        this._grid.onContextMenu.subscribe(function (event) {
            event.preventDefault();
            self.contextMenu.emit(event);
        });
    }
    ////////// Private functions //////////////////////////////////////////////
    initGrid() {
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
            enableAddRow: false,
            enableAsyncPostRender: this.enableAsyncPostRender,
            editorFactory: {
                getEditor: this.getColumnEditor
            },
            formatterFactory: {
                getFormatter: this.getFormatter
            }
        };
        this._grid = new Slick.Grid(this._el.nativeElement.getElementsByClassName('grid')[0], this._gridData, this._gridColumns, options);
        if (this._gridSyncService) {
            if (this.selectionModel) {
                if (typeof this.selectionModel === 'object') {
                    this._gridSyncService.underlyingSelectionModel = this.selectionModel;
                    this._grid.setSelectionModel(this._gridSyncService.selectionModel);
                }
                else if (typeof this.selectionModel === 'string' && Slick[this.selectionModel] && typeof Slick[this.selectionModel] === 'function') {
                    this._gridSyncService.underlyingSelectionModel = new Slick[this.selectionModel]();
                    this._grid.setSelectionModel(this._gridSyncService.selectionModel);
                }
                else {
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
    changeEditSession(enabled) {
        this.enableEditing = enabled;
        let options = this._grid.getOptions();
        options.editable = enabled;
        options.enableAddRow = false; // TODO change to " options.enableAddRow = false;" when we support enableAddRow
        this._grid.setOptions(options);
    }
    handleEditorCellChange(rowNumber) {
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
    static getDataWithSchema(data, columns) {
        let dataWithSchema = {};
        for (let i = 0; i < columns.length; i++) {
            dataWithSchema[columns[i].field] = data.values[i];
        }
        return dataWithSchema;
    }
    onResize() {
        if (this._grid !== undefined) {
            // this will make sure the grid header and body to be re-rendered
            this._grid.resizeCanvas();
        }
    }
    invalidateRange(start, end) {
        let refreshedRows = _.range(start, end);
        this._grid.invalidateRows(refreshedRows, true);
        this._grid.render();
    }
    subscribeToScroll() {
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
    subscribeToCellChanged() {
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
    subscribeToBeforeEditCell() {
        this._grid.onBeforeEditCell.subscribe((e, args) => {
            this.handleEditorCellChange(args.row);
            this.cellEditBegin.emit({
                column: this.getColumnIndex(args.column.name),
                row: args.row
            });
        });
    }
    subscribeToActiveCellChanged() {
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
    updateColumnWidths() {
        for (let i = 0; i < this._gridColumns.length; i++) {
            this._gridColumns[i].width = this._gridSyncService.columnWidthPXs[i];
        }
        this._grid.setColumnWidths(this._gridColumns, true);
    }
    updateSchema() {
        if (!this.columnDefinitions) {
            return;
        }
        this._gridColumns = this.columnDefinitions.map((c, i) => {
            let column = {
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
    getImagePathForDataType(type) {
        const resourcePath = './resources/';
        switch (type) {
            case interfaces_1.FieldType.String:
                return resourcePath + 'col-type-string.svg';
            case interfaces_1.FieldType.Boolean:
                return resourcePath + 'col-type-boolean.svg';
            case interfaces_1.FieldType.Integer:
            case interfaces_1.FieldType.Decimal:
                return resourcePath + 'col-type-number.svg';
            case interfaces_1.FieldType.Date:
                return resourcePath + 'col-type-timedate.svg';
            case interfaces_1.FieldType.Unknown:
            default:
                return resourcePath + 'circle.svg';
        }
    }
    setCallbackOnDataRowsChanged() {
        if (this.dataRows) {
            // We must wait until we get the first set of dataRows before we enable editing or slickgrid will complain
            if (this.enableEditing) {
                this.enterEditSession();
            }
            this.dataRows.setCollectionChangedCallback((change, startIndex, count) => {
                this.renderGridDataRowsRange(startIndex, count);
            });
        }
    }
    renderGridDataRowsRange(startIndex, count) {
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
};
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], SlickGrid.prototype, "columnDefinitions", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], SlickGrid.prototype, "dataRows", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Rx_1.Observable)
], SlickGrid.prototype, "resized", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], SlickGrid.prototype, "highlightedCells", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], SlickGrid.prototype, "blurredColumns", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], SlickGrid.prototype, "contextColumns", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], SlickGrid.prototype, "columnsLoading", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], SlickGrid.prototype, "showHeader", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], SlickGrid.prototype, "showDataTypeIcon", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], SlickGrid.prototype, "enableColumnReorder", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], SlickGrid.prototype, "enableAsyncPostRender", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Object)
], SlickGrid.prototype, "selectionModel", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Array)
], SlickGrid.prototype, "plugins", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Boolean)
], SlickGrid.prototype, "enableEditing", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Number)
], SlickGrid.prototype, "topRowNumber", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Function)
], SlickGrid.prototype, "overrideCellFn", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Function)
], SlickGrid.prototype, "isColumnEditable", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Function)
], SlickGrid.prototype, "isCellEditValid", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "loadFinished", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "editingFinished", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "contextMenu", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "topRowNumberChange", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "cellEditBegin", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "cellEditExit", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "rowEditBegin", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "rowEditExit", void 0);
__decorate([
    core_1.HostListener('focus'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SlickGrid.prototype, "onFocus", null);
SlickGrid = SlickGrid_1 = __decorate([
    core_1.Component({
        selector: 'slick-grid',
        template: '<div class="grid" (window:resize)="onResize()"></div>',
        providers: [gridsync_service_1.GridSyncService],
        encapsulation: core_1.ViewEncapsulation.None
    }),
    __param(0, core_1.Inject(core_1.forwardRef(() => core_1.ElementRef))),
    __param(1, core_1.Optional()), __param(1, core_1.Inject(core_1.forwardRef(() => gridsync_service_1.GridSyncService))),
    __metadata("design:paramtypes", [Object, Object])
], SlickGrid);
exports.SlickGrid = SlickGrid;
var SlickGrid_1;

//# sourceMappingURL=SlickGrid.js.map
