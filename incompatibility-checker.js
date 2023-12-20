var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.ASSUME_ES5 = false;
$jscomp.ASSUME_NO_NATIVE_MAP = false;
$jscomp.ASSUME_NO_NATIVE_SET = false;
$jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function (a, c, b) {
  a != Array.prototype && a != Object.prototype && (a[c] = b.value);
};
$jscomp.getGlobal = function (a) {
  return "undefined" != typeof window && window === a ? a : "undefined" != typeof global && null != global ? global : a;
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.polyfill = function (a, c, b, e) {
  if (c) {
    b = $jscomp.global;
    a = a.split(".");
    for (e = 0; e < a.length - 1; e++) {
      var d = a[e];
      d in b || (b[d] = {});
      b = b[d];
    }
    a = a[a.length - 1];
    e = b[a];
    c = c(e);
    c != e && null != c && $jscomp.defineProperty(b, a, {configurable: true, writable: true, value: c});
  }
};
$jscomp.polyfill("Object.is", function (a) {
  return a ? a : function (a, b) {
    return a === b ? 0 !== a || 1 / a === 1 / b : a !== a && b !== b;
  };
}, "es6", "es3");
$jscomp.polyfill("Array.prototype.includes", function (a) {
  return a ? a : function (a, b) {
    var c = this;
    c instanceof String && (c = String(c));
    var d = c.length;
    b = b || 0;
    for (0 > b && (b = Math.max(b + d, 0)); b < d; b++) {
      var f = c[b];
      if (f === a || Object.is(f, a)) return true;
    }
    return false;
  };
}, "es7", "es3");
$jscomp.checkStringArgs = function (a, c, b) {
  if (null == a) throw new TypeError("The 'this' value for String.prototype." + b + " must not be null or undefined");
  if (c instanceof RegExp) throw new TypeError("First argument to String.prototype." + b + " must not be a regular expression");
  return a + "";
};
$jscomp.polyfill("String.prototype.includes", function (a) {
  return a ? a : function (a, b) {
    return -1 !== $jscomp.checkStringArgs(this, a, "includes").indexOf(a, b || 0);
  };
}, "es6", "es3");
var ANALYTICS_FRONTEND_URL = "https://analyticsplus.classlink.com";
function IncompatibilityChecker() {
  console.log("IncompatibilityChecker init");
  this.incompatibleURLsLoaded = false;
  this.INCOMPATIBLE_URLS = [];
  this.getIncompatibleDomains();
}
IncompatibilityChecker.prototype = {getIncompatibleDomains: function (a) {
  var c = this;
  this.incompatibleURLsLoaded = false;
  0 < LOG_LEVEL && console.log("Fetching incompatible domains…");
  var b = new XMLHttpRequest, e = ANALYTICS_FRONTEND_URL + ("/assets/json/ext_inc_urls.json?date=" + utils.getCurrentDateStamp());
  b.open("GET", e, true);
  b.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  b.setRequestHeader("Access-Control-Allow-Origin", "*");
  b.onreadystatechange = function () {
    if (4 === b.readyState) {
      0 < LOG_LEVEL && console.log("Incompatible domains data received:", b.response);
      var d = b.response;
      c.incompatibleURLsLoaded = true;
      try {
        d = JSON.parse(d);
      } catch (f) {}
      c.INCOMPATIBLE_URLS = d;
      a && a({success: 200 === b.status, data: c.INCOMPATIBLE_URLS, status: b.status, statusText: b.statusText});
    }
  };
  b.send();
}, isCompatibleDomain: function (a) {
  return !this.INCOMPATIBLE_URLS.some(function (c) {
    return a.includes(c);
  });
}};
