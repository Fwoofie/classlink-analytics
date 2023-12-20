var ANALYTICS_API_URL = "https://analytics-log-beta.classlink.io", ANALYTICS_API_PROD_URL = "https://analytics-log.classlink.io";
function CLAnalyticsAPI() {}
CLAnalyticsAPI.prototype = {sendRequest: function (a, c) {
  var b = new XMLHttpRequest;
  a = utils.apiRequestAdjustments(a);
  b.open(a.method, (a.env === LPEnvironment.BETA ? ANALYTICS_API_URL : ANALYTICS_API_PROD_URL) + a.endpoint, true);
  b.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  b.setRequestHeader("Access-Control-Allow-Origin", "*");
  a.token && b.setRequestHeader("Authorization", "gws " + a.token);
  b.onreadystatechange = function () {
    if (4 === b.readyState && c) {
      var a = b.response;
      try {
        a = JSON.parse(a);
      } catch (e) {}
      c({success: 200 === b.status, status: b.status, statusText: b.statusText, data: a});
    }
  };
  a.method && a.body ? b.send(JSON.stringify(a.body)) : b.send();
}, openAppSession: function (a, c, b) {
  this.sendRequest({method: "POST", endpoint: "/launch/v1p1/lp/launch", env: a.env, token: a.gwsToken, params: {applicationId: a.appId}}, function (a) {
    1 < LOG_LEVEL && console.log("CLAnalyticsAPI.openAppSession(): response:", a);
    a.success && c ? c(a.data) : b(a);
  });
}, logAppSessionActivity: function (a, c, b) {
  this.sendRequest({method: "POST", endpoint: "/launch/v1p1/lp/activity", env: a.env, token: a.gwsToken, body: {sessions: a.sessions}}, function (a) {
    1 < LOG_LEVEL && console.log("CLAnalyticsAPI.logAppSessionActivity(): response:", a);
    a.success && c ? c(a.data) : b(a);
  });
}, closeAppSession: function (a, c, b) {
  this.sendRequest({method: "POST", endpoint: "/launch/v1p1/lp/close", env: a.env, token: a.gwsToken, params: {sessionId: a.sessionId, activeS: a.activeS}}, function (a) {
    1 < LOG_LEVEL && console.log("CLAnalyticsAPI.closeAppSession(): response:", a);
    a.success && c ? c(a.data) : b(a);
  });
}, openDomainSession: function (a, c, b) {
  var d = {domain: a.domain};
  if (a.N_USR_id || 0 === a.N_USR_id) d.N_USR_id = a.N_USR_id;
  a.favicon && (d.favicon = a.favicon);
  this.sendRequest({method: "POST", endpoint: "/launch/v1p1/url/launch", token: a.gwsToken, body: d, env: a.env}, function (a) {
    1 < LOG_LEVEL && console.log("CLAnalyticsAPI.openDomainSession(): response:", a);
    a.success && c ? c(a.data) : b(a);
  });
}, logDomainSessionActivity: function (a, c, b) {
  this.sendRequest({method: "POST", endpoint: "/launch/v1p1/url/activity", env: a.env, token: a.gwsToken, body: {N_USR_id: a.N_USR_id, sessions: a.sessions}}, function (a) {
    1 < LOG_LEVEL && console.log("CLAnalyticsAPI.logDomainSessionActivity(): response:", a);
    a.success && c ? c(a.data) : b(a);
  });
}, closeDomainSession: function (a, c, b) {
  this.sendRequest({method: "POST", endpoint: "/launch/v1p1/url/close", token: a.gwsToken, env: a.env, params: {sessionId: a.sessionId, activeS: a.activeS}}, function (a) {
    1 < LOG_LEVEL && console.log("CLAnalyticsAPI.closeDomainSession(): response:", a);
    a.success && c ? c(a.data) : b(a);
  });
}, openAnonDomainSession: function (a, c, b) {
  var d = {domain: a.domain, IPAddress: a.ip};
  a.favicon && (d.favicon = a.favicon);
  this.sendRequest({method: "POST", endpoint: "/anonLaunch/v1p0/launch", env: a.env, params: {token: a.userToken}, body: d}, function (a) {
    1 < LOG_LEVEL && console.log("CLAnalyticsAPI.openAnonDomainSession(): response:", a);
    a.success && c ? c(a.data) : b(a);
  });
}, closeAnonDomainSession: function (a, c, b) {
  this.sendRequest({method: "POST", endpoint: "/anonLaunch/v1p0/close", env: a.env, params: {token: a.userToken, sessionId: a.sessionId, activeS: a.activeS}}, function (a) {
    1 < LOG_LEVEL && console.log("CLAnalyticsAPI.closeAnonDomainSession(): response:", a);
    a.success && c ? c(a.data) : b(a);
  });
}};
