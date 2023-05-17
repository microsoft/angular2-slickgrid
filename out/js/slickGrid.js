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
////////// Text Editors ///////////////////////////////////////////////////////
function getOverridableTextEditorClass(grid) {
    class OverridableTextEditor {
        constructor(_args) {
            this._args = _args;
            this._textEditor = new Slick.Editors.Text(_args);
            const END = 35;
            const HOME = 36;
            // These are the special keys the text editor should capture instead of letting
            // the grid handle them
            this.keyCaptureList = [END, HOME];
        }
        destroy() {
            this._textEditor.destroy();
        }
        focus() {
            this._textEditor.focus();
        }
        getValue() {
            return this._textEditor.getValue();
        }
        setValue(val) {
            this._textEditor.setValue(val);
        }
        loadValue(item, rowNumber) {
            if (grid.overrideCellFn) {
                let overrideValue = grid.overrideCellFn(rowNumber, this._args.column.id, item[this._args.column.id]);
                if (overrideValue !== undefined) {
                    item[this._args.column.id] = overrideValue;
                }
            }
            this._textEditor.loadValue(item);
        }
        serializeValue() {
            return this._textEditor.serializeValue();
        }
        applyValue(item, state) {
            let activeRow = grid.activeCell.row;
            let currentRow = grid.dataRows.at(activeRow);
            let colIndex = grid.getColumnIndex(this._args.column.name);
            let dataLength = grid.dataRows.getLength();
            // If this is not the "new row" at the very bottom
            if (activeRow !== dataLength) {
                currentRow[colIndex] = state;
                this._textEditor.applyValue(item, state);
            }
        }
        isValueChanged() {
            return this._textEditor.isValueChanged();
        }
        validate() {
            let activeRow = grid.activeCell.row;
            let result = { valid: true, msg: undefined };
            let colIndex = grid.getColumnIndex(this._args.column.name);
            let newValue = this._textEditor.getValue();
            // TODO: It would be nice if we could support the isCellEditValid as a promise
            if (grid.isCellEditValid && !grid.isCellEditValid(activeRow, colIndex, newValue)) {
                result.valid = false;
            }
            return result;
        }
    }
    return OverridableTextEditor;
}
exports.getOverridableTextEditorClass = getOverridableTextEditorClass;
////////// Implementation /////////////////////////////////////////////////////
let SlickGrid = class SlickGrid {
    ////////// Constructor and Angular functions //////////////////////////////
    constructor(_el) {
        this._el = _el;
        this.highlightedCells = [];
        this.blurredColumns = [];
        this.contextColumns = [];
        this.columnsLoading = [];
        this.showHeader = true;
        this.enableColumnReorder = false;
        this.enableAsyncPostRender = false;
        this.selectionModel = '';
        this.plugins = [];
        this.enableEditing = false;
        this.loadFinished = new core_1.EventEmitter();
        // SLickGrid Events
        this.onContextMenu = new core_1.EventEmitter();
        this.onScroll = new core_1.EventEmitter();
        this.onActiveCellChanged = new core_1.EventEmitter();
        this.onBeforeEditCell = new core_1.EventEmitter();
        this.onCellChange = new core_1.EventEmitter();
        this.onRendered = new core_1.EventEmitter();
        this._rowHeight = 29;
        this.getFormatter = (column) => {
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
        this._gridData = {
            getLength: () => {
                return this.dataRows && this._gridColumns ? this.dataRows.getLength() : 0;
            },
            getItem: (index) => {
                return !this.dataRows ? undefined : this.dataRows.at(index);
            },
            getRange: (start, end) => {
                return !this.dataRows ? undefined : this.dataRows.getRange(start, end);
            },
            getItemMetadata: undefined
        };
    }
    onFocus() {
        if (this._grid) {
            this._grid.focus();
        }
    }
    set rowHeight(val) {
        this._rowHeight = val;
        if (this._grid) {
            this._grid.setOptions({ rowHeight: this.rowHeight });
        }
    }
    get rowHeight() {
        return this._rowHeight;
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
            }
            else {
                this._grid.resetActiveCell();
            }
        }
        if (wasEditing && hasGridStructureChanges) {
            this._grid.editActiveCell();
        }
    }
    ngOnInit() {
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
        let selectionModel = this._grid.getSelectionModel();
        if (selectionModel && selectionModel.getSelectedRanges) {
            return selectionModel.getSelectedRanges();
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
    }
    // Set the grid's selection
    set selection(ranges) {
        if (typeof ranges === 'boolean') {
            if (ranges) {
                let rows = [];
                for (let i = 0; i < this._grid.getDataLength(); i++) {
                    rows.push(i);
                }
                this._grid.setSelectedRows(rows);
            }
            else {
                this._grid.setSelectedRows([]);
            }
        }
        else {
            let selectionModel = this._grid.getSelectionModel();
            if (selectionModel && selectionModel.setSelectedRanges) {
                selectionModel.setSelectedRanges(ranges);
            }
        }
    }
    ////////// Private functions //////////////////////////////////////////////
    initGrid() {
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
            enableAddRow: false,
            enableAsyncPostRender: this.enableAsyncPostRender,
            editorFactory: {
                getEditor: (column) => this.getColumnEditor(column)
            },
            formatterFactory: {
                getFormatter: this.getFormatter
            },
            disableColumnBasedCellVirtualization: true,
            enableInGridTabNavigation: false
        };
        this._grid = new Slick.Grid(this._el.nativeElement.getElementsByClassName('grid')[0], this._gridData, this._gridColumns, options);
        if (this.selectionModel) {
            if (typeof this.selectionModel === 'object') {
                this._grid.setSelectionModel(this.selectionModel);
            }
            else if (typeof this.selectionModel === 'string' && Slick[this.selectionModel] && typeof Slick[this.selectionModel] === 'function') {
                this._grid.setSelectionModel(new Slick[this.selectionModel]());
            }
            else {
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
    changeEditSession(enabled) {
        this.enableEditing = enabled;
        let options = this._grid.getOptions();
        options.editable = enabled;
        options.enableAddRow = false; // TODO change to " options.enableAddRow = false;" when we support enableAddRow
        this._grid.setOptions(options);
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
    getColumnEditor(column) {
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
    }
    setupEvents() {
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
        this._grid.onBeforeAppendCell.subscribe((e, args) => {
            // Since we need to return a string here, we are using calling a function instead of event emitter like other events handlers
            return this.onBeforeAppendCell ? this.onBeforeAppendCell(args.row, args.cell) : undefined;
        });
        this._grid.onRendered.subscribe((e, args) => {
            this.onRendered.emit(args);
        });
    }
    updateSchema() {
        if (!this.columnDefinitions) {
            return;
        }
        this._gridColumns = this.columnDefinitions;
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
    get activeCell() {
        return this._grid.getActiveCell();
    }
    renderGridDataRowsRange(startIndex, count) {
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
], SlickGrid.prototype, "isCellEditValid", void 0);
__decorate([
    core_1.Input(),
    __metadata("design:type", Function)
], SlickGrid.prototype, "onBeforeAppendCell", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "loadFinished", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "onContextMenu", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "onScroll", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "onActiveCellChanged", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "onBeforeEditCell", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "onCellChange", void 0);
__decorate([
    core_1.Output(),
    __metadata("design:type", core_1.EventEmitter)
], SlickGrid.prototype, "onRendered", void 0);
__decorate([
    core_1.HostListener('focus'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SlickGrid.prototype, "onFocus", null);
__decorate([
    core_1.Input(),
    __metadata("design:type", Number),
    __metadata("design:paramtypes", [Number])
], SlickGrid.prototype, "rowHeight", null);
SlickGrid = __decorate([
    core_1.Component({
        selector: 'slick-grid',
        template: '<div class="grid" (window:resize)="onResize()"></div>',
        encapsulation: core_1.ViewEncapsulation.None
    }),
    __param(0, core_1.Inject(core_1.forwardRef(() => core_1.ElementRef))),
    __metadata("design:paramtypes", [Object])
], SlickGrid);
exports.SlickGrid = SlickGrid;

//# sourceMappingURL=slickGrid.js.map
