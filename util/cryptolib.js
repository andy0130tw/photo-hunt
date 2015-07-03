/**
 * Photo Hunt Crypto
 *
 * A utility used to encrypt the resources in the app.
 * @author Andy Pan
 */

var fs = require('fs');
var crypto = require('crypto');

var CryptoJS = require('crypto-js');

function wordToByteArray(wordArray) {
  var byteArray = [], word;
  for (var i = 0, c = wordArray.length; i < c; i++) {
    word = wordArray[i];
    for (var j = 3; j >= 0; j--) {
      byteArray.push((word >> 8 * j) & 0xFF);
    }
  }
  return byteArray;
}

function generateIV() {
  return cryptolib.bufferToWordArray(crypto.randomBytes(16));
}

// var pass = 'this is a key';
// var key = CryptoJS.SHA256(pass + salt);
// var iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');

// console.log('key=', key);


// var rstream = fs.createReadStream('img/image.gif');

// rstream.on('data', function(buf) {
//   var wordArray = CryptoJS.lib.WordArray.create(buf);
//   var encrypted = CryptoJS.AES.encrypt(wordArray, key, {iv: iv});
//   // console.log(encrypted.ciphertext.words);
//   var wstream = fs.createWriteStream('img-encrypted/image.gif.encrypted');

//   wstream.on('finish', function() {
//     fs.readFile('img-encrypted/image.gif.encrypted', function(err, data) {
//       if (err) throw err;
//       var arrbuf = new Uint8Array(data).buffer;
//       var ww = CryptoJS.lib.WordArray.create(arrbuf);

//       var ciphertext = CryptoJS.lib.CipherParams.create({ciphertext: ww});

//       var iv2 = CryptoJS.enc.Hex.parse('00000000022200000000111000000333');

//       var decrypted = CryptoJS.AES.decrypt(ciphertext, key, {iv: iv});
//       var str = new Buffer(decrypted.words);
//       console.log('decrypted, ', str.length);
//       var wwstream = fs.createWriteStream('img-encrypted/image-decrypted.gif');
//       wwstream.write(str);
//       wwstream.end();
//     })
//   });

//   wstream.write(new Buffer(wordToByteArray(encrypted.ciphertext.words)));
//   wstream.end();
// });

var salt = 'vBkkHieTzCSr8L i am the salt Ic59LnEHIxaix5';

var cryptolib = {
  spawnPassword: function(digits) {
    var rtn = '';
    for (var i = 0; i < digits; i++)
      rtn += Math.floor(Math.random() * 10);
    return rtn;
  },
  generateKey: function(passphrase) {
    return CryptoJS.SHA256(passphrase + salt);
  },
  readFile: function(path, options) {
    return new Uint8Array(fs.readFileSync(path, options)).buffer;
  },
  bufferToWordArray: function(buffer) {
    return CryptoJS.lib.WordArray.create(new Uint8Array(buffer).buffer);
  },
  writeEncryptedJSON: function(path, key, obj) {
    var json = JSON.stringify(obj);
    return cryptolib.writeEncrypted(path, key, json);
  },
  readEncryptedJSON: function(path, key, iv) {
    var decrypted = cryptolib.readEncrypted(path, key, iv);
    var plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    try {
      return JSON.parse(plaintext);
    } catch (e) {
      return null;
    }
  },
  writeEncrypted: function(path, key, data) {
    var encrypted = CryptoJS.AES.encrypt(data, key, {iv: generateIV()});
    var ciphertext = encrypted.ciphertext;
    fs.writeFileSync(path, new Buffer(wordToByteArray(ciphertext.words)));
    return encrypted;
  },
  readEncrypted: function(path, key, iv) {
    if (!iv) throw new Error('iv must be present.');
    var buf = fs.readFileSync(path);
    var ciphertext = cryptolib.bufferToWordArray(buf);
    var cipherParam = CryptoJS.lib.CipherParams.create({ciphertext: ciphertext});
    return CryptoJS.AES.decrypt(cipherParam, key, {iv: iv});
  }
};

module.exports = cryptolib;
