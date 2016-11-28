import { Component, OnInit } from '@angular/core';
import { IObservableCollection, IGridDataRow, IColumnDefinition, FieldType,
    VirtualizedCollection } from './../../index';

const numberOfColumns = 10;
const numberOfRows = 200;

@Component({
    selector: 'my-app',
    template: `<slick-grid [columnDefinitions]="columnDefinitions"
                           [dataRows]="dataRows"
                           (selectionModel)="selectionModel">
               </slick-grid>`
})
export class AppComponent implements OnInit {
    private dataRows: IObservableCollection<IGridDataRow>;
    private columnDefinitions: IColumnDefinition[];
    // tslint:disable-next-line:no-unused-variable
    private selectionModel = 'CellSelectionModel';

    ngOnInit(): void {
        // generate columns
        let columns: IColumnDefinition[] = [];
        for (let i = 0; i < numberOfColumns; i++) {
            columns.push({
                id: i.toString(),
                name: i.toString(),
                type: this.randomType()
            });
        }
        let loadDataFunction = (offset: number, count: number): Promise<IGridDataRow[]> => {
            return new Promise<IGridDataRow[]>((resolve) => {
                let data: IGridDataRow[] = [];
                for (let i = offset; i < offset + count; i++) {
                    let row: IGridDataRow = {
                        values: []
                    };
                    for (let j = 0; j < numberOfColumns; j++) {
                        row.values.push(`column ${j}; row ${i}`);
                    }
                    data.push(row);
                }
                resolve(data);
            });
        };
        this.dataRows = new VirtualizedCollection<IGridDataRow>(50,
                                                                numberOfRows,
                                                                loadDataFunction,
                                                                (index) => {
                                                                    return { values: []};
                                                                });
        this.columnDefinitions = columns;
    }

    private randomType(): FieldType {
        let types = [FieldType.Boolean, FieldType.Date, FieldType.Decimal, FieldType.Integer,
                    FieldType.String];
        let rand = Math.floor(Math.random() * (types.length - 0 + 1));
        return types[rand];
    }
}
