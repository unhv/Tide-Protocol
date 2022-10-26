// Tide Protocol - Infrastructure for the Personal Data economy
// Copyright (C) 2019 Tide Foundation Ltd
//
// This program is free software and is subject to the terms of
// the Tide Community Open Source License as published by the
// Tide Foundation Limited. You may modify it and redistribute
// it in accordance with and subject to the terms of that License.
// This program is distributed WITHOUT WARRANTY of any kind,
// including without any implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.
// See the Tide Community Open Source License for more details.
// You should have received a copy of the Tide Community Open
// Source License along with this program.
// If not, see https://tide.org/licenses_tcosl-1-0-en
// @ts-check

import { C25519Point, AESKey , ed25519Point} from "cryptide";
import ClientBase, { urlEncode, fromBase64 ,encodeBase64} from "./ClientBase";
import TranToken from "../TranToken";
import RandomResponse from "./RandomResponse";
import DnsEntry from "../DnsEnrty";
import superagent from "superagent";
import Guid from "../guid";

/** @typedef {{orkid: string, sign: string}} OrkSign */
export default class DAuthClient extends ClientBase {
  /**
   * @param {string|URL} url
   * @param {string|import("../guid").default} user
   */
  constructor(url, user, memory = false) {
    super(url, user, memory);
  }

  /** 
   * @param {ed25519Point} pass
   * @param {bigInt.BigInteger} li
   *  @returns {Promise<[ed25519Point, TranToken]>} */
  async ApplyPrism(pass, li = null) {
    let url = `/cmk/prism/${this.userGuid}/${urlEncode(pass.toArray())}`;
    if (li) {
      url += `?li=${li.toString(10)}`
    }

    const res = await this._get(url);
    return [ ed25519Point.from(fromBase64(res.body.prism)), TranToken.from(res.body.token) ]
  }

    /**
   * @param {import("../guid").default } tranid
   * @param {TranToken} token
   * @param {DnsEntry} entry
   * @param {ed25519Point} cmk2Pub
   * @param {bigInt.BigInteger} li
   * @returns {Promise<BigInt>}
   **/
    async signEntry(token, tranid, entry, partialPub, cmk2Pub, li) {
      const tkn = urlEncode(token.toArray());

      const resp = await this._get(`/cmk/sign/${this.userGuid}/${tkn}/${urlEncode(partialPub.toArray())}/${urlEncode(cmk2Pub.toArray())}?tranid=${tranid.toString()}&li=${li.toString(10)}`).set("Content-Type", "application/json").send(entry.toString())
        .ok(res => res.status < 500);
  
      if (!resp.ok) return  Promise.reject(new Error(resp.text));
      return BigInt(resp.text);
    }

  /**
   * @param { import("../guid").default } tranid
   * @param {TranToken} token
   * @param {ed25519Point} point
   * @param {bigInt.BigInteger} li
   **/
  async signIn(tranid, token, point, li = null) {
    const tkn = urlEncode(token.toArray());
    const pnt = urlEncode(point.toArray());

    let url = `/cmk/auth/${this.userGuid}/${pnt}/${tkn}?tranid=${tranid.toString()}`;
    if (li) {
      url += `&li=${li.toString(10)}`
    }

    const res = await this._get(url);
    return fromBase64(res.text);
  }

  /**
   * @param {bigInt.BigInteger} prismi
   * @param {bigInt.BigInteger} cmki
   * @param {AESKey} prismAuthi
   * @param {AESKey} cmkAuthi
   * @param {string} email
   * @returns {Promise<OrkSign>}
   */
  async signUp(prismi, cmki, prismAuthi, cmkAuthi, email) {
    var user = this.userGuid;
    var prism = urlEncode(prismi);
    var cmk = urlEncode(cmki);
    var prismAuth = urlEncode(prismAuthi.toString());
    var cmkAuth = urlEncode(cmkAuthi.toString());
    var mail = encodeURIComponent(email);

    var resp = (await this._put(`/cmk/${user}/${prism}/${cmk}/${prismAuth}/${cmkAuth}/${mail}`));
    if (!resp.ok || !resp.body && !resp.body.success) {
      const error = !resp.ok || !resp.body ? resp.text : resp.body.error;
      return  Promise.reject(new Error(error));
    }
    
    return resp.body.content;
  }

   /**
   * @param {ed25519Point} password
   * @param {ed25519Point} vendor
   * @param {import("../guid").default[]} ids
   * @returns {Promise<RandomResponse>}
   */
    async random(password, vendor, ids) {
      if (!ids || ids.length <= 0) throw Error('ids are not defined');
  
      const pass = urlEncode(password.toArray());
      const ven = urlEncode(vendor.toArray());
      const args = ids.map(id => `ids=${id}`).join('&');
  
      const resp = await this._get(`/cmk/random/${this.userGuid}?pass=${pass}&vendor=${ven}&${args}`)
        .ok(res => res.status < 500);
  
      if (!resp.ok) return Promise.reject(new Error(resp.text));
  
      return RandomResponse.from(resp.body);
    }
  
    /**
     * @param {import("./RandRegistrationReq").default} body
     * @param {ed25519Point} partialCmkPub
     * @param {ed25519Point} partialCmk2Pub
     * @returns {Promise<[OrkSign, string,ed25519Point,ed25519Point,bigint]>}
     */
    async randomSignUp(body, partialCmkPub, partialCmk2Pub, li) {
      if (!body) throw Error("The arguments cannot be null");
  
      const resp = await this._put(`/cmk/random/${this.userGuid}/${urlEncode(partialCmkPub.toArray())}/${urlEncode(partialCmk2Pub.toArray())}?li=${li.toString(10)}`).set("Content-Type", "application/json").send(JSON.stringify(body))
        .ok(res => res.status < 500);
  
      if (!resp.ok) return  Promise.reject(new Error(resp.text));
      return [resp.body.signature, resp.body.encryptedToken, ed25519Point.from(Buffer.from(resp.body.cmkPub, 'base64')),ed25519Point.from(Buffer.from(resp.body.cmk2Pub, 'base64')),BigInt(resp.body.s)];
    }

  /**
   * @param {bigInt.BigInteger} prismi
   * @param {AESKey} prismAuthi
   * @param {TranToken} token
   */
  async changePass(prismi, prismAuthi, token, withCmk = false) {
    var prism = urlEncode(prismi);
    var prismAuth = urlEncode(prismAuthi.toString());
    var tkn = urlEncode(token.toArray());

    await this._post(`/cmk/prism/${this.userGuid}/${prism}/${prismAuth}/${tkn}?withCmk=${withCmk}`);
  }
  
  async Recover() {
    await this._get(`/cmk/mail/${this.userGuid}`);
  }

  async confirm() {
    await this._post(`/cmk/${this.userGuid}`);
  }
}
