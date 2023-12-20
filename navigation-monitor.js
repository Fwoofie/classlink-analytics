var $jscomp = $jscomp || {};
$jscomp.scope = {};
$jscomp.arrayIteratorImpl = function (a) {
  var c = 0;
  return function () {
    return c < a.length ? {done: false, value: a[c++]} : {done: true};
  };
};
$jscomp.arrayIterator = function (a) {
  return {next: $jscomp.arrayIteratorImpl(a)};
};
$jscomp.makeIterator = function (a) {
  var c = "undefined" != typeof Symbol && Symbol.iterator && a[Symbol.iterator];
  return c ? c.call(a) : $jscomp.arrayIterator(a);
};
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
function NavigationMonitor() {
  console.log("NavigationMonitor init");
  this.primaryTimestamp = utils.getCurrentTimeStamp();
  this.activeTabData = this.activeDomain = this.activeUrl = null;
  chrome.tabs.onCreated.addListener(this.onTabCreated.bind(this));
  chrome.tabs.onRemoved.addListener(this.onTabClosed.bind(this));
  chrome.tabs.onActivated.addListener(this.onTabActivated.bind(this));
  chrome.tabs.onUpdated.addListener(this.onTabUpdated.bind(this));
  chrome.windows.onCreated.addListener(this.onWindowCreated.bind(this));
  chrome.windows.onRemoved.addListener(this.onWindowClosed.bind(this));
  chrome.windows.onFocusChanged.addListener(this.onWindowFocusChanged.bind(this));
  chrome.webNavigation.onCommitted.addListener(this.onWebNavigationCommitted.bind(this));
}
NavigationMonitor.NavigationType = {AUTO_BOOKMARK: "auto_bookmark", AUTO_SUBFRAME: "auto_subframe", FORM_SUBMIT: "form_submit", GENERATED: "generated", KEYWORD: "keyword", KEYWORD_GENERATED: "keyword_generated", LINK: "link", MANUAL_SUBFRAME: "manual_subframe", RELOAD: "reload", START_PAGE: "start_page", TYPED: "typed"};
NavigationMonitor.NavigationQualifier = {CLIENT_REDIRECT: "client_redirect", FORWARD_BACK: "forward_back", SERVER_REDIRECT: "server_redirect"};
NavigationMonitor.prototype = {onTabCreated: function (a) {
  1 < LOG_LEVEL && console.log("onTabCreated, tab:", a);
}, onTabActivated: function (a) {
  var c = this;
  chrome.tabs.get(a.tabId, function (a) {
    1 < LOG_LEVEL && console.log("onTabActivated, tab info:", a);
    c.updateActiveTab(a, {primaryTimestamp: true, background: true});
  });
}, updateActiveTab: function (a, c, b) {
  c = void 0 === c ? {primaryTimestamp: true, background: true} : c;
  b = void 0 === b ? false : b;
  var d = this.activeTabData ? utils.basicClone(this.activeTabData) : null;
  a && utils.shouldBlockForIncognito(a.incognito, false) && (a = null);
  this.activeTabData = a ? a : null;
  this.activeUrl = a ? utils.getUrlFromTabObject(a) : null;
  this.activeDomain = a ? utils.extractHostname(this.activeUrl) : null;
  var e = this.getElapsedTimeToNow(c.primaryTimestamp);
  c.background && processTabTransition(d, a, e, b);
}, onTabClosed: function (a, c) {
  1 < LOG_LEVEL && console.log("onTabClosed, id:", a, "removalInfo:", c);
  c = sesMgr.getAppTracker(a);
  sesMgr.endTabAppSession(a);
  this.activeTabData && this.activeTabData.id === a && this.updateActiveTab(null, {primaryTimestamp: true, background: !c});
}, onTabUpdated: function (a, c, b) {
  if (b) if (a = utils.getUrlFromTabObject(b)) {
    a = utils.extractHostname(a);
    b.active ? this.updateActiveTab(b, {primaryTimestamp: true, background: true}, "complete" !== c.status) : processTabTransition(null, b, null, "complete" !== c.status);
    var d = b.incognito ? "incognito" : "regular";
    if (sesMgr.domainSessions[a] && sesMgr.domainSessions[a][d] && !sesMgr.domainSessions[a][d].sessionId) {
      var e = sesMgr.domainSessions[a][d];
      !e.favicon && b.favIconUrl && (sesMgr.domainSessions[a][d].favicon = b.favIconUrl);
      !e.title && b.title && (sesMgr.domainSessions[a][d].title = b.title);
      "complete" === c.status && setTimeout(function () {
        sessionCheck();
      }, 1e3);
    }
  } else console.warn("NavigationMonitor.onTabCreated(): Tab object does not have url; ignoring"); else console.warn("NavigationMonitor.onTabCreated(): Undefined tab object; ignoring");
}, onWindowClosed: function (a) {
  0 < LOG_LEVEL && console.log("NavigationMonitor.onWindowClosed(" + a + ")");
}, onWindowFocusChanged: function (a) {
  if (a !== chrome.windows.WINDOW_ID_NONE) {
    if (!this.activeTabData || a !== this.activeTabData.windowId) {
      var c = this;
      chrome.windows.get(a, {populate: true}, function (b) {
        if (b && b.tabs) {
          b = $jscomp.makeIterator(b.tabs);
          for (var d = b.next(); !d.done; d = b.next()) if (d = d.value, d.active) {
            c.onTabActivated({tabId: d.id, windowId: a});
            break;
          }
        }
      });
    }
  } else this.updateActiveTab(null);
}, onWebNavigationCommitted: function (a) {
  1 < LOG_LEVEL && console.log("chrome.webNavigation.onCommitted:", a);
  if (a && 0 === a.frameId) {
    var c = a.transitionType, b = a.transitionQualifiers;
    ("typed" === c || "generated" === c && b && b.includes("from_address_bar")) && sesMgr.endTabAppSession(a.tabId);
  }
}, onWindowCreated: function (a) {}, getElapsedTimeToNow: function (a) {
  a = void 0 === a ? false : a;
  var c = utils.getCurrentTimeStamp(), b = c - this.primaryTimestamp;
  a && this.updatePrimaryTimestamp(c);
  return b;
}, updatePrimaryTimestamp: function (a) {
  this.primaryTimestamp = a = void 0 === a ? utils.getCurrentTimeStamp() : a;
}, manuallyUpdateActiveTab: function () {
  var a = this;
  chrome.tabs.query({active: true, lastFocusedWindow: true}, function (c) {
    0 < c.length && a.updateActiveTab(c[0], {primaryTimestamp: true, background: true});
  });
}};
