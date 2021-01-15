/**
 * Babel Starter Kit (https:
 *
 * Copyright © 2015-2016 Kriasoft, LLC. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Cipher from "../../src/Cipher";
import Num64 from "../../src/Num64";
import Validator from "validatorjs";
import classificator, { EmptyClassification } from "./classification";

/** @typedef {'bool'|'date'|'datetime'|'string'|'number'} MetaType */
/** @typedef {{value: string; text: string;}} MetaOption */

export default class MetaField {
  get value() { return this._value; }
  set value(val) { 
    if (this._isEncrypted)
      throw new Error('Value cannot be modified if it is encrypted')
    
    this._value = val;
  } 

  get isEncrypted() { return this._isEncrypted; }

  get isValid() {
    if (this._isEncrypted || !this.valRules) return true;

    return new Validator({val: this._value} , {val: this.valRules}).passes();
  }

  /**@type {MetaOption[]}*/
  get options() { return this._class.options(); }
  get isInput() { return this._class.fieldType === 'input'; }
  get isSelect() { return this._class.fieldType === 'select'; }
  //
  /**
   * @private
   * @param {string} field
   * @param {string} value
   **/
  constructor(field, value, isEncrypted = false) {
    this.field = field;

    /**@type {MetaType}*/
    this.type = 'string';

    /**@type {string}*/
    this.valRules = null;

    /**@private*/
    this._value = value;

    /**@private*/
    this._isEncrypted = isEncrypted;

    /**@private*/
    this._previous = new Uint8Array();

    /**@private*/
    this._class = new EmptyClassification();
  }

  classify() {
    return this._class.classify();
  }

  /**
   * @param {import("cryptide").C25519Key} key
   * @param {Num64} tag
   */
  encrypt(key, tag = null) {
    if (this._isEncrypted)
      throw new Error(`Data is already encrypted`);

    const tagCipher = tag ||
      (this._previous.length && Cipher.tag(this._previous)) || new Num64(0);
    
    this._value = Cipher.encrypt(this._value, tagCipher, key).toString('base64');
    this._isEncrypted = true;
  }

  /** @param {import("cryptide").C25519Key} key */
  decrypt(key) {
    if (!this._isEncrypted)
      throw new Error(`Data is already decrypted`);

    this._previous = Buffer.from(this._value, 'base64');

    this._value = Buffer.from(Cipher.decrypt(this._previous, key)).toString('utf-8');
    this._isEncrypted = false;
  }

  /**
   * @param {string} field
   * @param {string} value
   * @param {boolean} isEncrypted
   * @returns {MetaField}
   */
  static fromText(field, value, isEncrypted) {
    return new MetaField(field, value || '', isEncrypted);
  }

  /**
  * @param {object} data
  * @param {boolean} encrypted
  * @param {object} [validation]
  * @param {object} [classification]
  * @returns {MetaField[]}
  */
  static fromModel(data, encrypted, validation, classification) {
    if (!data) return [];
    
    return Object.keys(data).map(field => {
      var fld = MetaField.fromText(field, data[field].toString(), encrypted);
      
      if (validation && validation[field]) fld.valRules = validation[field];
      if (classification && classification[field]) fld._class = classificator(fld, classification[field]);
      
      return fld;
    });
  }

  /**
   * @param {MetaField[]} fields
   * @returns {object}
   */
  static buildModel(fields) {
    if (!fields || !fields.length) throw new Error('It cannot build a model with empty fields');
    if (fields.some(field => !field._isEncrypted)) throw new Error('All fields must be encrypted');

    const model = {};
    for (const field of fields) {
      model[field.field] = field.value;
    }
    return model;
  }

  /**
   * @param {MetaField[]} fields
   * @returns {object}
   */
  static buildClassification(fields) {
    if (!fields || !fields.length || fields.some(field => field._isEncrypted)) return null;

    let count = 0;
    const model = {};
    for (const field of fields) {
      const classification = field.classify();
      if (classification !== null) {
        model[field.field] = classification;
        count++;
      }
    }
    
    return count > 0 ? model : null;
  }
}
