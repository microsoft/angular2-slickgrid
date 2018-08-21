/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import { Observable, Subject } from 'rxjs/Rx';

export enum NotificationType {
    Error,
    UpdateAvailable,
    UpdateDownloaded
}

export interface ISelectionRange {
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
}

export enum CollectionChange {
    ItemsReplaced
}

export interface IObservableCollection<T> {
    getLength(): number;
    at(index: number): T;
    getRange(start: number, end: number): T[];
    setCollectionChangedCallback(callback: (change: CollectionChange, startIndex: number, count: number) => void): void;
    resetWindowsAroundIndex(index: number): void;
}

export class CancellationToken {
    private _isCanceled: boolean = false;
    private _canceled: Subject<any> = new Subject<any>();

    cancel(): void {
        this._isCanceled = true;
        this._canceled.next(undefined);
    }

    get isCanceled(): boolean {
        return this._isCanceled;
    }

    get canceled(): Observable<any> {
        return this._canceled;
    }
}

export interface IGridColumnDefinition {
    id: string;
    type: number;
}

export interface ISlickColumn<T> extends Slick.Column<T> {
    isEditable?: boolean;
}
