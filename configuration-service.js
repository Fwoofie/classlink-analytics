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
$jscomp.findInternal = function (a, c, b) {
  a instanceof String && (a = String(a));
  for (var d = a.length, e = 0; e < d; e++) {
    var f = a[e];
    if (c.call(b, f, e, a)) return {i: e, v: f};
  }
  return {i: -1, v: void 0};
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
$jscomp.polyfill("Array.prototype.find", function (a) {
  return a ? a : function (a, b) {
    return $jscomp.findInternal(this, a, b).v;
  };
}, "es6", "es3");
var DEBUG_USE_API = true, DEBUG_APPS_TRIGGER_LOGIN_SCRIPT = true, LOG_LEVEL = 0, configURLs = ["https://local.classlink/7b0748ef-be5d-49b6-9d73-ef4dee6e00b7/config.json", "http://local.classlink/7b0748ef-be5d-49b6-9d73-ef4dee6e00b7/config.json"], LPEnvironment = {PROD: "prod", BETA: "beta"}, DEFAULT_IGNORED_DOMAINS = ["chrome://", "chrome-extension://", "localhost:"];
function ConfigurationService() {
  console.log("ConfigurationService init");
  this.configLoaded = 0;
  this.PANOPTICON_MODE = this.receivedExternalConfig = false;
  this.ANON_TOKEN = null;
  this.TRACK_INCOGNITO_TABS = this.TRACK_INCOGNITO_APPS = false;
  this.IDLE_SESSION_TIMEOUT = 15;
  this.IDLE_SESSION_ERROR_RETRY_DELAY = 1;
  this.IDLE_USER_TIMEOUT = 15;
  this.ALLOW_IP_FETCH = false;
  this.ALLOWED_IP_ADDRESSES = [];
  this.EXCLUDED_IP_ADDRESSES = [];
  this.IP_REFETCH_INTERVAL = 120;
  this.MISSING_IP_PLACEHOLDER = "0.0.0.0";
  this.MAINTAIN_CL_LOGIN_INFO = true;
  this.IDLE_FOCUS_CHECK_INTERVAL = 5e3;
  this.PING_INTERVAL = 1;
  this.IGNORED_URLS = DEFAULT_IGNORED_DOMAINS;
  LOG_LEVEL = 0;
  this.lpLoginInstances = [];
  this.lpPersistentLoginInstances = [];
  this.applyDefaultConfigValues(false);
  this.getConfigurationFromAdminDeployment();
  0 < LOG_LEVEL && (DEBUG_USE_API ? console.log("Using API - activity will be tracked.") : console.log("Not using API - activity will be not tracked."));
}
ConfigurationService.prototype = {loadConfigInputs: function (a) {
  void 0 !== a.enableFullLogging && (this.PANOPTICON_MODE = a.enableFullLogging);
  void 0 !== a.anon_token && (this.ANON_TOKEN = a.anon_token);
  void 0 !== a.allowIPFetch && (this.ALLOW_IP_FETCH = a.allowIPFetch);
  void 0 !== a.ipRefetchIntervalMinutes && (this.IP_REFETCH_INTERVAL = a.ipRefetchIntervalMinutes, this.IP_REFETCH_INTERVAL = Math.max(this.IP_REFETCH_INTERVAL, 1));
  void 0 !== a.missingIPPlaceholder && (this.MISSING_IP_PLACEHOLDER = a.missingIPPlaceholder);
  void 0 !== a.idleSessionTimeoutMinutes && (this.IDLE_SESSION_TIMEOUT = a.idleSessionTimeoutMinutes, this.IDLE_SESSION_TIMEOUT = Math.max(this.IDLE_SESSION_TIMEOUT, 1), this.IDLE_SESSION_TIMEOUT = Math.min(this.IDLE_SESSION_TIMEOUT, 30));
  void 0 !== a.idleUserTimeoutMinutes && (this.IDLE_USER_TIMEOUT = a.idleUserTimeoutMinutes, this.IDLE_USER_TIMEOUT = Math.max(this.IDLE_USER_TIMEOUT, 1));
  void 0 !== a.urlMatchesToIgnore && (this.IGNORED_URLS = this.IGNORED_URLS.concat(a.urlMatchesToIgnore));
  void 0 !== a.trackIncognito && (this.TRACK_INCOGNITO_APPS = this.TRACK_INCOGNITO_TABS = a.trackIncognito);
  void 0 !== a.allowedIPs && (this.ALLOWED_IP_ADDRESSES = a.allowedIPs);
  void 0 !== a.excludedIPs && (this.EXCLUDED_IP_ADDRESSES = a.excludedIPs);
  void 0 !== a.maintainPreviousCLLogin && (this.MAINTAIN_CL_LOGIN_INFO = !!a.maintainPreviousCLLogin);
  void 0 === a.logLevel || isNaN(a.logLevel) || (LOG_LEVEL = Math.round(a.logLevel), LOG_LEVEL = Math.max(LOG_LEVEL, 0), LOG_LEVEL = Math.min(LOG_LEVEL, 2));
  this.configLoaded = utils.getCurrentTimeStamp();
}, getConfigurationFromAdminDeployment: function () {
  var a = "anon_token enableFullLogging trackIncognito idleSessionTimeoutMinutes idleUserTimeoutMinutes allowIPFetch allowedIPs excludedIPs ipRefetchIntervalMinutes missingIPPlaceholder urlMatchesToIgnore maintainPreviousCLLogin logLevel".split(" ");
  chrome.storage.managed.get(a, function (c) {
    var b = a.filter(function (a) {
      return void 0 !== c[a];
    });
    0 < b.length ? (this.receivedExternalConfig = true, this.loadConfigInputs(c), 0 < LOG_LEVEL && console.log("Extension policy successfully loaded."), 1 < LOG_LEVEL && console.log("Policy properties loaded:\n	" + b.map(function (a) {
      return a + ": " + c[a];
    }).join("\n	")), onConfigImportComplete()) : (0 < LOG_LEVEL && console.log("Extension policy could not be loaded. Attempting to fetch locally hosted config…"), this.getConfigurationFromPresetURL());
  }.bind(this));
}, getConfigurationFromPresetURL: function (a) {
  var c = this, b = a ? a : 0;
  if (b >= configURLs.length) 0 < LOG_LEVEL && console.log("Could not load locally hosted config. Applying default extension config values."), this.applyDefaultConfigValues(true), onConfigImportComplete(); else {
    1 < LOG_LEVEL && console.log("Attempting to fetch config from", configURLs[b]);
    var d = this, e = new XMLHttpRequest;
    e.open("GET", configURLs[b], true);
    e.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    e.setRequestHeader("Access-Control-Allow-Origin", "*");
    e.onreadystatechange = function () {
      if (4 === e.readyState) {
        var a = e.response;
        if (a) {
          try {
            a = JSON.parse(a);
          } catch (g) {}
          c.receivedExternalConfig = true;
          0 < LOG_LEVEL && console.log("Config received!");
          c.loadConfigInputs(a);
          onConfigImportComplete();
        } else d.getConfigurationFromPresetURL(b + 1);
      }
    };
    e.send();
  }
}, applyDefaultConfigValues: function (a) {
  this.PANOPTICON_MODE = this.receivedExternalConfig = false;
  this.ANON_TOKEN = null;
  this.ALLOW_IP_FETCH = false;
  this.IP_REFETCH_INTERVAL = 120;
  this.MISSING_IP_PLACEHOLDER = "0.0.0.0";
  this.IDLE_USER_TIMEOUT = this.IDLE_SESSION_TIMEOUT = 15;
  this.IGNORED_URLS = DEFAULT_IGNORED_DOMAINS;
  this.TRACK_INCOGNITO_APPS = this.TRACK_INCOGNITO_TABS = false;
  this.ALLOWED_IP_ADDRESSES = [];
  this.EXCLUDED_IP_ADDRESSES = [];
  this.MAINTAIN_CL_LOGIN_INFO = true;
  this.LOG_LEVEL = 0;
  if (void 0 === a || a) this.configLoaded = utils.getCurrentTimeStamp();
}, addUserLoginInfo: function (a, c, b) {
  for (var d = false, e = utils.getCurrentTimeStamp(), f = 0; f < this.lpLoginInstances.length; f++) {
    var g = utils.basicClone(this.lpLoginInstances[f]);
    if (g.isIncognito === c && g.lpEnv === b) {
      this.lpLoginInstances.splice(f, 1);
      g.gwsToken = a;
      g.createdAt = e;
      this.lpLoginInstances.push(g);
      0 < LOG_LEVEL && console.log("User login updated. Login instances:", this.lpLoginInstances);
      d = true;
      break;
    }
  }
  d || this.lpLoginInstances.push({gwsToken: a, lpEnv: b, isIncognito: c, createdAt: utils.getCurrentTimeStamp()});
  if (this.MAINTAIN_CL_LOGIN_INFO) {
    d = false;
    for (f = 0; f < this.lpPersistentLoginInstances.length; f++) if (g = utils.basicClone(this.lpPersistentLoginInstances[f]), g.isIncognito === c && g.lpEnv === b) {
      this.lpPersistentLoginInstances.splice(f, 1);
      g.gwsToken = a;
      g.createdAt = e;
      this.lpPersistentLoginInstances.push(g);
      d = true;
      break;
    }
    d || this.lpPersistentLoginInstances.push({gwsToken: a, lpEnv: b, isIncognito: c, createdAt: utils.getCurrentTimeStamp()});
  }
  this.updateLPPersistentStorage();
  0 < LOG_LEVEL && console.log("User login added. Login instances:", this.lpLoginInstances);
}, removeUserLoginInfo: function (a, c) {
  for (var b = 0; b < this.lpLoginInstances.length; b++) {
    var d = this.lpLoginInstances[b];
    if (d.isIncognito === a && d.lpEnv === c) {
      this.lpLoginInstances.splice(b, 1);
      0 < LOG_LEVEL && console.log("User login removed. Login instances:", this.lpLoginInstances);
      break;
    }
  }
  for (b = 0; b < this.lpPersistentLoginInstances.length; b++) if (d = this.lpPersistentLoginInstances[b], d.isIncognito === a && d.lpEnv === c) {
    this.lpPersistentLoginInstances.splice(b, 1);
    break;
  }
  this.updateLPPersistentStorage();
}, updateLPPersistentStorage: function () {
  1 < LOG_LEVEL && console.log("Updating login instances in sync storage:", this.lpPersistentLoginInstances);
  chrome.storage.sync.set({LP_LOGIN_INSTANCES: JSON.stringify(this.lpLoginInstances), LP_LOGIN_PERSISTENT_INSTANCES: JSON.stringify(this.lpPersistentLoginInstances), IS_INCOGNITO_ENABLED: this.TRACK_INCOGNITO_APPS || this.TRACK_INCOGNITO_TABS});
}, setupCLLoginsFromPersistentStorage: function () {
  this.MAINTAIN_CL_LOGIN_INFO ? (0 < LOG_LEVEL && console.log("Attempting to load prior LaunchPad logins from persistent storage."), chrome.storage.sync.get(["LP_LOGIN_INSTANCES", "LP_LOGIN_PERSISTENT_INSTANCES"], function (a) {
    if (a.LP_LOGIN_PERSISTENT_INSTANCES) {
      var c = [];
      try {
        c = JSON.parse(a.LP_LOGIN_PERSISTENT_INSTANCES), 0 < LOG_LEVEL && console.log("Loaded prior login data from persistent storage:", c), this.lpPersistentLoginInstances = c, this.updateLPPersistentStorage();
      } catch (b) {
        console.error("Error while parsing persistent login data:", b);
      }
    }
  }.bind(this))) : (1 < LOG_LEVEL && console.log("Config does not allow loading LaunchPad logins from persistent storage; skipping this operation."), this.lpPersistentLoginInstances = [], this.updateLPPersistentStorage());
}, getLoggedInUser: function (a) {
  1 < LOG_LEVEL && console.log("Searching records for logged-in user.");
  for (var c = {}, b = $jscomp.makeIterator([LPEnvironment.BETA, LPEnvironment.PROD]), d = b.next(); !d.done; c = {env: c.env}, d = b.next()) if (c.env = d.value, d = this.lpLoginInstances.find(function (c) {
    return function (b) {
      return b.isIncognito === a && b.lpEnv === c.env;
    };
  }(c))) return 1 < LOG_LEVEL && console.log("Logged-in user info found:", d), d;
  if (this.MAINTAIN_CL_LOGIN_INFO) for (c = {}, b = $jscomp.makeIterator([LPEnvironment.BETA, LPEnvironment.PROD]), d = b.next(); !d.done; c = {env$5: c.env$5}, d = b.next()) if (c.env$5 = d.value, d = this.lpPersistentLoginInstances.find(function (c) {
    return function (b) {
      return b.isIncognito === a && b.lpEnv === c.env$5;
    };
  }(c))) return 1 < LOG_LEVEL && console.log("Logged-in user info found in persistent storage:", d), d;
  1 < LOG_LEVEL && console.log("No logged-in user info found.");
  return null;
}};
