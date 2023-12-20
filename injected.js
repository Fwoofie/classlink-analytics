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
$jscomp.polyfill = function (a, c, b, d) {
  if (c) {
    b = $jscomp.global;
    a = a.split(".");
    for (d = 0; d < a.length - 1; d++) {
      var e = a[d];
      e in b || (b[e] = {});
      b = b[e];
    }
    a = a[a.length - 1];
    d = b[a];
    c = c(d);
    c != d && null != c && $jscomp.defineProperty(b, a, {configurable: true, writable: true, value: c});
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
    var e = c.length;
    b = b || 0;
    for (0 > b && (b = Math.max(b + e, 0)); b < e; b++) {
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
if (window.location.origin.includes("blankwebsite.com")) {
  var parts = window.location.href.split("/"), inOrOut = 3 <= parts.length ? parts[parts.length - 3] : "in", env = 2 <= parts.length ? parts[parts.length - 2] : "beta", code = parts[parts.length - 1], parcel = {type: "out" === inOrOut ? "lplogout" : "lplogin", data: {gwstoken: code, LaunchpadUri: "beta" === env ? "betamyapps.classlink.com" : "myapps.classlink.com"}};
  console.log("Spoof " + env + " log" + inOrOut + " triggered with gws token " + code);
  chrome.runtime.sendMessage(parcel);
}
setTimeout(function () {
  chrome.runtime.sendMessage({type: "EXT_SAT_REQUEST_SIGNAL"}, function (a) {
    a && true === a.clearance && window.postMessage(btoa(JSON.stringify({type: "stopapptimers"})), window.location.origin);
  });
}, 1e3);
window.addEventListener("message", function (a) {
  if (a.data && "" !== a.data) try {
    var c = JSON.parse(atob(a.data));
    chrome.runtime.sendMessage(c);
  } catch (b) {}
});
