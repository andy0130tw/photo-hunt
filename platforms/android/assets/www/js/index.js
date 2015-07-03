/**
 * Photo Hunt v1
 * @author Andy Pan, Yu-Ren Pan
 *
 * Main JS code integrated with Cordova native libraries.
 */

var app = window.app = angular.module('app', ['ngCordova', 'ui.router']);

app.config(['$stateProvider', function($stateProvider) {
  $stateProvider.state('threadList', {
    templateUrl: 'templates/threadList.html',
    controller: 'threadListCtrl'
  });
  $stateProvider.state('welcome', {
    templateUrl: 'templates/welcome.html'
  });
}]);

app.run(['$rootScope', function($rootScope) {
  if (!localStorage || !JSON) {
    alert('此 App 不支援您的裝置！');
  }
  var rathr = localStorage.getItem('phunt-availableThreads');
  var athr;
  if (!rathr) {
    athr = ['opening'];
    localStorage.setItem('phunt-availableThreads', JSON.stringify(athr));
  } else {
    try {
      athr = JSON.parse(rathr);
    } catch (e) {
      //
    }
  }
  $rootScope.availableThreads = athr;
}]);

app.controller('rootCtrl', [
  '$rootScope',
  '$state',
  '$cordovaFile',
  function($rootScope, $state, $cordovaFile) {

    $rootScope.showPwdEnterModal = function() {
      $('#__model_pwd_enter').modal('show');
    };

    // check game progress
    var isRegistered = $rootScope.isRegistered = localStorage.getItem('phunt-isRegistered');
    if (isRegistered) {
      $state.go('threadList');
    } else {
      $state.go('welcome');
    }

    var tlist = [];
    try {
      var locTlist = localStorage.getItem('phunt-threadList');
      if (locTlist)
        tlist = JSON.parse(locTlist);
    } catch (e) {
      //
    }

    localStorage.setItem('phunt-threadList', JSON.stringify(tlist));
    $rootScope.threadList = tlist;

    document.addEventListener('deviceready', function() {
      $cordovaFile.readAsArrayBuffer(cordova.file.applicationDirectory, 'www/key-encrypted/opening-0.enc')
        .then(function(result) {
          // var b64 = res.toString(CryptoJS.enc.Base64);
          // $('#testImg').attr('src', 'data:image/gif;base64,' + b64);
        },function(error) {
          alert(error.toString());
        });
    }, false);

}]);

app.controller('navbarCtrl', ['$rootScope', '$scope', '$state', function($rootScope, $scope, $state) {
  $scope.gotoState = function(stateName) {
    if (stateName == 'threadList') {
      if (!$rootScope.isRegistered) {
        $state.go('welcome');
      }
    }
    $state.go(stateName);
  };
}]);

app.controller('welcomeCtrl', ['$scope', function($scope) {

}]);

app.controller('threadListCtrl', ['$scope', function($scope) {
  var testObj = {
    photo: 'img/testimg.jpg',
    idenifier: 'ABC88DEF',
    ts: new Date(),
    desc: 'Found. Use it wisely.',
    title: 'Test Image Only'
  }, testObj2 = {
    photo: 'http://lorempixel.com/600/400/nature/?c',
    idenifier: 'ABC88DEF',
    ts: new Date(),
    desc: 'Got. Use it amazingly.',
    title: 'A Mystery Item'
  }, testObj3 = {
    photo: 'http://lorempixel.com/600/400/nature/?b',
    idenifier: 'ABC88DEF',
    ts: new Date(),
    desc: 'Hello, world.',
    title: 'All of the World'
  }, testObj4 = {
    title: 'Start your journey!',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut '
  };

  $scope.threads = [testObj, testObj2, testObj3, testObj4];
}]);

app.controller('modalPwdEnterCtrl', [
  '$rootScope',
  '$scope',
  '$state',
  '$q',
  '$cordovaFile',
  'cryptoAPI',
  function($rootScope, $scope, $state, $q, $cordovaFile, cryptoAPI) {
    $scope.pwdField = '';

    function updateThreads() {
      var athr = $rootScope.availableThreads;
      var athrh = $scope.athrh = {};
      for (var i = 0, c = athr.length; i < c; i++) {
        athrh[athr[i]] = true;
      }
      console.log(athrh);
    }

    updateThreads();

    $scope.checkPwd = function() {
      var pwd = $scope.pwdField;
      for (var x in $scope.athrh) {
        var keyhint = keyinfo[x];
        var keypath = keyhint.keypath;
        var keyivs = keyhint.keyivs;
        var len = keypath.length;

        var decryptProc = [];

        function checkPwdIterated(n, cbSuccess, cbNext) {
          $cordovaFile.readAsArrayBuffer(
            cordova.file.applicationDirectory, 'www/' + keypath[n]
          ).then(function(result) {
            var json = cryptoAPI.decryptJSON(result, pwd, keyivs[n]);
            if (json)
              cbSuccess(keyhint, json);
            else {
              // console.log('checkPwd failed', n);
              cbNext();
            }
          }, function(err) {
            console.warn('checkPwd err', err, n, keypath[n]);
          });
        };

        function checkPwdFailed() {
          $scope.pwdFailed = true;
        }

        function checkPwdSuccess(keyhint, json) {
          if (!$rootScope.isRegistered) {
            $rootScope.isRegistered = true;
            localStorage.setItem('phunt-isRegistered', '1');
            $state.go('threadList');
          }

          var thread = json.meta;
          thread.ts = new Date();
          $rootScope.threadList.push(thread);
          localStorage.setItem('phunt-threadList', JSON.stringify($rootScope.threadList));

          console.log(JSON.stringify(json));

          // decrypt image
          if (keyhint.imagepath.length) {
            var path = keyhint.imagepath[0];
            var key = CryptoJS.enc.Base64.parse(json.key[path]);
            var iv = json.iv[path];
            $cordovaFile.readAsArrayBuffer(
              cordova.file.applicationDirectory, 'www/' + path
            ).then(function(result) {
              var data = cryptoAPI.decryptImage(result, key, iv);
              var b64 = data.toString(CryptoJS.enc.Base64);
              $('#mainContent').html('<img id="textImg"/>');
              $('#testImg').attr('src', 'data:image/gif;base64,' + b64);
            }, function(err) {
              console.log('err reading enc image', err);
            });
          }

          // replace flow
          $rootScope.availableThreads = thread.next;
          localStorage.setItem('phunt-availableThreads', JSON.stringify(thread.next));
          updateThreads();

          // goal detection
          if (json.meta.goal) {
            alert('恭喜完成！');
          }
        }

        var counter = 0;
        var cbn = function() {
          counter++;
          if(counter < len)
            checkPwdIterated(counter, checkPwdSuccess, cbn);
          else
            checkPwdFailed();
        };
        checkPwdIterated(0, checkPwdSuccess, cbn);
      }
      // iterate over
      // if success
    };
}]);

app.factory('cryptoAPI', [function(){
  var salt = 'vBkkHieTzCSr8L i am the salt Ic59LnEHIxaix5';
  var saltLM = 'LM2015LM2015';

  function decrypt(arraybuf, password, ivBase64) {
    var res = CryptoJS.lib.WordArray.create(arraybuf);
    var ciphertext = CryptoJS.lib.CipherParams.create({ciphertext: res});
    var key = CryptoJS.SHA256(password);
    var iv = CryptoJS.enc.Base64.parse(ivBase64);
    return CryptoJS.AES.decrypt(ciphertext, key, {iv: iv});
  }

  return {
    decryptJSON: function(arraybuf, password, ivBase64) {
      var decrypted = decrypt(arraybuf, password + saltLM + salt, ivBase64);
      try {
        return JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));
      } catch (e) {
        return null;
      }
    },
    decryptImage: function(arraybuf, password, ivBase64) {
      return decrypt(arraybuf, password + salt, ivBase64);
    }
  };
}]);

/*app.factory('FileAPI', function() {
  return {
    readFileArrayBuffer: function(path, callback) {
      var filename =  + path;
      var callbackWrapper = function(self, isSuccess) {
        if (isSuccess)
          return function() {
            callback(null, self.result);
          };
        return function(e) {
          callback(e, self);
        }
      };
      resolveLocalFileSystemURL(filename, function(fileEntry) {
        fileEntry.file(function(file) {
          var reader = new FileReader();
          reader.onload = callbackWrapper(reader, true);
          reader.onerror = callbackWrapper(reader, false);
          reader.readAsArrayBuffer(file);
        });
      }, function(e) {
        callbackWrapper(reader, false)(e);
      });
    }
  };
});*/

var keyinfo = {"opening":{"keypath":["key-encrypted/opening-0.enc","key-encrypted/opening-1.enc","key-encrypted/opening-2.enc","key-encrypted/opening-3.enc","key-encrypted/opening-4.enc","key-encrypted/opening-5.enc","key-encrypted/opening-6.enc","key-encrypted/opening-7.enc"],"keyivs":["olu1ZS0yy+4Oe6cuLjaSCw==","tI6hYOIIbdYgxhyA9dIQFA==","f0p8zI2dJ6CBVCKaD6BTpA==","Q0Nq+uiB3U6bD6ugeSu/3g==","Qk4wNZbZZ2H1sZUtidWxdw==","MHs9+jBm0FJTfNpP6mKwGQ==","ElngXcYWVJgTvpW9zRXwKg==","eKPuEV+pgbtuFaD0f7TJOw=="],"imagepath":[]},"stage1":{"keypath":["key-encrypted/stage1-0.enc","key-encrypted/stage1-1.enc","key-encrypted/stage1-2.enc","key-encrypted/stage1-3.enc","key-encrypted/stage1-4.enc","key-encrypted/stage1-5.enc","key-encrypted/stage1-6.enc","key-encrypted/stage1-7.enc"],"keyivs":["IKa08ep5uNKnv2/JCq2cDA==","SisBia+12SmlJq5JmUtZ5A==","OfFGdZczF1/B6NUxM9FOlA==","Cy/8uWy81Yf8al6S2iWVUA==","pj9MuKPuJr7EdVxQj1ewAg==","glkpD4vz1J9k6nZ/10jzSg==","QpHqZzzvN5HMRnJPuaqeDg==","jeondrNTQtlgEqpdH1WxvQ=="],"imagepath":["assets-encrypted/stage1.jpg.enc"]},"stage2a":{"keypath":["key-encrypted/stage2a-0.enc","key-encrypted/stage2a-1.enc","key-encrypted/stage2a-2.enc","key-encrypted/stage2a-3.enc","key-encrypted/stage2a-4.enc","key-encrypted/stage2a-5.enc","key-encrypted/stage2a-6.enc","key-encrypted/stage2a-7.enc"],"keyivs":["I+z26UWNjxq4cLmXp0G5tA==","VKbtMV9V+iuZ2n5j4CnTIw==","Zjv98nUD/yMtZxVDJWFkrQ==","v/Ll+uOxh26k5axjdvzeTQ==","stSnDvLI0q3oZHCIclE3fw==","/RdSeADWhXw0hc16YwQJhw==","HyoNmuNYZDWyyhbVQLOlcQ==","M7G5pbsoGyzXoUIuZE1WzA=="],"imagepath":["assets-encrypted/stage2a.jpg.enc"]},"stage2b":{"keypath":["key-encrypted/stage2b-0.enc","key-encrypted/stage2b-1.enc","key-encrypted/stage2b-2.enc","key-encrypted/stage2b-3.enc","key-encrypted/stage2b-4.enc","key-encrypted/stage2b-5.enc","key-encrypted/stage2b-6.enc","key-encrypted/stage2b-7.enc"],"keyivs":["Gr4C5EUhTsiQ4q93T3K4eA==","LwaOGStmsXzQ5GphEJLBog==","RLAmPX5TuN2k+b1mVt+01g==","QAIveKoY7h7ETTRtreLuQg==","G7I3vIZ5qYi8bEFXTEs8Uw==","tLOJe1wmaTczXy+bRjcGkA==","A8ZSfA6GUJEhvGRyl6NrNQ==","7lhXgqzQ3ybabtSjTSJcnQ=="],"imagepath":["assets-encrypted/stage2b.jpg.enc"]},"stage2c":{"keypath":["key-encrypted/stage2c-0.enc","key-encrypted/stage2c-1.enc","key-encrypted/stage2c-2.enc","key-encrypted/stage2c-3.enc","key-encrypted/stage2c-4.enc","key-encrypted/stage2c-5.enc","key-encrypted/stage2c-6.enc","key-encrypted/stage2c-7.enc"],"keyivs":["t4TCpdNMZ3zOk1k3sdOJYA==","sH07S586ze9cBVkUc7uB9A==","AP1kQPOgydbryxzsw+iqew==","mxzvSwz+oPR5WUmDCHUIKQ==","18/Gw+0dBLSrJjdvNQwkAA==","YPuGwqekjzHDBOjxPj0+1A==","3bo/2Duoc8VdgWgCPp3g3Q==","VvXdBdRUzxTb/96036sp6A=="],"imagepath":["assets-encrypted/stage2c.jpg.enc"]},"stage3":{"keypath":["key-encrypted/stage3-0.enc","key-encrypted/stage3-1.enc","key-encrypted/stage3-2.enc","key-encrypted/stage3-3.enc","key-encrypted/stage3-4.enc","key-encrypted/stage3-5.enc","key-encrypted/stage3-6.enc","key-encrypted/stage3-7.enc"],"keyivs":["IR/SwmOrCljl6bEVE5PFaw==","aJLSKy0PlUgK1BZHBYn09A==","D03Otzf+msy6fPNJpJzoJg==","yb0/oN/baeFOGsawMMu1gA==","7nG72Nc5mwyXMTDmKiZ6TA==","4guIii+YHxqU7hKyJoAt+Q==","folJe/kMfwVG+kHDY5zQEg==","/7W4DFKJgVJY3cu8w0ACpA=="],"imagepath":["assets-encrypted/stage3.jpg.enc"]},"stage4a":{"keypath":["key-encrypted/stage4a-0.enc","key-encrypted/stage4a-1.enc","key-encrypted/stage4a-2.enc","key-encrypted/stage4a-3.enc","key-encrypted/stage4a-4.enc","key-encrypted/stage4a-5.enc","key-encrypted/stage4a-6.enc","key-encrypted/stage4a-7.enc"],"keyivs":["/9SASfFYOkWPSxeYjDUUtw==","ufBbTTQFjb3xT8iQx6Cw0Q==","6Nxj7e82quqI8rGRKU9aiw==","kmRltEU7NaxeV2FhLQf3pg==","HDHVLjwXm8N1L2mLpqbQpw==","ge784gXyRgQhOYiHwOpwbQ==","b3Zl+sgdVnqw1jw4T6RYkg==","fiqrd0GlQRxdQ4Y2yV8zcw=="],"imagepath":["assets-encrypted/stage4a.jpg.enc"]},"stage4b":{"keypath":["key-encrypted/stage4b-0.enc","key-encrypted/stage4b-1.enc","key-encrypted/stage4b-2.enc","key-encrypted/stage4b-3.enc","key-encrypted/stage4b-4.enc","key-encrypted/stage4b-5.enc","key-encrypted/stage4b-6.enc","key-encrypted/stage4b-7.enc"],"keyivs":["Y8O/Tq/6Qv7Ku3pu2XwjNg==","ocvb+ET3bgIyZjZxD6HD0g==","sld6HW7PezuTW5K4GvjeGQ==","UYM9Saj+oVl4zUBLw9TSpw==","uCA+VYQvPrUBmlFMERl6Ng==","KWOdU3AypMDJvSO1fxM8vQ==","KBLMaO1EkNJag6XT2s5F8Q==","ilyrhF7/+mGEQm+lwc4Jzw=="],"imagepath":["assets-encrypted/stage4b.jpg.enc"]},"stage4c":{"keypath":["key-encrypted/stage4c-0.enc","key-encrypted/stage4c-1.enc","key-encrypted/stage4c-2.enc","key-encrypted/stage4c-3.enc","key-encrypted/stage4c-4.enc","key-encrypted/stage4c-5.enc","key-encrypted/stage4c-6.enc","key-encrypted/stage4c-7.enc"],"keyivs":["8NRZIN+ZdPjZbcWcUyAvZw==","9GAtgLLE8wsoihi6gSzQtA==","9bKhGQae9aIrKbn7juBdRQ==","oMewODKSlu3ZgbcZEA0y2w==","d51l/oC60Ma/9cLTeNslsw==","GxrF9VmPzDaTUn6pov7Z6A==","hZGuawoQYWs+8ONtaPhW0w==","x/Qk1P1vjrpUqHb55g7cwQ=="],"imagepath":["assets-encrypted/stage4c.jpg.enc"]},"stage5":{"keypath":["key-encrypted/stage5-0.enc","key-encrypted/stage5-1.enc","key-encrypted/stage5-2.enc","key-encrypted/stage5-3.enc","key-encrypted/stage5-4.enc","key-encrypted/stage5-5.enc","key-encrypted/stage5-6.enc","key-encrypted/stage5-7.enc"],"keyivs":["FGnl4MVt9bvv6NTuk2SZsQ==","fj7uuDdL+y4+1gfFtPgMPw==","SRqptk4+VbkgTbwBd36sZA==","+KrEF6DiEEtrA1buXFsKtQ==","zTD7GNa5IceDHgJnkmA3zg==","rp1KlPe3afpWaPgZv9R8fg==","LTyntFBjNn+3isD2C9PnxA==","wAsQcxAE4jZDrfu/r5rVEw=="],"imagepath":["assets-encrypted/stage5.jpg.enc"]},"goal":{"keypath":["key-encrypted/goal-0.enc","key-encrypted/goal-1.enc","key-encrypted/goal-2.enc","key-encrypted/goal-3.enc","key-encrypted/goal-4.enc","key-encrypted/goal-5.enc","key-encrypted/goal-6.enc","key-encrypted/goal-7.enc"],"keyivs":["HdawMiiRpI0PR/qPP108sw==","fF7+KigiV6p2CNVUfcFfgw==","fJtnAEernlWSksRn2LcV4w==","oKAfH3JsjZOFaGIC5RxD0A==","mUYH5Vx7wybp3723kqlLEQ==","syjLAF+hX85vEkSI3bLNUA==","gpGCcElx12IWvI4druIxMw==","0+j0nKQAOYHx9npQCUdiFA=="],"imagepath":[]}};
