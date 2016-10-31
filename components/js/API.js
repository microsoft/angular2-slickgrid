"use strict";
(function (NotificationType) {
    NotificationType[NotificationType["Error"] = 0] = "Error";
    NotificationType[NotificationType["UpdateAvailable"] = 1] = "UpdateAvailable";
    NotificationType[NotificationType["UpdateDownloaded"] = 2] = "UpdateDownloaded";
})(exports.NotificationType || (exports.NotificationType = {}));
var NotificationType = exports.NotificationType;
