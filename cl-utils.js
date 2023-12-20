var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.ASSUME_ES5 = false;
$jscomp.ASSUME_NO_NATIVE_MAP = false;
$jscomp.ASSUME_NO_NATIVE_SET = false;
$jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function (a, b, c) {
  a != Array.prototype && a != Object.prototype && (a[b] = c.value);
};
$jscomp.getGlobal = function (a) {
  return "undefined" != typeof window && window === a ? a : "undefined" != typeof global && null != global ? global : a;
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.polyfill = function (a, b, c, d) {
  if (b) {
    c = $jscomp.global;
    a = a.split(".");
    for (d = 0; d < a.length - 1; d++) {
      var e = a[d];
      e in c || (c[e] = {});
      c = c[e];
    }
    a = a[a.length - 1];
    d = c[a];
    b = b(d);
    b != d && null != b && $jscomp.defineProperty(c, a, {configurable: true, writable: true, value: b});
  }
};
$jscomp.polyfill("Object.is", function (a) {
  return a ? a : function (a, c) {
    return a === c ? 0 !== a || 1 / a === 1 / c : a !== a && c !== c;
  };
}, "es6", "es3");
$jscomp.polyfill("Array.prototype.includes", function (a) {
  return a ? a : function (a, c) {
    var b = this;
    b instanceof String && (b = String(b));
    var e = b.length;
    c = c || 0;
    for (0 > c && (c = Math.max(c + e, 0)); c < e; c++) {
      var f = b[c];
      if (f === a || Object.is(f, a)) return true;
    }
    return false;
  };
}, "es7", "es3");
$jscomp.checkStringArgs = function (a, b, c) {
  if (null == a) throw new TypeError("The 'this' value for String.prototype." + c + " must not be null or undefined");
  if (b instanceof RegExp) throw new TypeError("First argument to String.prototype." + c + " must not be a regular expression");
  return a + "";
};
$jscomp.polyfill("String.prototype.includes", function (a) {
  return a ? a : function (a, c) {
    return -1 !== $jscomp.checkStringArgs(this, a, "includes").indexOf(a, c || 0);
  };
}, "es6", "es3");
$jscomp.arrayIteratorImpl = function (a) {
  var b = 0;
  return function () {
    return b < a.length ? {done: false, value: a[b++]} : {done: true};
  };
};
$jscomp.arrayIterator = function (a) {
  return {next: $jscomp.arrayIteratorImpl(a)};
};
$jscomp.SYMBOL_PREFIX = "jscomp_symbol_";
$jscomp.initSymbol = function () {
  $jscomp.initSymbol = function () {};
  $jscomp.global.Symbol || ($jscomp.global.Symbol = $jscomp.Symbol);
};
$jscomp.Symbol = function () {
  var a = 0;
  return function (b) {
    return $jscomp.SYMBOL_PREFIX + (b || "") + a++;
  };
}();
$jscomp.initSymbolIterator = function () {
  $jscomp.initSymbol();
  var a = $jscomp.global.Symbol.iterator;
  a || (a = $jscomp.global.Symbol.iterator = $jscomp.global.Symbol("iterator"));
  "function" != typeof Array.prototype[a] && $jscomp.defineProperty(Array.prototype, a, {configurable: true, writable: true, value: function () {
    return $jscomp.iteratorPrototype($jscomp.arrayIteratorImpl(this));
  }});
  $jscomp.initSymbolIterator = function () {};
};
$jscomp.initSymbolAsyncIterator = function () {
  $jscomp.initSymbol();
  var a = $jscomp.global.Symbol.asyncIterator;
  a || (a = $jscomp.global.Symbol.asyncIterator = $jscomp.global.Symbol("asyncIterator"));
  $jscomp.initSymbolAsyncIterator = function () {};
};
$jscomp.iteratorPrototype = function (a) {
  $jscomp.initSymbolIterator();
  a = {next: a};
  a[$jscomp.global.Symbol.iterator] = function () {
    return this;
  };
  return a;
};
$jscomp.iteratorFromArray = function (a, b) {
  $jscomp.initSymbolIterator();
  a instanceof String && (a += "");
  var c = 0, d = {next: function () {
    if (c < a.length) {
      var e = c++;
      return {value: b(e, a[e]), done: false};
    }
    d.next = function () {
      return {done: true, value: void 0};
    };
    return d.next();
  }};
  d[Symbol.iterator] = function () {
    return d;
  };
  return d;
};
$jscomp.polyfill("Array.prototype.keys", function (a) {
  return a ? a : function () {
    return $jscomp.iteratorFromArray(this, function (a) {
      return a;
    });
  };
}, "es6", "es3");
$jscomp.polyfill("String.prototype.startsWith", function (a) {
  return a ? a : function (a, c) {
    var b = $jscomp.checkStringArgs(this, a, "startsWith");
    a += "";
    var e = b.length, f = a.length;
    c = Math.max(0, Math.min(c | 0, b.length));
    for (var g = 0; g < f && c < e;) if (b[c++] != a[g++]) return false;
    return g >= f;
  };
}, "es6", "es3");
function CLUtils() {
  this.LAUNCHPAD_BETA_API_URL = "https://betalaunchpad.classlink.com";
  this.LAUNCHPAD_BETA_FRONTEND_URL = "https://betamyapps.classlink.com/";
  this.LAUNCHPAD_API_URL = "https://launchpad.classlink.com";
  this.LAUNCHPAD_FRONTEND_URL = "https://myapps.classlink.com/";
}
CLUtils.prototype = {extractHostname: function (a, b) {
  b = void 0 === b ? true : b;
  if (!a) return a;
  a = -1 < a.indexOf("//") ? a.split("/")[2] : a.split("/")[0];
  b && (a = a.split(":")[0]);
  return a = a.split("?")[0];
}, getCurrentTimeStamp: function () {
  return (new Date).getTime();
}, getCurrentDateStamp: function () {
  return (new Date).toISOString().slice(0, 10);
}, convertTimeStampToDateDisplay: function (a) {
  a = new Date(a);
  return a.toLocaleDateString() + ", " + a.toLocaleTimeString();
}, isValidUrl: function (a) {
  return a && "" !== a ? !cfgSvc.IGNORED_URLS.some(function (b) {
    return a.includes(b);
  }) && incChkr.isCompatibleDomain(this.extractHostname(a)) : false;
}, paramsEncoder: function (a) {
  if (!a) return "";
  var b = [];
  Object.keys(a).forEach(function (c) {
    b.push(encodeURIComponent(c) + "=" + encodeURIComponent(a[c]));
  });
  return 0 < b.length ? "?" + b.join("&") : "";
}, apiRequestAdjustments: function (a) {
  a.endpoint.startsWith("/") || (a.endpoint = "/" + a.endpoint);
  a.params && (a.endpoint += this.paramsEncoder(a.params));
  return a;
}, getUrlFromTabObject: function (a) {
  return a ? a.url || a.pendingUrl : null;
}, calcElapsedSeconds: function (a) {
  if (void 0 !== a && null !== a) return Math.max(Math.ceil(a / 1e3), 0);
}, basicClone: function (a) {
  return a ? JSON.parse(JSON.stringify(a)) : a;
}, shouldBlockForIncognito: function (a, b) {
  return a && cfgSvc.configLoaded && (b ? !cfgSvc.TRACK_INCOGNITO_APPS : !cfgSvc.TRACK_INCOGNITO_TABS);
}, allowedToAddSession: function (a, b) {
  return cfgSvc.configLoaded && !(a !== TrackerSessionType.ANON_DOMAIN || cfgSvc.ANON_TOKEN && cfgSvc.PANOPTICON_MODE) || this.shouldBlockForIncognito(b, a === TrackerSessionType.LPUSER_APP) || idleMon.isUserIdle && a !== TrackerSessionType.LPUSER_APP ? false : true;
}, getLPEnvFromUrl: function (a) {
  return /^((https?:\/\/)?beta((launchpad)|(myapps))\.classlink\.com)|((https?:\/\/)?(www\.)?blankwebsite\.com\/((in)|(out))\/beta)/.test(a) ? LPEnvironment.BETA : LPEnvironment.PROD;
}, getLPUrlFromEnv: function (a) {
  return a === LPEnvironment.BETA ? this.LAUNCHPAD_BETA_FRONTEND_URL : this.LAUNCHPAD_FRONTEND_URL;
}};
