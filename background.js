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
$jscomp.checkStringArgs = function (a, b, c) {
  if (null == a) throw new TypeError("The 'this' value for String.prototype." + c + " must not be null or undefined");
  if (b instanceof RegExp) throw new TypeError("First argument to String.prototype." + c + " must not be a regular expression");
  return a + "";
};
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
$jscomp.polyfill = function (a, b, c, e) {
  if (b) {
    c = $jscomp.global;
    a = a.split(".");
    for (e = 0; e < a.length - 1; e++) {
      var d = a[e];
      d in c || (c[d] = {});
      c = c[d];
    }
    a = a[a.length - 1];
    e = c[a];
    b = b(e);
    b != e && null != b && $jscomp.defineProperty(c, a, {configurable: true, writable: true, value: b});
  }
};
$jscomp.polyfill("String.prototype.startsWith", function (a) {
  return a ? a : function (a, c) {
    var b = $jscomp.checkStringArgs(this, a, "startsWith");
    a += "";
    var d = b.length, f = a.length;
    c = Math.max(0, Math.min(c | 0, b.length));
    for (var g = 0; g < f && c < d;) if (b[c++] != a[g++]) return false;
    return g >= f;
  };
}, "es6", "es3");
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
  var c = 0, e = {next: function () {
    if (c < a.length) {
      var d = c++;
      return {value: b(d, a[d]), done: false};
    }
    e.next = function () {
      return {done: true, value: void 0};
    };
    return e.next();
  }};
  e[Symbol.iterator] = function () {
    return e;
  };
  return e;
};
$jscomp.polyfill("Array.prototype.keys", function (a) {
  return a ? a : function () {
    return $jscomp.iteratorFromArray(this, function (a) {
      return a;
    });
  };
}, "es6", "es3");
var utils, claApi, cfgSvc, ipChkr, sesMgr, idleMon, navMon, timeRec, incChkr, EXT_SAT_PING_CLEARANCE = true, DAPFX = "DOMAIN_ALARM ", pendingAppTabs, pendingAppTab;
startup();
chrome.runtime.onStartup.addListener(function () {
  0 < LOG_LEVEL && console.log("Chrome startup initialized.");
});
chrome.runtime.onInstalled.addListener(function (a) {
  0 < LOG_LEVEL && console.log("Extension installed.");
});
chrome.alarms.onAlarm.addListener(function (a) {
  onAlarm(a);
});
function startup() {
  chrome.alarms.clearAll(function (a) {
    utils = new CLUtils;
    claApi = new CLAnalyticsAPI;
    cfgSvc = new ConfigurationService;
    sesMgr = new SessionManager;
    navMon = new NavigationMonitor;
    idleMon = new IdleMonitor;
    ipChkr = new IPChecker;
    timeRec = new TimeRecord;
    incChkr = new IncompatibilityChecker;
    pendingAppTabs = [];
    pendingAppTab = null;
  });
}
function onConfigImportComplete() {
  cfgSvc.setupCLLoginsFromPersistentStorage();
  timeRec.afterConfigImport();
  idleMon.setSystemIdleDetectionInterval();
  idleMon.checkWindowFocusAndUpdate();
  ipChkr.receivedIPRanges = true;
  chrome.storage.sync.set({RECEIVED_EXTERNAL_CONFIG: cfgSvc.receivedExternalConfig, CONFIG_STATUS_UPDATED_AT: cfgSvc.configLoaded});
  if (cfgSvc.ALLOW_IP_FETCH) ipChkr.onEnableIPFetch(function (a) {
    sessionCheck();
  }); else ipChkr.onDisableIPFetch(), sessionCheck();
}
function sessionCheck() {
  var a = sesMgr.generateAllSessions();
  a = $jscomp.makeIterator(a);
  for (var b = a.next(); !b.done; b = a.next()) {
    b = b.value;
    var c = b.type === TrackerSessionType.LPUSER_APP;
    c || utils.isValidUrl(b.domain) ? c || ipChkr.isUserIPValid ? utils.shouldBlockForIncognito(b.isIncognito, c) ? (0 < LOG_LEVEL && console.log("Removing " + (c ? "tab " + b.tabId + " app" : b.domain) + " session due to incognito restriction"), c ? sesMgr.removeAppTracker(b.tabId) : sesMgr.removeDomainTracker(b.domain, b.isIncognito)) : c || b.type !== TrackerSessionType.ANON_DOMAIN || cfgSvc.PANOPTICON_MODE && cfgSvc.ANON_TOKEN ? b.sessionId || (0 < LOG_LEVEL && console.log("Session was created before config was loaded and now needs a sessionId:", c ? b.tabId : b.domain), c ? onAddNewAppSession(b) : onAddNewDomainSession(b.domain, b)) : (0 < LOG_LEVEL && console.log("Removing " + b.domain + " session due to disabled anonymous logging"), sesMgr.removeDomainTracker(b.domain, b.isIncognito)) : (0 < LOG_LEVEL && console.log("Removing " + b.domain + " session due to invalid user IP"), sesMgr.removeDomainTracker(b.domain, b.isIncognito)) : (0 < LOG_LEVEL && console.log("Removing " + b.domain + " session due to invalid domain"), sesMgr.removeDomainTracker(b.domain, b.isIncognito));
  }
}
function onAlarm(a) {
  "periodAlarm" === a.name ? onPeriodAlarm() : "ipRefetchAlarm" === a.name || "ipErrorRefetchAlarm" === a.name ? ipChkr.updateIPAddress() : a.name.startsWith(DAPFX) && (a = a.name.replace(DAPFX, ""), 0 < LOG_LEVEL && console.log("Session expiration alarm:", a), sesMgr.onSessionExpired(a));
}
function onPeriodAlarm() {
  if (cfgSvc.configLoaded) {
    0 < LOG_LEVEL && console.log("Periodic timer triggered. Checking for data to send…");
    sesMgr.triggerActiveTimerUpdate();
    var a = sesMgr.generateAllSessionsWithElapsedTime(true);
    timeRec.logAllElapsedTime(a);
    setTimeout(function () {
      0 < LOG_LEVEL && console.log("Data cycle complete. Current tracker info:\n> Domain sessions:", sesMgr.domainSessions, "\n> App sessions:", sesMgr.appSessions);
    }, 3e3);
  }
}
function onTimeLogSuccess(a) {
  sesMgr.onTimeRecordSuccess(a);
}
function onAddNewDomainSession(a, b) {
  cfgSvc.configLoaded && (cfgSvc.PANOPTICON_MODE || b.type === TrackerSessionType.LPUSER_DOMAIN) && timeRec.registerNewDomainFromUrl(a, b);
}
function onAddNewAppSession(a) {
  cfgSvc.configLoaded && timeRec.registerAppSession(a);
}
function processTabTransition(a, b, c, e) {
  e = void 0 === e ? false : e;
  setTimeout(function () {
    1 < LOG_LEVEL && console.log("Processing tab transition:\n" + ("> old: " + utils.getUrlFromTabObject(a) + " " + (a ? "(#" + a.id + ", " + (a.active ? "active" : "inactive") + ")" : "") + "\n") + ("> new: " + utils.getUrlFromTabObject(b) + " " + (b ? "(#" + b.id + ", " + (b.active ? "active" : "inactive") + ")" : "")));
    var d = pendingAppTab;
    if (d && a && b && d.lpWindowId && d.lpWindowId === a.windowId && d.lpTabId && d.lpTabId === b.openerTabId) sesMgr.addAppTracker(b, {appId: d.appId, gwsToken: d.gwsToken, lpUri: d.lpUri}, function (a) {
      0 < LOG_LEVEL && console.log("Tab id " + b.id + " matched to app");
      onAddNewAppSession(a);
      pendingAppTab = null;
    }); else {
      if (a) {
        d = sesMgr.getTrackerForTab(a);
        var f = !!a.incognito, g = utils.getUrlFromTabObject(a);
        if (d && d.type === TrackerSessionType.LPUSER_APP) {
          if (a.active && sesMgr.incrementAppTracker(a, c), b && b.active) timeRec.onSessionDeactivated(d.sessionId);
        } else if (ipChkr.isUserIPValid && utils.isValidUrl(g) && (a.active && sesMgr.incrementDomainTrackerForUrl(g, c, f), d && b && b.active)) timeRec.onSessionDeactivated(d.sessionId);
      }
      navMon.updatePrimaryTimestamp();
      if (b) {
        d = sesMgr.getTrackerForTab(b);
        var k = cfgSvc.getLoggedInUser(b.incognito), h = utils.getUrlFromTabObject(b);
        if (!d) 0 < LOG_LEVEL && console.log("No tracker exists for new tab: " + JSON.stringify(b)), d = b && void 0 !== b.openerTabId && "chrome://newtab" !== b.url, 0 < LOG_LEVEL && d && console.log("New tab " + b.id + " opened by old tab " + b.openerTabId, sesMgr.appSessions[b.openerTabId]), d && sesMgr.appSessions[b.openerTabId] && sesMgr.appSessions[b.openerTabId].lpChildTabs ? (0 < LOG_LEVEL && console.log("New tab " + b.id + " opened by app tab " + b.openerTabId), chrome.tabs.get(b.openerTabId, function (a) {
          var c = utils.extractHostname(utils.getUrlFromTabObject(a)), d = utils.extractHostname(h);
          a && c === d ? sesMgr.addAppTracker(b, {appId: sesMgr.appSessions[b.openerTabId].appId, gwsToken: sesMgr.appSessions[b.openerTabId].gwsToken, lpUri: utils.getLPUrlFromEnv(sesMgr.appSessions[b.openerTabId].env)}, function (a) {
            0 < LOG_LEVEL && console.log("Child Tab id " + b.id + " matched to app");
            onAddNewAppSession(a);
            lpAppInfo = null;
          }) : ipChkr.isUserIPValid && utils.isValidUrl(h) && (cfgSvc.PANOPTICON_MODE || k) && sesMgr.addDomainTrackerForUrl(h, b.incognito, {favIconUrl: b.favIconUrl, title: b.title, delayRegister: e});
        })) : ipChkr.isUserIPValid && utils.isValidUrl(h) && (cfgSvc.PANOPTICON_MODE || k) && sesMgr.addDomainTrackerForUrl(h, b.incognito, {favIconUrl: b.favIconUrl, title: b.title, delayRegister: e}); else if (b.active) timeRec.onSessionActivated(d.sessionId);
      }
    }
  }, 50);
}
function getFirstValidPendingTab(a) {
  a = void 0 === a ? false : a;
  if (!pendingAppTabs.length) return null;
  for (var b = pendingAppTabs[0], c = Date.now(); 300 < c - b.init;) if (pendingAppTabs.shift(), pendingAppTabs.length) b = pendingAppTabs[0]; else {
    b = null;
    break;
  }
  a && pendingAppTabs.shift();
  return b;
}
function receiveSessionEndResponse(a, b) {
  b = utils.basicClone(sesMgr.findSessionById(a));
  0 < LOG_LEVEL && console.log(b.type + ' session "' + a + '" closed!');
  sesMgr.removeExpiredTracker(a);
  timeRec.clearSessionTimer(a);
}
function receiveSessionEndError(a, b) {
  var c = sesMgr.findSessionById(a);
  b && b.status && 400 === b.status ? sesMgr.removeTracker(a) : b && b.status && 401 === b.status ? onLPLogout({env: c.env, incognito: c.isIncognito}) : (timeRec.clearSessionTimer(a), timeRec.resetSessionTimer(a, cfgSvc.IDLE_SESSION_ERROR_RETRY_DELAY));
}
function onUserIdleStart() {
  0 < LOG_LEVEL && console.log("User is now considered idle.");
  sesMgr.generateAllSessions().forEach(function (a) {
    if (a && a.sessionId) sesMgr.onSessionExpired(a.sessionId); else console.warn("Background.onUserIdleStart(): invalid session:", a);
  });
}
function onUserIdleEnd() {
  0 < LOG_LEVEL && console.log("User is no longer considered idle.");
  processTabTransition(null, navMon.activeTabData, null);
}
function onLPLogin(a, b) {
  0 < LOG_LEVEL && console.log("LaunchPad login script triggered.");
  var c = a.incognito;
  a = utils.getLPEnvFromUrl(utils.getUrlFromTabObject(a));
  cfgSvc.addUserLoginInfo(b, c, a);
  b = c ? "incognito" : "regular";
  a = $jscomp.makeIterator(Object.keys(sesMgr.domainSessions));
  for (var e = a.next(); !e.done; e = a.next()) (e = utils.basicClone(sesMgr.domainSessions[e.value][b])) && e.type === TrackerSessionType.ANON_DOMAIN && (timeRec.clearSessionTimer(e.sessionId), sesMgr.onSessionExpired(e.sessionId), sesMgr.addDomainTrackerForUrl(e.domain, c, {favIconUrl: e.favicon, title: e.title}));
}
function onLPLogout(a) {
  var b = a.env;
  a = a.incognito;
  0 < LOG_LEVEL && console.log("LaunchPad logout script triggered.");
  cfgSvc.removeUserLoginInfo(a, b);
  var c = {};
  chrome.storage.sync.set((c[btoa("islogin_" + b + window.location.host)] = false, c));
  for (var e in sesMgr.appSessions) c = sesMgr.appSessions[+e], c.env === b && c.isIncognito === a && sesMgr.removeAppTracker(+e);
  b = a ? "incognito" : "regular";
  for (var d in sesMgr.domainSessions) (e = utils.basicClone(sesMgr.domainSessions[d][b])) && e.type === TrackerSessionType.LPUSER_DOMAIN && (timeRec.clearSessionTimer(e.sessionId), sesMgr.onSessionExpired(e.sessionId), sesMgr.addDomainTrackerForUrl(e.domain, a, {favIconUrl: e.favicon, title: e.title}));
}
var EXT_SAT_PING_CLEARANCES = {};
chrome.runtime.onMessage.addListener(function (a, b, c) {
  var e = b.tab.windowId, d = b.tab.id, f = utils.extractHostname(b.url);
  (0 < LOG_LEVEL && "EXT_SAT_REQUEST_SIGNAL" !== a.type && "stopapptimers" !== a.type || 1 < LOG_LEVEL) && console.log("postMessage received.\n> msg:", a, "\n> sender:", b);
  if (a && "EXT_SAT_REQUEST_SIGNAL" === a.type) c({clearance: void 0 === EXT_SAT_PING_CLEARANCES[d] && incChkr.isCompatibleDomain(f)}), void 0 === EXT_SAT_PING_CLEARANCES[d] && (EXT_SAT_PING_CLEARANCES[d] = true); else if (a && a.type && (a.data || a.gwstoken)) switch (a.type) {
    case "lplogin":
      b && b.tab && (0 < LOG_LEVEL && console.log("Login detected from tabId " + d + "."), onLPLogin(b.tab, a.data ? a.data.gwstoken : a.gwstoken));
      break;
    case "lplogout":
      b && b.tab && (0 < LOG_LEVEL && console.log("Logout detected from tabId " + d + "."), onLPLogout({env: utils.getLPEnvFromUrl(utils.getUrlFromTabObject(b.tab)), incognito: b.tab.incognito}));
      break;
    case "apptimer":
      b && b.tab && (c = b.tab.id, utils.allowedToAddSession(TrackerSessionType.LPUSER_APP, b.tab.incognito) && (1 < LOG_LEVEL && console.log("App launch detected from tabId " + c + "."), pendingAppTab = {appId: a.data.app_id, gwsToken: a.data.gwstoken, lpTabId: c, lpWindowId: e, lpUri: a.data.LaunchpadUri, init: Date.now()}, pendingAppTabs.push({appId: a.data.app_id, gwsToken: a.data.gwstoken, lpTabId: c, lpWindowId: e, lpUri: a.data.LaunchpadUri, init: Date.now()})), DEBUG_APPS_TRIGGER_LOGIN_SCRIPT && onLPLogin(b.tab, a.data.gwstoken));
      break;
    case "autolaunch":
      if (0 < a.data.length) {
        b = utils.getLPEnvFromUrl(b.origin);
        var g = btoa("islogin_" + b + window.location.host);
        chrome.storage.sync.get(function (b) {
          b[g] || (b = {}, chrome.storage.sync.set((b[g] = true, b)), a.data.forEach(function (b) {
            launchApps(e, d, {data: a}, b);
          }));
        });
      }
  }
});
function launchApps(a, b, c, e) {
  var d = c.data.IdConfigBaseUrl, f = e.id, g = e.type, k = e.encid;
  (e = e.url ? e.url : []) && 0 == e.length && (e[0] = "");
  a = {appId: f, windowId: a, tabId: b, gwsToken: c.data.gwstoken, lpUri: d.replace(/^https?:\/\//, "")};
  switch (g) {
    case 1:
    case 14:
    case 25:
    case 26:
    case 30:
    case 31:
    case 32:
    case 37:
    case 39:
      chromeTabsCreate(new RegExp(/^(http|https):\/\//).test(e[0]) ? e[0] : "http://" + e[0], a);
      break;
    case 3:
    case 27:
      chrome.tabs.executeScript(b, {code: "var s=document.createElement('script');s.textContent=\"(function(){var interval=setInterval(function(){window.location.assign(\\\"classlink:?token=" + e[0] + '\\");clearInterval(interval);},700);})();";document.head.appendChild(s);'});
      break;
    case 7:
    case 8:
      chromeTabsCreate(d + "/clhtml5/" + encodeURIComponent(k), a);
      break;
    case 9:
      chromeTabsCreate(d + "/clsso/" + f, a);
      break;
    case 15:
      chromeTabsCreate(d + "/browsersso/" + f, a);
      break;
    case 16:
    case 36:
      chromeTabsCreate(d + "/ltisso/" + f, a);
      break;
    case 17:
      chromeTabsCreate(d + "/focussso/" + f, a);
      break;
    case 18:
      chromeTabsCreate(d + "/pearson/mathxl/" + f, a);
      break;
    case 19:
      chromeTabsCreate(d + "/pearson/mymathlab/" + f, a);
      break;
    case 20:
      chromeTabsCreate(d + "/custom/certification/" + f, a);
      break;
    case 21:
      chromeTabsCreate(d + "/oneroster/" + f, a);
      break;
    case 22:
      chromeTabsCreate(d + "/phonebook/" + f, a);
      break;
    case 23:
      chromeTabsCreate(d + "/onerosterlti/" + f, a);
      break;
    case 24:
      chromeTabsCreate(d + "/assignapplication/" + f, a);
      break;
    case 28:
      chromeTabsCreate(d + "/custom/genericoneroster/ltilaunch/" + f, a);
      break;
    case 29:
    case 33:
      chromeTabsCreate(d + "/custom/pearsonapapp/" + f, a);
      break;
    case 34:
      chromeTabsCreate(d + "/custom/naviancestudentsso/" + f, a);
      break;
    case 35:
      chromeTabsCreate(d + "/oneroster/manage/class/" + f, a);
  }
}
function chromeTabsCreate(a, b) {
  var c = new RegExp(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi);
  b && a.match(c) ? chrome.tabs.create({url: a, active: false}, function (a) {
    sesMgr.addAppTracker(a, {appId: b.appId, gwsToken: b.gwsToken, lpUri: b.lpUri}, function (b) {
      0 < LOG_LEVEL && console.log("Autolaunched tab id " + a.id + " matched to app");
      onAddNewAppSession(b);
    });
  }) : 0 < LOG_LEVEL && console.log("Invalid url!");
}
;
