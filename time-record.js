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
$jscomp.polyfill("Array.prototype.keys", function (a) {
  return a ? a : function () {
    return $jscomp.iteratorFromArray(this, function (a) {
      return a;
    });
  };
}, "es6", "es3");
function TimeRecord() {
  console.log("TimeRecord init");
  this.processingDomains = {};
  this.processingApps = {};
}
TimeRecord.prototype = {afterConfigImport: function () {
  chrome.alarms.create("periodAlarm", {delayInMinutes: cfgSvc.PING_INTERVAL, periodInMinutes: cfgSvc.PING_INTERVAL});
}, registerAppSession: function (a) {
  var b = this;
  1 < LOG_LEVEL && console.log("TimeRecord.registerAppSession() appSession:", a);
  a && a.gwsToken && a.tabId && a.appId && a.env ? this.processingAppInProgress(a.tabId) || (DEBUG_USE_API ? claApi.openAppSession({appId: a.appId, gwsToken: a.gwsToken, env: a.env}, function (c) {
    b.receiveAppRegistrationResponse(a, c);
  }, function (c) {
    0 < LOG_LEVEL && console.error("TimeRecord.registerAppSession() ERROR:", c);
    b.receiveAppRegistrationError(a, c);
  }) : setTimeout(function () {
    var c = {N_USR_id: -1, appToken: window.btoa(a.gwsToken), sessionId: window.btoa(String(a.createdAt) + String(a.appId))};
    b.receiveAppRegistrationResponse(a, c);
  }, 750)) : 0 < LOG_LEVEL && console.warn("TimeRecord.registerAppSession(): missing required appSession value(s):", a);
}, receiveAppRegistrationResponse: function (a, b) {
  a = sesMgr.getAppTracker(a.tabId);
  a.N_USR_id = b.N_USR_id;
  a.appToken = b.appToken;
  a.sessionId = b.sessionId;
  a.status = TrackerSessionStatus.RUNNING;
  a.lpChildTabs = void 0 !== b.trackChildren ? !!b.trackChildren : true;
}, receiveAppRegistrationError: function (a, b) {}, registerNewDomainFromUrl: function (a, b) {
  var c = this;
  if (utils.isValidUrl(a)) {
    var d = b.domain, e = b.isIncognito;
    if (!this.processingDomainInProgress(d, e)) if (this.processingDomainStart(d, e), DEBUG_USE_API) if (b.type === TrackerSessionType.LPUSER_DOMAIN) claApi.openDomainSession({gwsToken: b.gwsToken, domain: d, env: b.env, N_USR_id: b.N_USR_id, favicon: b.favicon, title: b.title}, function (a) {
      c.receiveDomainRegistrationResponse(d, a, e);
    }, function (a) {
      0 < LOG_LEVEL && console.error("TimeRecord.registerNewDomainFromUrl() lpuser-domain ERROR:", a);
      a && a.data && 401 === a.data.statusCode && "Unauthorized" === a.data.error && "Invalid token" === a.data.message && (1 < LOG_LEVEL && console.log('Abandoning login info associated with gws token "' + b.gwsToken + '"'), onLPLogout({env: b.env, incognito: e}));
      c.processingDomainEnd(d, e);
    }); else if (b.type === TrackerSessionType.ANON_DOMAIN) {
      if (cfgSvc.configLoaded && (!cfgSvc.PANOPTICON_MODE || !cfgSvc.ANON_TOKEN)) return this.processingDomainEnd(d, e);
      claApi.openAnonDomainSession({domain: d, userToken: b.tenantToken, ip: ipChkr.getIPAddress(), env: b.env, favicon: b.favicon, title: b.title}, function (a) {
        c.receiveDomainRegistrationResponse(d, a, e);
      }, function (a) {
        0 < LOG_LEVEL && console.error("TimeRecord.registerNewDomainFromUrl() anon-domain ERROR:", a);
        c.processingDomainEnd(d, e);
      });
    } else 0 < LOG_LEVEL && console.warn("TimeRecord.registerNewDomainFromUrl(): Unexpected session type:", b.type), this.processingDomainEnd(d, e); else setTimeout(function () {
      var a = {domainToken: window.btoa(d), sessionId: window.btoa(String(b.createdAt) + d)};
      c.receiveDomainRegistrationResponse(d, a, e);
    }, 750);
  }
}, receiveDomainRegistrationResponse: function (a, b, c) {
  1 < LOG_LEVEL && console.log("receiveDomainRegistrationResponse domainInfo:", b);
  var d = sesMgr.getDomainTracker(a, c);
  if (d) {
    var e = utils.getCurrentTimeStamp();
    d.domainToken = b.domainToken;
    d.sessionId = b.sessionId;
    b.N_USR_id && (d.N_USR_id = b.N_USR_id);
    d.createdAt = e;
    d.status = TrackerSessionStatus.RUNNING;
    0 < LOG_LEVEL && console.log("Domain registered:", a, "\nDomain sessions:", sesMgr.domainSessions);
    navMon.activeDomain !== a && this.resetSessionTimer(b.sessionId);
    this.processingDomainEnd(a, c);
  } else 0 < LOG_LEVEL && console.warn("TimeRecord.receiveDomainRegistrationResponse(): received registration response for domain " + a + ", but no session tracker exists");
}, onSessionActivated: function (a) {
  a && this.clearSessionTimer(a);
}, onSessionDeactivated: function (a) {
  a && this.resetSessionTimer(a);
}, resetSessionTimer: function (a, b) {
  b = void 0 === b ? cfgSvc.IDLE_SESSION_TIMEOUT : b;
  chrome.alarms.create(DAPFX + a, {delayInMinutes: b});
}, clearSessionTimer: function (a) {
  chrome.alarms.clear(DAPFX + a);
}, logAllElapsedTime: function (a) {
  var b = this, c = {}, d = false;
  c[TrackerSessionType.LPUSER_APP] = {};
  c[TrackerSessionType.LPUSER_DOMAIN] = {};
  c[TrackerSessionType.ANON_DOMAIN] = {};
  a.forEach(function (a) {
    var b = utils.calcElapsedSeconds(a.elapsed);
    if (a.type && b && 0 < b) {
      b = c[a.type];
      var e = a.type === TrackerSessionType.ANON_DOMAIN ? a.tenantToken : a.gwsToken;
      b[e] || (b[e] = []);
      b[e].push(a);
      d = true;
    }
  });
  d ? (1 < LOG_LEVEL && console.log("TIME GROUPS:", c), a = Object.keys(c[TrackerSessionType.LPUSER_APP]), 0 < a.length && a.forEach(function (a) {
    b.logAppActivity(c[TrackerSessionType.LPUSER_APP][a], a);
  }), a = Object.keys(c[TrackerSessionType.LPUSER_DOMAIN]), 0 < a.length && a.forEach(function (a) {
    b.logDomainsActivity(c[TrackerSessionType.LPUSER_DOMAIN][a]);
  }), a = Object.keys(c[TrackerSessionType.ANON_DOMAIN]), 0 < a.length && a.forEach(function (a) {
    b.logAnonDomainsActivity(a, ipChkr.getIPAddress(), c[TrackerSessionType.ANON_DOMAIN][a]);
  })) : 0 < LOG_LEVEL && console.log("Period alarm triggered, but no new data to send. Aborting.");
}, logAnonDomainsActivity: function (a, b, c) {
  var d = this;
  if (0 !== c.length) {
    1 < LOG_LEVEL && console.log("Logging anon-domain sessions:", c);
    var e = c.map(function (a) {
      return {domainToken: a.domainToken, sessionId: a.sessionId, activeS: utils.calcElapsedSeconds(a.elapsed)};
    });
    DEBUG_USE_API ? claApi.sendRequest({method: "POST", endpoint: "/anonLaunch/v1p0/activity", env: c[0].env, params: {token: a}, body: {IPAddress: b, sessions: e}}, function (a) {
      a.success ? d.receiveLogTimeForDomainsResponse(a.data, e) : 0 < LOG_LEVEL && console.error("/anonLaunch/v1p0/launch ERROR:", a);
    }) : setTimeout(function () {
      d.receiveLogTimeForDomainsResponse({sessions: e.map(function (a) {
        return {domainToken: a.domainToken, sessionId: a.sessionId, activeS: a.activeS};
      })}, e);
    }, 1750);
  }
}, logDomainsActivity: function (a) {
  var b = this;
  if (0 !== a.length) {
    1 < LOG_LEVEL && console.log("Logging lpuser-domain sessions:", a);
    var c = a[0].N_USR_id, d = a[0].gwsToken, e = a.map(function (a) {
      return {domainToken: a.domainToken, sessionId: a.sessionId, activeS: utils.calcElapsedSeconds(a.elapsed)};
    });
    DEBUG_USE_API ? claApi.logDomainSessionActivity({gwsToken: d, env: a[0].env, N_USR_id: c, sessions: e}, function (a) {
      b.receiveLogTimeForDomainsResponse(a, e);
    }, function (a) {
      0 < LOG_LEVEL && console.error("/launch/v1p1/lp/activity ERROR:", a);
    }) : setTimeout(function () {
      b.receiveLogTimeForDomainsResponse({sessions: e.map(function (a) {
        return {domainToken: a.domainToken, sessionId: a.sessionId, activeS: a.activeS};
      })}, e);
    }, 1750);
  }
}, logAppActivity: function (a, b) {
  var c = this;
  if (0 !== a.length) {
    1 < LOG_LEVEL && console.log("Logging lpuser-app sessions:", a);
    var d = a.map(function (a) {
      return {appToken: a.appToken, sessionId: a.sessionId, activeS: utils.calcElapsedSeconds(a.elapsed)};
    });
    DEBUG_USE_API ? claApi.logAppSessionActivity({gwsToken: b, env: a[0].env, sessions: d}, function (a) {
      c.receiveLogTimeForAppsResponse(a, d);
    }, function (a) {
      0 < LOG_LEVEL && console.error("/launch/v1p1/lp/activity ERROR:", a);
      c.receiveLogTimeForAppsError(a, d);
    }) : setTimeout(function () {
      var b = {N_USR_id: a[0].N_USR_id, sessions: d.map(function (a) {
        return {appToken: a.appToken, sessionId: a.sessionId, activeS: a.activeS};
      })};
      c.receiveLogTimeForAppsResponse(b, d);
    }, 950);
  }
}, receiveLogTimeForAppsResponse: function (a, b) {
  1 < LOG_LEVEL && console.log("TimeRecord.receiveLogTimeForAppsResponse()", a, b);
  if (a && a.sessions && Array.isArray(a.sessions)) {
    var c = {};
    b.forEach(function (a) {
      c[a.sessionId] = 1e3 * a.activeS;
    });
    onTimeLogSuccess(c);
    if (b.length !== a.sessions.length) 0 < LOG_LEVEL && console.warn("TimeRecord.receiveLogTimeForAppsResponse: mismatched sent/received length"); else for (var d = a.N_USR_id, e = 0; e < b.length; e++) {
      var f = a.sessions[e].sessionId, g = b[e].sessionId;
      f !== g && (0 < LOG_LEVEL && console.log('Updating sessionId from "' + g + '" to "' + f + '"'), sesMgr.updateSessionId(g, f));
      (g = sesMgr.findSessionById(f)) && g.N_USR_id !== d && (0 < LOG_LEVEL && console.log('Updating N_USR_id from "' + g.N_USR_id + '" to "' + d + '"'), sesMgr.updateN_USR_id(f, d));
    }
  } else 0 < LOG_LEVEL && console.warn("TimeRecord.receiveLogTimeForAppsResponse(): Unexpected res value:", a);
}, receiveLogTimeForAppsError: function (a, b) {}, processingAppStart: function (a) {
  this.processingApps[a] = true;
}, processingAppEnd: function (a) {
  delete this.processingApps[a];
}, processingAppInProgress: function (a) {
  return !!this.processingApps[a];
}, processingDomainStart: function (a, b) {
  a ? (this.processingDomains[a] || (this.processingDomains[a] = {}), this.processingDomains[a][b ? "incognito" : "regular"] = true) : console.warn("TimeRecord.processingDomainStart() given invalid domain:", a);
}, processingDomainEnd: function (a, b) {
  a ? (this.processingDomains[a] && delete this.processingDomains[a][b ? "incognito" : "regular"], 0 === Object.keys(this.processingDomains[a]).length && delete this.processingDomains[a]) : console.warn("TimeRecord.processingDomainEnd() given invalid domain:", a);
}, processingDomainInProgress: function (a, b) {
  return this.processingDomains[a] && this.processingDomains[a][b ? "incognito" : "regular"];
}, receiveLogTimeForDomainsResponse: function (a, b) {
  if (a && a.sessions && Array.isArray(a.sessions)) {
    var c = {};
    b.forEach(function (a) {
      c[a.sessionId] = 1e3 * a.activeS;
    });
    onTimeLogSuccess(c);
    if (b.length !== a.sessions.length) 0 < LOG_LEVEL && console.warn("TimeRecord.receiveLogTimeForDomainsResponse: mismatched sent/received length"); else for (var d = 0; d < b.length; d++) {
      var e = a.sessions[d].sessionId, f = b[d].sessionId;
      e !== f && (0 < LOG_LEVEL && console.log('Updating sessionId from "' + f + '" to "' + e + '"'), sesMgr.findDomainSessionById(f).sessionId = e);
    }
  } else 0 < LOG_LEVEL && console.warn("TimeRecord.receiveLogTimeForDomainsResponse(): Unexpected res value:", a);
}};
