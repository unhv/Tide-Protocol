import DAuthFlow from "./dauth/DAuthFlow";
import IdGenerator from "./IdGenerator";
import request from "superagent";
import { encodeBase64Url } from "./Helpers";
import { AESKey } from "cryptide";

/**
 * A client-side library to interface with the Tide scosystem.
 * @class
 * @classdesc The main Tide class to initialize.
 */
class Tide {
  /**
   * Initialize Tide.
   *
   * @param {String} vendorId - Your designated VendorId in which you will operate
   * @param {String} serverUrl - The endpoint of your backend Tide server
   *
   */
  constructor(vendorId, serverUrl) {
    this.vendorId = vendorId;
    this.serverUrl = serverUrl;
  }

  /**
   * Create a new Tide account.
   *
   * This will generate a new Tide user using the provided username and providing a keypaid to manage the account (user-secret).
   *
   * @param {String} username - Plain text username of the new user
   * @param {String} password - Plain text password of the new user
   * @param {String} email - The recovery email to be used by the user.
   * @param {Array} orkIds - The desired ork nodes to be used for registration. An account can only be activated when all ork nodes have confirmed they have stored the shard.
   *
   * @fires progress
   *
   * @returns {AESKey} - The users keys to be used on the data
   */
  register(username, password, email, orkIds) {
    return new Promise(async (resolve, reject) => {
      try {
        // Some local validation, which is all we can really do.
        if (username.length < 3 || password.length < 6)
          return reject("Invalid credentials");

        var flow = new DAuthFlow(generateOrkUrls(orkIds), username);
        var userId = encodeBase64Url(new IdGenerator(username).buffer);
        // Ask the vendor to create the user as a liability.

        await post(`${this.serverUrl}/CreateUser/${userId}`, orkIds);
        event("progress", { progress: 20, action: "Initialized user" });

        // Send all shards to selected orks
        var key = await flow.signUp(password, email, 2);
        event("progress", { progress: 80, action: "Fragments stored" });

        // Finally, ask the vendor to confirm the user
        await get(`${this.serverUrl}/ConfirmUser/${userId}/`);
        event("progress", { progress: 100, action: "Finalized creation" });

        this.key = key;
        resolve({ key: key });
      } catch (error) {
        reject(error);
        // await get(`${this.serverUrl}/RollbackUser/${userId}/`);
      }
    });
  }

  /**
   * Login to a previously created Tide account. The account must be fully enabled by the vendor before use.
   *
   * This will generate a new Tide user using the provided username and providing a keypaid to manage the account (user-secret).
   *
   * @param {String} username - Plain text username of the user
   * @param {String} password - Plain text password of the user
   *
   * @returns {AESKey} - The users keys to be used on the data
   */
  login(username, password) {
    return new Promise(async (resolve, reject) => {
      try {
        var userId = encodeBase64Url(new IdGenerator(username).buffer);
        var userNodes = JSON.parse(
          await get(`${this.serverUrl}/GetUserNodes/${userId}`)
        );

        var flow = new DAuthFlow(
          generateOrkUrls(userNodes.map((un) => un.ork)),
          username
        );
        var keyTag = await flow.logIn(password);
        return resolve({ key: keyTag });
      } catch (error) {
        return reject(error);
      }
    });
  }

  /**
   * Strips all local user data from the browser.
   */
  logout() {
    this.key = null;
  }

  /**
   * Encrypt a string with the logged in user keys.
   *
   * This action requires a logged in user.
   *
   * @param {String} msg - The string you wish to encrypt using the user keys
   *
   * @returns {String} - The encrypted payload
   */
  encrypt(msg) {
    if (this.key == null) throw "You must be logged in to encrypt";
    return this.key.encryptStr(msg);
  }

  /**
   * Decrypt an encrypted string with the logged in user keys.
   *
   * This action requires a logged in user.
   *
   * @param {String} cipher - The encrypted string you wish to decrypt using the user keys
   *
   * @returns {String} - The plain text message
   */
  decrypt(cipher) {
    if (this.key == null) throw "You must be logged in to decrypt";
    return this.key.decryptStr(cipher);
  }

  /**
   * Send a request to the ORK nodes used by the user to email them recovery shards. This is step 1 in a 2 step process to recover the user keys.
   *
   * @param {String} username - The username of the user who wishes to recover
   */
  async recover(username) {
    var userId = encodeBase64Url(new IdGenerator(username).buffer);
    var userNodes = JSON.parse(
      await get(`${this.serverUrl}/GetUserNodes/${userId}`)
    );

    var flow = new DAuthFlow(
      generateOrkUrls(userNodes.map((un) => un.ork)),
      username
    );
    flow.Recover(username);
  }

  /**
   * Login to a previously created Tide account. The account must be fully enabled by the vendor before use.
   *
   * This will generate a new Tide user using the provided username and providing a keypaid to manage the account (user-secret).
   *
   * @param {String} username - Plain text username of the user
   * @param {Array} shares - An array of shares sent to the users email(s)
   * @param {String} newPass - The new password of the user
   */
  reconstruct(username, shares, newPass) {
    return new Promise(async (resolve, reject) => {
      try {
        var userId = encodeBase64Url(new IdGenerator(username).buffer);
        var userNodes = JSON.parse(
          await get(`${this.serverUrl}/GetUserNodes/${userId}`)
        );
        var urls = generateOrkUrls(userNodes.map((un) => un.ork));
        var flow = new DAuthFlow(urls, username);

        return resolve(await flow.Reconstruct(shares, newPass, urls.length));
      } catch (error) {
        return reject(error);
      }
    });
  }
}

function post(url, data) {
  return new Promise(async (resolve, reject) => {
    var r = (await request.post(url).send(data)).body;

    return r.success ? resolve(r.content) : reject(r.error);
  });
}

function get(url) {
  return new Promise(async (resolve, reject) => {
    var r = (await request.get(url)).body;
    return r.success ? resolve(r.content) : reject(r.error);
  });
}

function generateOrkUrls(ids) {
  return ids.map((id) => `https://${id}.azurewebsites.net`);
}

function event(name, payload) {
  const event = new CustomEvent(name, payload);
  document.dispatchEvent(event);
}

export default Tide;
