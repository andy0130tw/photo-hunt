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
  if (!athr) {
    athr = ['opening'];
    localStorage.setItem('phunt-availableThreads', JSON.stringify(athr));
  }
  $rootScope.availableThreads = athr || JSON.stringify(athr);
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
              console.log('checkPwd failed', n);
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
          localStorage.setItem('phunt-threadList', $rootScope.threadList);

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
              console.log('read enc image', err);
            });
          }

          // replace flow
          $rootScope.availableThreads = thread.next;
          if (json.meta.goal) {
            // if goal?
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

app.factory('gameProgress', [function(){
  // todo
  function initStore() {}
  function updateFlow() {}
  return {
    checkPass: function() {
      // calculate SHA256 and checks over current flow.
    },
    //...
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

var keyinfo = {"opening":{"keypath":["key-encrypted/opening-0.enc","key-encrypted/opening-1.enc","key-encrypted/opening-2.enc","key-encrypted/opening-3.enc","key-encrypted/opening-4.enc","key-encrypted/opening-5.enc","key-encrypted/opening-6.enc","key-encrypted/opening-7.enc"],"keyivs":["MW7ZJmKxmYCOeLMv1g0/eA==","tesHaXiWEcm+KXTh9441Og==","gypJL3XijA5uiEN21NgM2A==","HBVKgGeaE4uZY/+SnV06pA==","dVJqeI4d3K7wvtFaBgpIQA==","pwvoZ9HXCrTO27VJtKYI9w==","T4pcL2x+3ElJziA0TIpWPA==","8GfZpcrP8nCoqbLRMV4bGg=="],"imagepath":[]},"stage1":{"keypath":["key-encrypted/stage1-0.enc","key-encrypted/stage1-1.enc","key-encrypted/stage1-2.enc","key-encrypted/stage1-3.enc","key-encrypted/stage1-4.enc","key-encrypted/stage1-5.enc","key-encrypted/stage1-6.enc","key-encrypted/stage1-7.enc"],"keyivs":["Oqo/+BPb6fXZLXwdytnV7Q==","/o1X0zoYDvsa91BSQLH/sQ==","qDociwwXGDIhVWUtIykYTA==","KkxFmGnfXVB8CDWx6Chd6w==","dP+eQC8eF9nn0zQnygHI3w==","LFqYx69x0k+Vf0i7j55wZQ==","wuQDjvUbER7p3wnNhMF9VQ==","dCOH8Hl7Lz0uausgDaevVQ=="],"imagepath":["assets-encrypted/stage1.jpg.enc"]},"stage2a":{"keypath":["key-encrypted/stage2a-0.enc","key-encrypted/stage2a-1.enc","key-encrypted/stage2a-2.enc","key-encrypted/stage2a-3.enc","key-encrypted/stage2a-4.enc","key-encrypted/stage2a-5.enc","key-encrypted/stage2a-6.enc","key-encrypted/stage2a-7.enc"],"keyivs":["KRHss6pHdBk456ABOMv8zg==","tlFG4ytHYo3fusMn4V67zA==","bVD2PQl6JTaN9z/XdvdYAQ==","S2Paz0pEs/HwngAEfxHVqQ==","bAyuFp1tFBrJUZVYxZJZSQ==","ulheraLZ2R3A4PwORvuuWQ==","RVeaKSUmvhKT0r8w/1qpPw==","zPQauC68w879+4Klg4BDqw=="],"imagepath":["assets-encrypted/stage2a.jpg.enc"]},"stage2b":{"keypath":["key-encrypted/stage2b-0.enc","key-encrypted/stage2b-1.enc","key-encrypted/stage2b-2.enc","key-encrypted/stage2b-3.enc","key-encrypted/stage2b-4.enc","key-encrypted/stage2b-5.enc","key-encrypted/stage2b-6.enc","key-encrypted/stage2b-7.enc"],"keyivs":["A/HYAC4flV2e9NQTgqyKNg==","YnYA6OhCUb+oQcWE2E8Z9A==","XUseVwAwi1fRhCWhE177fQ==","uMG8U8W1vCwu8KJJtZpVzQ==","RU8VjXiCtMYpgUe2HE1rYA==","w46+a4AAj0xlPZv5CzUfYA==","ooZbxP3RQwi/94moqVDVFg==","u3o3WXhHGPe1LNAiC0GWdg=="],"imagepath":["assets-encrypted/stage2b.jpg.enc"]},"stage2c":{"keypath":["key-encrypted/stage2c-0.enc","key-encrypted/stage2c-1.enc","key-encrypted/stage2c-2.enc","key-encrypted/stage2c-3.enc","key-encrypted/stage2c-4.enc","key-encrypted/stage2c-5.enc","key-encrypted/stage2c-6.enc","key-encrypted/stage2c-7.enc"],"keyivs":["z0TXmf3lNJJ2P95cKBiPDA==","AjDUV9CvQc1VMi4V7SCoWw==","CvS9D7e2NnXKl5GJkvNOUA==","Mm0z5E5dAt7O89aKE+1LbA==","+fHdBLPtCXxr7DTdZL/l1g==","c7QRPJKh6bo3w1NAwiNzcA==","4288XQYnfgeHtE2RD1Iyng==","CsmoCa8F3TznlieyD4NBLw=="],"imagepath":["assets-encrypted/stage2c.jpg.enc"]},"stage3":{"keypath":["key-encrypted/stage3-0.enc","key-encrypted/stage3-1.enc","key-encrypted/stage3-2.enc","key-encrypted/stage3-3.enc","key-encrypted/stage3-4.enc","key-encrypted/stage3-5.enc","key-encrypted/stage3-6.enc","key-encrypted/stage3-7.enc"],"keyivs":["ax/5hAmkePfhG+jCOZi70A==","uwDmfeOqdLtYkYaPVsbilQ==","QzS1TGVX4sLXa9GkEkDWtQ==","Yv+nihmPeBkyhT6nZyG+lQ==","X1Hsl8Ag7AawVCaR5Dkxqg==","zNsISOkJiSC0pnOzh6MQAA==","hKcak37a2XQkuSjfdhEbgQ==","hU3DyLLQ+Br6fZ4F2iyYrw=="],"imagepath":["assets-encrypted/stage3.jpg.enc"]},"stage4a":{"keypath":["key-encrypted/stage4a-0.enc","key-encrypted/stage4a-1.enc","key-encrypted/stage4a-2.enc","key-encrypted/stage4a-3.enc","key-encrypted/stage4a-4.enc","key-encrypted/stage4a-5.enc","key-encrypted/stage4a-6.enc","key-encrypted/stage4a-7.enc"],"keyivs":["cjnKerohqKK7aBplJ0K92g==","LkuOZrbIF3YgHzu0OFx90w==","7GYdIIMdglpnVrou36sBDg==","Pbq8oRG92dlyfCYQmq6ckA==","CitV7e/x3sMv4jTVpJ62lQ==","ea8LA+GYUrvdfA5vHXF5eA==","mn8oXUktScA0NbXpuxwU6g==","m/uCdrbBjESv62Q6txKbHQ=="],"imagepath":["assets-encrypted/stage4a.jpg.enc"]},"stage4b":{"keypath":["key-encrypted/stage4b-0.enc","key-encrypted/stage4b-1.enc","key-encrypted/stage4b-2.enc","key-encrypted/stage4b-3.enc","key-encrypted/stage4b-4.enc","key-encrypted/stage4b-5.enc","key-encrypted/stage4b-6.enc","key-encrypted/stage4b-7.enc"],"keyivs":["hr9qg4VkNWRLjXKL0o2R7g==","ZLn3w6OwuqybQFfkEbIbqw==","IHeAr+zNpv8W2cjWz8GLUQ==","P6OtgqJHOkptmPd0ZQgBmQ==","FIPjpJ7BLN6V3XOLvq7hdQ==","OL9mN1FSGZLi96NTARCIMw==","agwAm7Cq30qWfsYS9SB0hA==","7NQMYEcMCNN6syKNSrlcuw=="],"imagepath":["assets-encrypted/stage4b.jpg.enc"]},"stage4c":{"keypath":["key-encrypted/stage4c-0.enc","key-encrypted/stage4c-1.enc","key-encrypted/stage4c-2.enc","key-encrypted/stage4c-3.enc","key-encrypted/stage4c-4.enc","key-encrypted/stage4c-5.enc","key-encrypted/stage4c-6.enc","key-encrypted/stage4c-7.enc"],"keyivs":["bol6fGnQZXcpNqlryNZ4Zw==","nGjimpbsnQWQWMHlDdeavA==","LZSO3UdvtwfU0nwy5sgcnw==","kmKVqa6JTBmPKJonQPdSvA==","rMcSzje1YAstEPPF0MZH+A==","Jus/m3uSXXFpApGNT7ozbQ==","pIPQ9WT2eunONREJVizcKw==","iJPlKSqH5gxzIbQS56Wxww=="],"imagepath":["assets-encrypted/stage4c.jpg.enc"]},"stage5":{"keypath":["key-encrypted/stage5-0.enc","key-encrypted/stage5-1.enc","key-encrypted/stage5-2.enc","key-encrypted/stage5-3.enc","key-encrypted/stage5-4.enc","key-encrypted/stage5-5.enc","key-encrypted/stage5-6.enc","key-encrypted/stage5-7.enc"],"keyivs":["645Qxjn0B8c3YcP6Ko1UPQ==","XHWavpkC6mjHd8lQIPr8iA==","6c3nE7+dU7kZxMkr9xrfCw==","y4kkUbW2IJ7cZb62ojyoSQ==","SA1ENtoRan3NY7K59JaQaA==","9ep1mOX2/6fsvOuwxv6OUg==","jY3J49qBVcDJBkIQvqnA3Q==","B0GixuZ7yHhXDGoEyy8LUg=="],"imagepath":["assets-encrypted/stage5.jpg.enc"]},"goal":{"keypath":["key-encrypted/goal-0.enc","key-encrypted/goal-1.enc","key-encrypted/goal-2.enc","key-encrypted/goal-3.enc","key-encrypted/goal-4.enc","key-encrypted/goal-5.enc","key-encrypted/goal-6.enc","key-encrypted/goal-7.enc"],"keyivs":["jd7pMTDiP3zFu3WSbqtI0A==","w5NhE3XlnhY+8orkrwwx/g==","pXhDNqyqIw+C8rMEObuENQ==","gmEk8qBR7YaRoDkGiEKu7A==","uwAF+eTPfk9aUtQ/kzeoTA==","6/oCqX+YV6Zi12OOdkxy0w==","xRM6+hQHSo78LsREYIVH+Q==","CWXP0hCQ/cd46RzuEkA+/g=="],"imagepath":[]}};
