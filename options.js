var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.arrayIteratorImpl = function (a) {
  var b = 0;
  return function () {
    return b < a.length ? {done: false, value: a[b++]} : {done: true};
  };
};
$jscomp.arrayIterator = function (a) {
  return {next: $jscomp.arrayIteratorImpl(a)};
};
$jscomp.makeIterator = function (a) {
  var b = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
  return b ? b.call(a) : $jscomp.arrayIterator(a);
};
$jscomp.findInternal = function (a, b, e) {
  a instanceof String && (a = String(a));
  for (var d = a.length, c = 0; c < d; c++) {
    var f = a[c];
    if (b.call(e, f, c, a)) return {i: c, v: f};
  }
  return {i: -1, v: void 0};
};
$jscomp.ASSUME_ES5 = false;
$jscomp.ASSUME_NO_NATIVE_MAP = false;
$jscomp.ASSUME_NO_NATIVE_SET = false;
$jscomp.defineProperty = $jscomp.ASSUME_ES5 || "function" == typeof Object.defineProperties ? Object.defineProperty : function (a, b, e) {
  a != Array.prototype && a != Object.prototype && (a[b] = e.value);
};
$jscomp.getGlobal = function (a) {
  return "undefined" != typeof window && window === a ? a : "undefined" != typeof global && null != global ? global : a;
};
$jscomp.global = $jscomp.getGlobal(this);
$jscomp.polyfill = function (a, b, e, d) {
  if (b) {
    e = $jscomp.global;
    a = a.split(".");
    for (d = 0; d < a.length - 1; d++) {
      var c = a[d];
      c in e || (e[c] = {});
      e = e[c];
    }
    a = a[a.length - 1];
    d = e[a];
    b = b(d);
    b != d && null != b && $jscomp.defineProperty(e, a, {configurable: true, writable: true, value: b});
  }
};
$jscomp.polyfill("Array.prototype.find", function (a) {
  return a ? a : function (a, e) {
    return $jscomp.findInternal(this, a, e).v;
  };
}, "es6", "es3");
$jscomp.owns = function (a, b) {
  return Object.prototype.hasOwnProperty.call(a, b);
};
$jscomp.polyfill("Object.entries", function (a) {
  return a ? a : function (a) {
    var b = [], d;
    for (d in a) $jscomp.owns(a, d) && b.push([d, a[d]]);
    return b;
  };
}, "es8", "es3");
var clLoginStatusText = document.getElementById("clLoginStatus"), clLoginIncogStatusText = document.getElementById("clLoginIncognitoStatus"), clLoginBetaStatusText = document.getElementById("clLoginBetaStatus"), clLoginIncogBetaStatusText = document.getElementById("clLoginIncognitoBetaStatus"), cfgLoadStatusText = document.getElementById("cfgLoadStatus");
getCLLoginStatus();
getConfigLoadStatus();
setupStatusListeners();
function getCLLoginStatus() {
  chrome.storage.sync.get(["LP_LOGIN_INSTANCES", "LP_LOGIN_PERSISTENT_INSTANCES", "IS_INCOGNITO_ENABLED"], function (a) {
    handleCLLoginStatusData(a.LP_LOGIN_INSTANCES, a.LP_LOGIN_PERSISTENT_INSTANCES, a.IS_INCOGNITO_ENABLED);
  }.bind(this));
}
function handleCLLoginStatusData(a, b, e) {
  var d = [];
  if (a) try {
    d = JSON.parse(a);
  } catch (c) {
    console.error("Unexpected error while parsing LP login instances data:", c);
  }
  a = [];
  if (b) try {
    a = JSON.parse(b);
  } catch (c) {
    console.error("Unexpected error while parsing LP login persistent instances data:", c);
  }
  applyCLLoginStatus(d, a, e);
}
function applyCLLoginStatus(a, b, e) {
  for (var d = a.some(function (a) {
    return "beta" === a.lpEnv;
  }) || b.some(function (a) {
    return "beta" === a.lpEnv;
  }), c = document.getElementsByClassName("ctnr"), f = 0; f < c.length; f++) {
    var h = e || !c[f].classList.contains("incog-ctnr"), g = d || !c[f].classList.contains("beta-ctnr");
    h && g ? c[f].classList.remove("hidden-ctnr") : c[f].classList.add("hidden-ctnr");
    c[f].style.visibility = h && g ? "visible" : "hidden";
  }
  c = a.find(function (a) {
    return "prod" === a.lpEnv && !a.isIncognito;
  });
  f = b.find(function (a) {
    return "prod" === a.lpEnv && !a.isIncognito;
  });
  c || f ? (clLoginStatusText.innerText = c ? "Yes" : "No; using stored login", clLoginStatusText.classList.add("active")) : (clLoginStatusText.innerText = "No", clLoginStatusText.classList.remove("active"));
  e && (c = a.find(function (a) {
    return "prod" === a.lpEnv && a.isIncognito;
  }), f = b.find(function (a) {
    return "prod" === a.lpEnv && a.isIncognito;
  }), c || f ? (clLoginIncogStatusText.innerText = c ? "Yes" : "No; using stored login", clLoginIncogStatusText.classList.add("active")) : (clLoginIncogStatusText.innerText = "No", clLoginIncogStatusText.classList.remove("active")));
  d && (c = a.find(function (a) {
    return "beta" === a.lpEnv && !a.isIncognito;
  }), f = b.find(function (a) {
    return "beta" === a.lpEnv && !a.isIncognito;
  }), c || f ? (clLoginBetaStatusText.innerText = c ? "Yes" : "No; using stored login", clLoginBetaStatusText.classList.add("active")) : (clLoginBetaStatusText.innerText = "No", clLoginBetaStatusText.classList.remove("active")));
  d && e && (a = a.find(function (a) {
    return "beta" === a.lpEnv && a.isIncognito;
  }), b = b.find(function (a) {
    return "beta" === a.lpEnv && a.isIncognito;
  }), a || b ? (clLoginIncogBetaStatusText.innerText = a ? "Yes" : "No; using stored login", clLoginIncogBetaStatusText.classList.add("active")) : (clLoginIncogBetaStatusText.innerText = "No", clLoginIncogBetaStatusText.classList.remove("active")));
}
function getConfigLoadStatus() {
  chrome.storage.sync.get(["RECEIVED_EXTERNAL_CONFIG", "CONFIG_STATUS_UPDATED_AT"], function (a) {
    applyConfigLoadStatus(a.RECEIVED_EXTERNAL_CONFIG, a.CONFIG_STATUS_UPDATED_AT);
  }.bind(this));
}
function applyConfigLoadStatus(a, b) {
  cfgLoadStatusText.innerText = a ? "Yes" : "No";
  a ? cfgLoadStatusText.classList.add("active") : cfgLoadStatusText.classList.remove("active");
}
function setupStatusListeners() {
  chrome.storage.onChanged.addListener(function (a, b) {
    var e = b = null, d = null, c = null, f = null;
    a = $jscomp.makeIterator(Object.entries(a));
    for (var h = a.next(); !h.done; h = a.next()) {
      var g = $jscomp.makeIterator(h.value);
      h = g.next().value;
      g = g.next().value.newValue;
      switch (h) {
        case "LP_LOGIN_INSTANCES":
          b = g;
          break;
        case "LP_LOGIN_PERSISTENT_INSTANCES":
          e = g;
          break;
        case "IS_INCOGNITO_ENABLED":
          d = g;
          break;
        case "RECEIVED_EXTERNAL_CONFIG":
          c = g;
          break;
        case "CONFIG_STATUS_UPDATED_AT":
          f = g;
      }
    }
    null === b && null === e && null === d || getCLLoginStatus();
    null !== c && applyConfigLoadStatus(c, f);
  });
}
;
