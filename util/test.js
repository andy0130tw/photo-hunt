/**
 * Photo Hunt Crypto Test
 *
 * A brief cover of used encrypting techniques.
 * NOTE that to verify the result, the content of path3
 * must be identical with path1.
 * @author Andy Pan
 */

var fs = require('fs');

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

var pass = 'this is a key';
var salt = 'and i am the salt';
var key = CryptoJS.SHA256(pass + salt);
var iv = CryptoJS.enc.Hex.parse('00000000000000000000000000000000');

var path1 = 'img/image.gif';
var path2 = 'img-encrypted/image.gif.encrypted';
var path3 = 'img-encrypted/image-decrypted.gif';

var buf = fs.readFileSync(path1);

var wordArray = CryptoJS.lib.WordArray.create(buf);
var encrypted = CryptoJS.AES.encrypt(wordArray, key, {iv: iv});

var wstream = fs.createWriteStream(path2);

wstream.on('finish', function() {
  fs.readFile(path2, function(err, data) {
    if (err) throw err;
    var arrbuf = new Uint8Array(data).buffer;
    var ww = CryptoJS.lib.WordArray.create(arrbuf);
    var ciphertext = CryptoJS.lib.CipherParams.create({ciphertext: ww});
    var decrypted = CryptoJS.AES.decrypt(ciphertext, key, {iv: iv});
    var plaintext = new Buffer(decrypted.words);
    var wwstream = fs.createWriteStream(path3);
    wwstream.write(plaintext);
    wwstream.end();
  });
});

wstream.write(new Buffer(wordToByteArray(encrypted.ciphertext.words)));
wstream.end();
