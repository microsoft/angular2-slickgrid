"use strict";
const Rx_1 = require('rxjs/Rx');
(function (CollectionChange) {
    CollectionChange[CollectionChange["ItemsReplaced"] = 0] = "ItemsReplaced";
})(exports.CollectionChange || (exports.CollectionChange = {}));
var CollectionChange = exports.CollectionChange;
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
