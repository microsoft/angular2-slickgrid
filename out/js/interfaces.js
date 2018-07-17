"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
const Rx_1 = require("rxjs/Rx");
var NotificationType;
(function (NotificationType) {
    NotificationType[NotificationType["Error"] = 0] = "Error";
    NotificationType[NotificationType["UpdateAvailable"] = 1] = "UpdateAvailable";
    NotificationType[NotificationType["UpdateDownloaded"] = 2] = "UpdateDownloaded";
})(NotificationType = exports.NotificationType || (exports.NotificationType = {}));
var CollectionChange;
(function (CollectionChange) {
    CollectionChange[CollectionChange["ItemsReplaced"] = 0] = "ItemsReplaced";
})(CollectionChange = exports.CollectionChange || (exports.CollectionChange = {}));
class CancellationToken {
    constructor() {
        this._isCanceled = false;
        this._canceled = new Rx_1.Subject();
    }
    cancel() {
        this._isCanceled = true;
        this._canceled.next(undefined);
    }
    get isCanceled() {
        return this._isCanceled;
    }
    get canceled() {
        return this._canceled;
    }
}
exports.CancellationToken = CancellationToken;

//# sourceMappingURL=interfaces.js.map
