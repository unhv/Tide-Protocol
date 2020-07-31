/**
 * Babel Starter Kit (https:
 *
 * Copyright © 2015-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { Hash } from "cryptide";
import BN from 'bn.js';

export default class Num64 {
    /** @param {number|BN} num */
    constructor(num=0) {
        this.num = typeof num === 'number' ? new BN(num) : num;
    }

    /** @returns {Uint8Array} */
    toArray() {
        const array = this.num.toArray('le');
        const buffer =  Buffer.alloc(8);
        buffer.set(array, 0);
        
        return buffer;
    }

    /** @param {Num64} number */
    add(number) { return new Num64(this.num.add(number.num)); }

    /** @param {Num64} number */
    mul(number) { return new Num64(this.num.mul(number.num)); }

    /** @param {Num64} number */
    sub(number) { return new Num64(this.num.sub(number.num)); }

    /** @param {Num64} number */
    div(number) { return new Num64(this.num.div(number.num)); }

    toString() { return this.num.toString(); }

    inspect() { return this.toString(); }

    /** @param {string|Uint8Array} data */
    static from(data) {
        return new Num64(typeof data === 'string'
            ? new BN(data) : new BN(data, 10, 'le'));
    }

    /** @param {string|Uint8Array} data */
    static seed(data) {
        return Num64.from(Hash.shaBuffer(data).slice(8));
    }
}