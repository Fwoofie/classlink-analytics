var IDLEALARMNAME_WINDOWFOCUS = "IDLEALARM_FOCUS";
function IdleMonitor() {
  this.isIdleTimerStarted = this.isSystemIdle = this.isUserIdle = false;
  this.focusedWindowId = chrome.windows.WINDOW_ID_NONE;
  console.log("IdleMonitor init");
  this.checkWindowFocusAndUpdate();
  this.setSystemIdleDetectionInterval();
  chrome.idle.onStateChanged.addListener(this.onChromeIdleStateChange.bind(this));
  chrome.tabs.onCreated.addListener(this.onTabActivity.bind(this));
  chrome.tabs.onRemoved.addListener(this.onTabActivity.bind(this));
  chrome.tabs.onActivated.addListener(this.onTabActivity.bind(this));
  chrome.tabs.onHighlightChanged.addListener(this.onTabActivity.bind(this));
  chrome.tabs.onMoved.addListener(this.onTabActivity.bind(this));
  chrome.tabs.onUpdated.addListener(this.onTabActivity.bind(this));
  chrome.windows.onCreated.addListener(this.onWindowActivity.bind(this));
  chrome.windows.onRemoved.addListener(this.onWindowActivity.bind(this));
  chrome.windows.onFocusChanged.addListener(this.onWindowFocusChanged.bind(this));
  var a = this;
  chrome.alarms.onAlarm.addListener(function (b) {
    b.name === IDLEALARMNAME_WINDOWFOCUS && a.idleStartTrigger();
  });
  setInterval(function () {
    a.checkWindowFocusAndUpdate();
  }, cfgSvc.IDLE_FOCUS_CHECK_INTERVAL);
}
IdleMonitor.prototype = {setSystemIdleDetectionInterval: function (a) {
  a = void 0 === a ? cfgSvc.IDLE_USER_TIMEOUT : a;
  chrome.idle.setDetectionInterval(60 * a);
}, setIdleTimer: function () {
  1 < LOG_LEVEL && console.log("Resetting idle timer.");
  this.isIdleTimerStarted = true;
  chrome.alarms.create(IDLEALARMNAME_WINDOWFOCUS, {delayInMinutes: cfgSvc.IDLE_USER_TIMEOUT});
  this.idleEndTrigger();
}, removeIdleTimer: function () {
  1 < LOG_LEVEL && console.log("Clearing idle timer.");
  this.idleEndTrigger();
  this.isIdleTimerStarted = false;
  chrome.alarms.clear(IDLEALARMNAME_WINDOWFOCUS);
}, checkWindowFocusAndUpdate: function () {
  var a = this;
  chrome.windows.getCurrent(function (b) {
    b.focused && b.state && "minimized" !== b.state && !utils.shouldBlockForIncognito(b.incognito, false) ? (b.id && (a.focusedWindowId = b.id), a.isSystemIdle || a.removeIdleTimer()) : (a.isIdleTimerStarted || a.focusedWindowId === chrome.windows.WINDOW_ID_NONE || (1 < LOG_LEVEL && console.log("Browser no longer appears to be in focus, starting idle timer"), a.setIdleTimer(), navMon.updateActiveTab(null)), a.focusedWindowId = chrome.windows.WINDOW_ID_NONE);
  });
}, onChromeIdleStateChange: function (a) {
  "idle" === a || "locked" === a ? (this.isSystemIdle = true, this.idleStartTrigger()) : "active" === a && (this.isSystemIdle = false, this.isAnyWindowFocused() && this.idleEndTrigger());
}, idleStartTrigger: function () {
  1 < LOG_LEVEL && console.log("IdleMonitor.idleStartTrigger()");
  this.isUserIdle || (this.isUserIdle = true, onUserIdleStart());
}, idleEndTrigger: function () {
  1 < LOG_LEVEL && console.log("IdleMonitor.idleEndTrigger()");
  this.isUserIdle && (this.isUserIdle = false, onUserIdleEnd());
}, isAnyWindowFocused: function () {
  return this.focusedWindowId !== chrome.windows.WINDOW_ID_NONE;
}, onWindowActivity: function () {
  this.checkWindowFocusAndUpdate();
}, onTabActivity: function () {
  this.checkWindowFocusAndUpdate();
}, onWindowFocusChanged: function (a) {
  this.focusedWindowId = a;
  this.isAnyWindowFocused() ? this.removeIdleTimer() : this.setIdleTimer();
}};
