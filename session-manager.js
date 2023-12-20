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
var TrackerSessionType = {LPUSER_APP: "lpuser-app", LPUSER_DOMAIN: "lpuser-domain", ANON_DOMAIN: "anon-domain"}, TrackerSessionStatus = {UNREGISTERED: "unregistered", RUNNING: "running", EXPIRED: "expired", DORMANT: "dormant"};
function SessionManager() {
  this.domainSessions = {};
  this.appSessions = {};
  this.expiredSessions = {};
  this.dormantSessions = {};
}
SessionManager.prototype = {getTrackerForTab: function (a) {
  if (!a) return null;
  var b = this.getAppTracker(a.id);
  return b ? b : this.getDomainTracker(utils.getUrlFromTabObject(a), a.incognito);
}, getAppTracker: function (a) {
  if (this.appSessions[a]) return this.appSessions[a];
  for (var b = $jscomp.makeIterator(Object.keys(this.dormantSessions)), c = b.next(); !c.done; c = b.next()) if (c = c.value, this.dormantSessions[c].tabId === a) return this.dormantSessions[c];
}, removeAppTracker: function (a) {
  delete this.appSessions[a];
}, addAppTracker: function (a, b, c) {
  if (idleMon.isUserIdle) 0 < LOG_LEVEL && console.warn("SessionManager.addAppTracker(): cannot add app tracker while user is idle"); else {
    var d = a.id, e = this.getAppTracker(d);
    if (e) if (e.status === TrackerSessionStatus.DORMANT) delete this.dormantSessions[d]; else {
      0 < LOG_LEVEL && console.warn("SessionManager.addAppTracker(): app tracker already exists for tabId", d);
      return;
    }
    d && b && b.appId && b.gwsToken ? utils.allowedToAddSession(TrackerSessionType.LPUSER_APP, a.incognito) ? (e = utils.getCurrentTimeStamp(), this.appSessions[d] = {type: TrackerSessionType.LPUSER_APP, status: TrackerSessionStatus.UNREGISTERED, favicon: null, title: null, sessionId: null, appId: b.appId, tabId: d, appToken: null, gwsToken: b.gwsToken, N_USR_id: null, env: utils.getLPEnvFromUrl(b.lpUri), elapsed: 0, logged: 0, createdAt: e, lastUpdatedAt: e, lastLoggedAt: e, isIncognito: !!a.incognito}, 0 < LOG_LEVEL && console.log("Added app, id " + b.appId + ". Apps tracker:", this.appSessions), c && c(this.getAppTracker(d))) : 0 < LOG_LEVEL && console.warn("SessionManager.addAppTracker(): not allowed to track app", d) : 0 < LOG_LEVEL && console.warn("SessionManager.addAppTracker(): missing required parameter(s)", d, b);
  }
}, incrementAppTracker: function (a, b) {
  if (!a) 0 < LOG_LEVEL && console.warn("SessionManager.incrementAppTracker(): missing tabData"); else if (void 0 !== b) {
    var c = a.id, d = this.getAppTracker(c);
    c && d ? (d.elapsed += b, d.lastUpdatedAt = utils.getCurrentTimeStamp(), d.status === TrackerSessionStatus.DORMANT && (1 < LOG_LEVEL && console.log("SessionManager.incrementAppTracker(): session is dormant, restoring"), this.restoreAppTracker(a, d)), 0 < LOG_LEVEL && console.log("App session for tabId " + c + " incremented by " + b + " ms. Current tracker:", this.appSessions)) : 0 < LOG_LEVEL && console.warn("SessionManager.incrementAppTracker(): session does not exist for tabId", c);
  }
}, restoreAppTracker: function (a, b) {
  if (b && b.status === TrackerSessionStatus.DORMANT) {
    var c = utils.basicClone(b);
    this.addAppTracker(a, {appId: c.appId, gwsToken: c.gwsToken, lpUri: utils.getLPUrlFromEnv(c.env)}, function (b) {
      0 < LOG_LEVEL && console.log("Restoring app session for tab id " + a.id + ".");
      b.elapsed += c.elapsed;
      onAddNewAppSession(b);
    });
  } else 1 < LOG_LEVEL && console.log("SessionManager.restoreAppTracker(): invalid session, aborting", b);
}, getDomainTracker: function (a, b) {
  a = utils.extractHostname(a);
  if (this.domainSessions[a]) return b = this.getSubpath(b), this.domainSessions[a][b];
}, removeDomainTracker: function (a, b) {
  var c = this.getSubpath(b);
  this.domainSessions[a] && this.domainSessions[a][c] ? (delete this.domainSessions[a][c], 0 === Object.keys(this.domainSessions[a]).length && delete this.domainSessions[a], 0 < LOG_LEVEL && console.log('Removed "' + a + '" domain tracker. Current trackers:', this.domainSessions)) : 0 < LOG_LEVEL && console.warn("SessionManager.removeDomainTracker(): " + this.getSubpath(b) + " " + ('tracker for domain "' + a + '" does not exist. Skipping operation.'));
}, getSubpath: function (a) {
  return a ? "incognito" : "regular";
}, incrementDomainTrackerForUrl: function (a, b, c, d) {
  d = void 0 === d ? {} : d;
  1 < LOG_LEVEL && console.log("incrementDomainTrackerForUrl(" + a + ", " + b + ", " + c + ")");
  if (utils.isValidUrl(a) && ipChkr.isUserIPValid) {
    var e = this.getDomainTracker(a, c);
    void 0 === e ? (e = cfgSvc.getLoggedInUser(c) ? TrackerSessionType.LPUSER_DOMAIN : TrackerSessionType.ANON_DOMAIN, utils.allowedToAddSession(e, c) && (this.addDomainTrackerForUrl(a, c, d), this.incrementDomainTrackerForUrl(a, b, c, d))) : (e.elapsed += b, e.lastUpdatedAt = utils.getCurrentTimeStamp());
  }
}, transferElapsedToRecorded: function (a, b) {
  1 < LOG_LEVEL && console.log("transferElapsedToRecorded", a, b);
  var c = this.findSessionById(a);
  void 0 !== c ? (c.elapsed -= b, c.logged += b, a = utils.getCurrentTimeStamp(), c.lastUpdatedAt = a, c.lastLoggedAt = a) : 0 < LOG_LEVEL && console.warn("SessionManager.transferElapsedToRecorded(): session " + a + " does not exist. Skipping operation.");
}, addDomainTrackerForUrl: function (a, b, c) {
  c = void 0 === c ? {} : c;
  if (utils.shouldBlockForIncognito(b, false)) 0 < LOG_LEVEL && console.warn("SessionManager.addDomainTrackerForUrl(): not allowed to track incognito url:", a); else {
    var d = utils.extractHostname(a), e = utils.getCurrentTimeStamp(), f = this.getSubpath(b), h = cfgSvc.getLoggedInUser(b), g = h ? TrackerSessionType.LPUSER_DOMAIN : TrackerSessionType.ANON_DOMAIN, k = g === TrackerSessionType.LPUSER_DOMAIN ? h.lpEnv : LPEnvironment.PROD;
    cfgSvc.configLoaded && g === TrackerSessionType.ANON_DOMAIN && !cfgSvc.ANON_TOKEN ? 0 < LOG_LEVEL && console.log("SessionManager.addDomainTrackerForUrl(): missing anon token; not allowed to track anonymous user of:", a) : (this.domainSessions[d] || (this.domainSessions[d] = {}), this.domainSessions[d][f] = {type: g, env: k, domain: d, sessionId: null, isIncognito: b, status: TrackerSessionStatus.UNREGISTERED, favicon: c && c.favIconUrl ? c.favIconUrl : void 0, title: c && c.title ? c.title : void 0, gwsToken: g === TrackerSessionType.LPUSER_DOMAIN ? h.gwsToken : void 0, tenantToken: g === TrackerSessionType.ANON_DOMAIN ? cfgSvc.ANON_TOKEN : void 0, elapsed: 0, logged: 0, createdAt: e, lastUpdatedAt: e, lastLoggedAt: e}, c.delayRegister || onAddNewDomainSession(a, this.domainSessions[d][f]));
  }
}, removeExpiredTracker: function (a) {
  this.expiredSessions[a] ? delete this.expiredSessions[a] : 0 < LOG_LEVEL && console.warn("SessionManager.removeExpiredTracker(): session " + a + " does not exist");
}, removeTracker: function (a) {
  var b = utils.basicClone(this.findSessionById(a));
  if (b) switch (a = b.domain, b.type) {
    case TrackerSessionType.LPUSER_APP:
      delete this.appSessions[b.tabId];
      break;
    case TrackerSessionType.LPUSER_DOMAIN:
      this.removeDomainTracker(a, b.isIncognito);
      break;
    case TrackerSessionType.ANON_DOMAIN:
      this.removeDomainTracker(a, b.isIncognito);
  } else 0 < LOG_LEVEL && console.warn("SessionManager.removeTracker(): session " + a + " does not exist. Skipping operation.");
}, triggerActiveTimerUpdate: function () {
  var a = navMon.activeTabData;
  1 < LOG_LEVEL && console.log("SessionManager.triggerActiveTimerUpdate(): activeTab:", a);
  if (a) if (this.getAppTracker(a.id)) this.incrementAppTracker(navMon.activeTabData, navMon.getElapsedTimeToNow(true)); else {
    var b = navMon.activeUrl;
    utils.isValidUrl(navMon.activeUrl) && this.incrementDomainTrackerForUrl(b, navMon.getElapsedTimeToNow(true), a.incognito, a);
  } else navMon.updatePrimaryTimestamp();
}, transferSessionToExpired: function (a) {
  var b = this.findSessionById(a);
  b && b.sessionId ? (b.status = TrackerSessionStatus.EXPIRED, this.expiredSessions[a] = utils.basicClone(b), this.removeTracker(a)) : 0 < LOG_LEVEL && console.warn('SessionManager.transferSessionToExpired: session "' + a + '" does not exist, aborting');
}, onSessionExpired: function (a, b) {
  var c = this;
  this.transferSessionToExpired(a);
  var d = utils.basicClone(this.expiredSessions[a]);
  if (d && d.sessionId) switch (b = utils.calcElapsedSeconds(d.elapsed), d.type) {
    case TrackerSessionType.LPUSER_APP:
      DEBUG_USE_API ? claApi.closeAppSession({gwsToken: d.gwsToken, sessionId: a, activeS: b, env: d.env}, function (b) {
        c.dormantSessions[a] = d;
        c.dormantSessions[a].status = TrackerSessionStatus.DORMANT;
        receiveSessionEndResponse(a, b);
      }, function (b) {
        receiveSessionEndError(a, b);
      }) : setTimeout(function () {
        c.dormantSessions[a] = d;
        c.dormantSessions[a].status = TrackerSessionStatus.DORMANT;
        receiveSessionEndResponse(a, null);
        console.log("DORMANT SESSIONS:", c.dormantSessions);
      }, 550);
      break;
    case TrackerSessionType.LPUSER_DOMAIN:
      DEBUG_USE_API ? claApi.closeDomainSession({gwsToken: d.gwsToken, sessionId: a, activeS: b, env: d.env}, function (b) {
        receiveSessionEndResponse(a, b);
      }, function (b) {
        receiveSessionEndError(a, b);
      }) : setTimeout(function () {
        receiveSessionEndResponse(a, null);
      }, 550);
      break;
    case TrackerSessionType.ANON_DOMAIN:
      DEBUG_USE_API ? claApi.closeAnonDomainSession({userToken: d.tenantToken, sessionId: a, activeS: b, env: d.env}, function (b) {
        receiveSessionEndResponse(a, b);
      }, function (b) {
        receiveSessionEndError(a, b);
      }) : setTimeout(function () {
        receiveSessionEndResponse(a, null);
      }, 550);
  } else 0 < LOG_LEVEL && console.warn('SessionManager.onSessionExpired: session "' + a + '" does not exist, aborting');
}, onTimeRecordSuccess: function (a) {
  var b = this;
  1 < LOG_LEVEL && console.log("SessionManager.onTimeRecordSuccess:", a);
  a ? Object.keys(a).forEach(function (c) {
    b.findSessionById(c) && sesMgr.transferElapsedToRecorded(c, a[c]);
  }) : 0 < LOG_LEVEL && console.warn("NavigationMonitor.onTimeRecordSuccess(): invalid decrTrackers value:", a);
}, updateSessionId: function (a, b) {
  if (a = this.findSessionById(a)) a.sessionId = b;
}, updateN_USR_id: function (a, b) {
  if (a = this.findSessionById(a)) a.N_USR_id = b;
}, findDomainSessionById: function (a) {
  for (var b = $jscomp.makeIterator(Object.keys(this.domainSessions)), c = b.next(); !c.done; c = b.next()) {
    c = c.value;
    for (var d = $jscomp.makeIterator(["regular", "incognito"]), e = d.next(); !e.done; e = d.next()) {
      e = e.value;
      var f = this.domainSessions[c][e];
      if (f && f.sessionId === a) return this.domainSessions[c][e];
    }
  }
}, findSessionById: function (a) {
  for (var b = $jscomp.makeIterator(Object.keys(this.appSessions)), c = b.next(); !c.done; c = b.next()) if ((c = this.appSessions[c.value]) && c.sessionId === a) return c;
  b = $jscomp.makeIterator(Object.keys(this.domainSessions));
  for (c = b.next(); !c.done; c = b.next()) {
    c = c.value;
    for (var d = $jscomp.makeIterator(["regular", "incognito"]), e = d.next(); !e.done; e = d.next()) if ((e = this.domainSessions[c][e.value]) && e.sessionId === a) return e;
  }
  if (this.expiredSessions[a]) return this.expiredSessions[a];
  if (this.dormantSessions[a]) return this.dormantSessions[a];
}, generateAllSessions: function () {
  for (var a = [], b = $jscomp.makeIterator(Object.keys(this.domainSessions)), c = b.next(); !c.done; c = b.next()) {
    c = c.value;
    for (var d = $jscomp.makeIterator(["regular", "incognito"]), e = d.next(); !e.done; e = d.next()) e = this.domainSessions[c][e.value], void 0 !== e && a.push(e);
  }
  b = $jscomp.makeIterator(Object.keys(this.appSessions));
  for (c = b.next(); !c.done; c = b.next()) c = this.appSessions[c.value], void 0 !== c && a.push(c);
  return a;
}, generateAllSessionsWithElapsedTime: function (a) {
  a = void 0 === a ? true : a;
  var b = [], c = [], d = this.generateAllSessions();
  1 < LOG_LEVEL && console.log("SessionManager.generateAllSessionsWithElapsedTime(): allSessions:", utils.basicClone(d));
  d = $jscomp.makeIterator(d);
  for (var e = d.next(); !e.done; e = d.next()) e = e.value, a && !e.sessionId ? (e.Reason = "Missing sessionId", c.push(e)) : !e.elapsed || 0 >= e.elapsed ? (e.Reason = "No elapsed time", c.push(e)) : b.push(e);
  0 < LOG_LEVEL && (0 < b.length && (console.log("Sending data for the following session(s):"), console.table(b, ["sessionId", "type", "domain", "appId", "elapsed"])), 0 < c.length && (console.log("NOT sending data for the following session(s):"), console.table(c, "sessionId type domain appId elapsed Reason".split(" "))));
  return b;
}, endTabAppSession: function (a) {
  var b = this, c = this.getAppTracker(a);
  if (c) {
    var d = c.sessionId;
    this.transferSessionToExpired(d);
    c = this.expiredSessions[d];
    timeRec.processingAppStart(a);
    DEBUG_USE_API ? claApi.closeAppSession({gwsToken: c.gwsToken, sessionId: d, activeS: utils.calcElapsedSeconds(c.elapsed), env: c.env}, function (a) {
      receiveSessionEndResponse(d, a);
      delete b.dormantSessions[d];
    }, function (a) {
      receiveSessionEndError(d, a);
    }) : setTimeout(function () {
      receiveSessionEndResponse(d, null);
      delete b.dormantSessions[d];
    }, 550);
  }
}};
