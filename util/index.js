/**
 * Photo Hunt Crypto
 *
 * A utility used to encrypt the resources in the app.
 * @author Andy Pan
 */

var fs = require('fs');

var mkdirp = require('mkdirp');
var CryptoJS = require('crypto-js');

var cryptolib = require('./cryptolib');
var config = require('./config');

['assets-encrypted', 'key-encrypted', 'data'].forEach(function(v) {
  mkdirp(v, function(err) {
    if (err) throw err;
  });
});

var defs = config.defs;

// it contains essential paths, and is used in the main app
var datafile = {};
// it contains main password for each image
var report = {};

var count = config.count || 1;

for (var x in defs) {
  console.log('using entry = ' + x);

  var entry = defs[x];

  datafile[x] = {
    keypath: [],
    keyivs: [],
    imagepath: []
  };

  // for safety, IVs should not be reused, thus, every image has its own IV
  var keyfile = {
    key: {},
    iv: {}
  };
  keyfile.meta = entry.meta;

  if (entry.image) {
    entry.image.forEach(function(v, i) {
      // for image encryption
      var passphraseImage = cryptolib.spawnPassword(8);
      var keyImage = cryptolib.generateKey(passphraseImage);

      var encryptedImagePath = 'assets-encrypted/' + v + '.enc';
      datafile[x].imagepath.push(encryptedImagePath);

      console.log('  reading image ' + v);
      var buf = cryptolib.readFile('assets/' + v);
      var warr = cryptolib.bufferToWordArray(buf);
      console.log('  encrypting ' + v);
      var encrypted = cryptolib.writeEncrypted(encryptedImagePath, keyImage, warr);
      var iv = encrypted.iv;

      // write out keyfile
      keyfile.key[encryptedImagePath] = keyImage.toString(CryptoJS.enc.Base64);
      keyfile.iv[encryptedImagePath] = iv.toString(CryptoJS.enc.Base64);
      console.log(keyfile);
    });
  }

  report[x] = [];

  for (var i = 0; i < count; i++) {
    // just for bigger file sizes
    keyfile.random = cryptolib.spawnPassword(24);

    // for encrypting key file; one password each
    var passphrase = cryptolib.spawnPassword(8);
    // add some small salt
    var key = cryptolib.generateKey(passphrase + 'LM2015LM2015');

    var encryptedKeyPath = 'key-encrypted/' + x + '-' + i + '.enc';
    var encrypted = cryptolib.writeEncryptedJSON(encryptedKeyPath, key, keyfile);

    datafile[x].keypath.push(encryptedKeyPath);
    datafile[x].keyivs.push(encrypted.iv.toString(CryptoJS.enc.Base64));

    // write out passphrase for keyfiles
    report[x].push(passphrase);
  }
}

fs.writeFileSync('data/report.json', JSON.stringify(report));
fs.writeFileSync('data/data.json', JSON.stringify(datafile));


// var encrypted = cryptolib.writeEncryptedJSON('enc.json.enc', key, json);
// var iv = encrypted.iv;
// console.log(cryptolib.readEncryptedJSON('enc.json.enc', key, iv));
