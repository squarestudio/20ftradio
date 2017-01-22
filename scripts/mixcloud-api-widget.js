!function () {
    var e = window.Mixcloud, n = {
        noConflict: function () {
            return window.Mixcloud = e, n
        }
    };
    window.Mixcloud = n
}(), window.Mixcloud.Callbacks = function () {
    var e = [];
    return {
        apply: function (n, t) {
            for (var o = 0; o < e.length; o++)e[o].apply(n, t)
        }, external: {
            on: function (n) {
                e.push(n)
            }, off: function (n) {
                for (var t = 0; t < e.length; t++)if (e[t] === n) {
                    e.splice(t, 1);
                    break
                }
            }
        }
    }
}, function () {
    function e(e, n) {
        return (typeof e)[0] === n
    }

    var n = 1, t = 2;
    window.Mixcloud.Deferred = function () {
        function o(e) {
            i(n, e)
        }

        function r(e) {
            i(t, e)
        }

        function i(t, i) {
            if (!l) {
                if (s.resolve = s.reject = function () {
                    }, t === n) {
                    if (i === s.promise)return void r(new TypeError);
                    if (i instanceof u)return void i.then(o, r);
                    if (e(i, "f") || e(i, "o")) {
                        var a;
                        try {
                            a = i.then
                        } catch (d) {
                            return void r(d)
                        }
                        if (e(a, "f")) {
                            try {
                                a.call(i, o, r)
                            } catch (d) {
                                l || r(d)
                            }
                            return
                        }
                    }
                }
                f = i, l = t, c()
            }
        }

        function c() {
            setTimeout(function () {
                for (var e = 0; e < d.length; e++)d[e][l - 1].call(void 0, f);
                d = []
            }, 0)
        }

        function a(n, t) {
            function o(e) {
                return function (n) {
                    try {
                        r.resolve(e.call(this, n))
                    } catch (t) {
                        r.reject(t)
                    }
                }
            }

            var r = window.Mixcloud.Deferred();
            return d.push([e(n, "f") ? o(n) : function (e) {
                r.resolve(e)
            }, e(t, "f") ? o(t) : function (e) {
                r.reject(e)
            }]), l && c(), r.promise
        }

        function u() {
            this.then = a
        }

        var f, d = [], l = 0, s = {resolve: o, reject: r, promise: new u};
        return s
    }
}(), function (e) {
    function n(n) {
        if (n.origin === o || n.origin === e.location.origin) {
            var t;
            try {
                t = JSON.parse(n.data)
            } catch (r) {
                return
            }
            if ("playerWidget" === t.mixcloud)for (var c = 0; c < i.length; c++)i[c].window === n.source && i[c].callback(t.type, t.data)
        }
    }

    function t(e, n) {
        e.postMessage(JSON.stringify(n), o)
    }

    var o = "https://www.mixcloud.com", r = 0, i = [];
    e.Mixcloud.PlayerWidget = function (n) {
        function o(e, n) {
            "ready" === e ? t(u, {type: "getApi"}) : "api" === e ? c(n) : "event" === e ? d[n.eventName].apply(s, n.args) : "methodResponse" === e && l[n.methodId] && (l[n.methodId].resolve(n.value), delete l[n.methodId])
        }

        function c(n) {
            var t;
            for (t = 0; t < n.methods.length; t++)s[n.methods[t]] = a(n.methods[t]);
            for (t = 0; t < n.events.length; t++)d[n.events[t]] = e.Mixcloud.Callbacks(), s.events[n.events[t]] = d[n.events[t]].external;
            f.resolve(s)
        }

        function a(n) {
            return function () {
                return r++, l[r] = e.Mixcloud.Deferred(), t(u, {
                    type: "method",
                    data: {methodId: r, methodName: n, args: Array.prototype.slice.call(arguments)}
                }), l[r].promise
            }
        }

        var u = n.contentWindow, f = e.Mixcloud.Deferred(), d = {}, l = {}, s = {ready: f.promise, events: {}};
        return i.push({window: u, callback: o}), t(u, {type: "getApi"}), s
    }, e.addEventListener ? e.addEventListener("message", n, !1) : e.attachEvent("onmessage", n)
}(window);