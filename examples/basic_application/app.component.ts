import { Component, OnInit } from '@angular/core';
import { IObservableCollection,
    VirtualizedCollection } from './../../out/index';

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
    private dataRows: IObservableCollection<{}>;
    private columnDefinitions: Slick.Column<any>[];
    // tslint:disable-next-line:no-unused-variable
    private selectionModel = 'CellSelectionModel';

    ngOnInit(): void {
        // generate columns
        let columns: Slick.Column<any>[] = [];
        for (let i = 0; i < numberOfColumns; i++) {
            columns.push({
                id: i.toString(),
                name: i.toString()
            });
        }
        let loadDataFunction = (offset: number, count: number): Promise<{}[]> => {
            return new Promise<{}[]>((resolve) => {
                let data: {}[] = [];
                for (let i = offset; i < offset + count; i++) {
                    let row = {};
                    for (let j = 0; j < numberOfColumns; j++) {
                        row[j.toString()] = `column ${j}; row ${i}`;
                    }
                    data.push(row);
                }
                resolve(data);
            });
        };
        this.dataRows = new VirtualizedCollection<{}>(50,
                                                                numberOfRows,
                                                                loadDataFunction,
                                                                (index) => {
                                                                    return { values: []};
                                                                });
        this.columnDefinitions = columns;
    }
}
