"use strict";
(function (FieldType) {
    FieldType[FieldType["String"] = 0] = "String";
    FieldType[FieldType["Boolean"] = 1] = "Boolean";
    FieldType[FieldType["Integer"] = 2] = "Integer";
    FieldType[FieldType["Decimal"] = 3] = "Decimal";
    FieldType[FieldType["Date"] = 4] = "Date";
    FieldType[FieldType["Unknown"] = 5] = "Unknown";
})(exports.FieldType || (exports.FieldType = {}));
var FieldType = exports.FieldType;
