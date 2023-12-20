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
var ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, ipv6Regex = /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/gm;
function IPChecker() {
  this.userIP = null;
  this.isUserIPValid = true;
  this.receivedIPRanges = this.ipRestrictionEnabled = false;
  this.validIPRanges = [];
  this.invalidIPRanges = [];
  this.ipErrorRefetchDelay = 1;
}
IPChecker.prototype = {updateIPAddress: function (a) {
  var b = new XMLHttpRequest, c = this;
  b.open("GET", "https://api.ipify.org", true);
  b.onreadystatechange = function () {
    4 == b.readyState && (200 === b.status ? (c.userIP = b.responseText, 0 < LOG_LEVEL && console.log("IP address retrieved:", c.userIP), a && a(c.userIP)) : chrome.alarms.clear("ipErrorRefetchAlarm", function (b) {
      chrome.alarms.create("ipErrorRefetchAlarm", {delayInMinutes: c.ipErrorRefetchDelay});
      c.ipErrorRefetchDelay++;
    }));
  };
  b.send();
}, getIPAddress: function () {
  return this.userIP || cfgSvc.MISSING_IP_PLACEHOLDER;
}, onEnableIPFetch: function (a) {
  var b = this;
  0 < cfgSvc.IP_REFETCH_INTERVAL && chrome.alarms.create("ipRefetchAlarm", {delayInMinutes: cfgSvc.IP_REFETCH_INTERVAL + 0.5, periodInMinutes: cfgSvc.IP_REFETCH_INTERVAL});
  this.updateIPAddress(function (c) {
    b.validIPRanges = b.convertIPRanges(cfgSvc.ALLOWED_IP_ADDRESSES);
    b.invalidIPRanges = b.convertIPRanges(cfgSvc.EXCLUDED_IP_ADDRESSES);
    b.checkAndUpdateIPValidity(b.userIP);
    a && a(c);
  });
}, onDisableIPFetch: function () {
  this.userIP = cfgSvc.MISSING_IP_PLACEHOLDER;
}, convertIPRanges: function (a) {
  var b = this;
  return a && 0 !== a.length ? a.map(function (a) {
    var c = a.split("-");
    a = b.convertIPAddrToNum(c[0]);
    c = 1 < c.length ? b.convertIPAddrToNum(c[1]) : a;
    return [a, c];
  }) : [];
}, determineIPAddrVersion: function (a) {
  return ipv4Regex.test(a) ? 4 : ipv6Regex.test(a) ? 6 : 0;
}, convertIPAddrToNum: function (a) {
  var b = this.determineIPAddrVersion(a);
  return 0 === b ? (0 < LOG_LEVEL && console.warn("CLUtils.convertIPAddrToNum(): invalid IP addr:", a), NaN) : 4 === b || 0 === b ? Number(a.split(".").map(function (a) {
    return ("000" + a).substr(-3);
  }).join("")) : NaN;
}, checkAndUpdateIPValidity: function (a) {
  a = void 0 === a ? this.userIP : a;
  var b = false;
  if (cfgSvc.ALLOW_IP_FETCH) {
    var c = this.convertIPAddrToNum(a);
    if (this.receivedIPRanges) {
      b = 0 === this.validIPRanges.length;
      for (var e = $jscomp.makeIterator(this.validIPRanges), d = e.next(); !d.done; d = e.next()) if (d = d.value, c >= d[0] && c <= d[1]) {
        b = true;
        break;
      }
      e = $jscomp.makeIterator(this.invalidIPRanges);
      for (d = e.next(); !d.done; d = e.next()) if (d = d.value, c >= d[0] && c <= d[1]) {
        b = false;
        break;
      }
    }
  } else b = true;
  0 < LOG_LEVEL && console.log("IP address " + a + " is " + (b ? "allowed for" : "excluded from") + " domain tracking.");
  this.isUserIPValid = b;
}};
