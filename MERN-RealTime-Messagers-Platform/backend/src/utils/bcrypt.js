"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareValue = exports.hashValue = void 0;
const bcryptjs_1 = require("bcryptjs");
const bcryptjs_1_default = bcryptjs_1.default || bcryptjs_1;
const hashValue = async (value, salt = 10) => {
    return await bcryptjs_1_default.hash(value, salt);
};
exports.hashValue = hashValue;
const compareValue = async (value, hashedVal) => {
    return await bcryptjs_1_default.compare(value, hashedVal);
};
exports.compareValue = compareValue;
