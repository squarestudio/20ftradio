!function () {
    var e = window.Mixcloud, t = {
        noConflict: function () {
            return window.Mixcloud = e, t
        }
    };
    window.Mixcloud = t
}(), window.Mixcloud.Callbacks = function () {
    var e = [];
    return {
        apply: function (t, n) {
            for (var o = 0; o < e.length; o++) e[o].apply(t, n)
        }, external: {
            on: function (t) {
                e.push(t)
            }, off: function (t) {
                for (var n = 0; n < e.length; n++) if (e[n] === t) {
                    e.splice(n, 1);
                    break
                }
            }
        }
    }
}, function () {
    function e(e, t) {
        return (typeof e)[0] === t
    }

    var t = 1, n = 2;
    window.Mixcloud.Deferred = function () {
        function o(e) {
            i(t, e)
        }

        function r(e) {
            i(n, e)
        }

        function i(n, i) {
            if (!s) {
                if (f.resolve = f.reject = function () {
                    }, n === t) {
                    if (i === f.promise) return void r(new TypeError);
                    if (i instanceof u) return void i.then(o, r);
                    if (e(i, "f") || e(i, "o")) {
                        var l;
                        try {
                            l = i.then
                        } catch (c) {
                            return void r(c)
                        }
                        if (e(l, "f")) {
                            try {
                                l.call(i, o, r)
                            } catch (c) {
                                s || r(c)
                            }
                            return
                        }
                    }
                }
                d = i, s = n, a()
            }
        }

        function a() {
            setTimeout(function () {
                for (var e = 0; e < c.length; e++) c[e][s - 1].call(void 0, d);
                c = []
            }, 0)
        }

        function l(t, n) {
            function o(e) {
                return function (t) {
                    try {
                        r.resolve(e.call(this, t))
                    } catch (n) {
                        r.reject(n)
                    }
                }
            }

            var r = window.Mixcloud.Deferred();
            return c.push([e(t, "f") ? o(t) : function (e) {
                r.resolve(e)
            }, e(n, "f") ? o(n) : function (e) {
                r.reject(e)
            }]), s && a(), r.promise
        }

        function u() {
            this.then = l
        }

        var d, c = [], s = 0, f = {resolve: o, reject: r, promise: new u};
        return f
    }
}(), function (e) {
    function t(t) {
        if (t.origin === o || t.origin === e.location.origin) {
            var n;
            try {
                n = JSON.parse(t.data)
            } catch (r) {
                return
            }
            if ("playerWidget" === n.mixcloud) for (var a = 0; a < i.length; a++) i[a].window === t.source && i[a].callback(n.type, n.data)
        }
    }

    function n(e, t) {
        e.postMessage(JSON.stringify(t), o)
    }

    var o = "https://www.mixcloud.com", r = 0, i = [];
    e.Mixcloud.PlayerWidget = function (t) {
        function o(e, t) {
            "ready" === e ? n(u, {type: "getApi"}) : "api" === e ? a(t) : "event" === e ? c[t.eventName].apply(f, t.args) : "methodResponse" === e && s[t.methodId] && (s[t.methodId].resolve(t.value), delete s[t.methodId])
        }

        function a(t) {
            var n;
            for (n = 0; n < t.methods.length; n++) f[t.methods[n]] = l(t.methods[n]);
            for (n = 0; n < t.events.length; n++) c[t.events[n]] = e.Mixcloud.Callbacks(), f.events[t.events[n]] = c[t.events[n]].external;
            d.resolve(f)
        }

        function l(t) {
            return function () {
                return r++, s[r] = e.Mixcloud.Deferred(), n(u, {
                    type: "method",
                    data: {methodId: r, methodName: t, args: Array.prototype.slice.call(arguments)}
                }), s[r].promise
            }
        }

        var u = t.contentWindow, d = e.Mixcloud.Deferred(), c = {}, s = {}, f = {ready: d.promise, events: {}};
        return i.push({window: u, callback: o}), n(u, {type: "getApi"}), f
    }, e.addEventListener ? e.addEventListener("message", t, !1) : e.attachEvent("onmessage", t)
}(window), function (e, t, n) {
    function o(e, t, n) {
        e.addEventListener ? e.addEventListener(t, n, !1) : e.attachEvent("on" + t, n)
    }

    function r(e, t, n) {
        e.removeEventListener ? e.removeEventListener(t, n, !1) : e.detachEvent("on" + t, n)
    }

    function i(t) {
        if (!(t.defaultPrevented || t.which > 1 || t.metaKey || t.ctrlKey || t.shiftKey || t.altKey)) {
            for (var o = t.target; o && o.parentNode && "A" !== o.nodeName;) o = o.parentNode;
            var r = o.href;
            if ("A" === o.nodeName && 0 !== r.length && 0 === o.target.length) {
                var i = r && r.match(k);
                if (i) {
                    var a = r.replace(i[0], "");
                    if ("" === a || a === n.location.href) return
                }
                if (!E) return void(C && o.setAttribute("target", "_blank"));
                if (f() !== f(o)) return void o.setAttribute("target", "_blank");
                t.preventDefault(), e.navigate(o.pathname + o.search)
            }
        }
    }

    function a(e) {
        e.state && e.state.url && S.shouldPop(e.state) && d(e.state.url, !0, e.state.scrollPosition)
    }

    function l(e) {
        t.top.postMessage({
            MixcloudNavigation: !0,
            messageType: e,
            params: Array.prototype.slice.call(arguments, 1)
        }, f())
    }

    function u(e) {
        e.data && e.data.MixcloudNavigation && O[e.data.messageType].apply(null, e.data.params)
    }

    function d(e, t, n) {
        return W ? (T = null, t || S.updateScrollPosition(h()), L ? L.parentNode.removeChild(L) : c(), T = n, W.innerHTML = '<iframe width="100%" height="100%" frameborder="0"></iframe>', L = W.childNodes[0], p().location = f() + encodeURI(e), void(t || S.push(e))) : void P.then(function () {
            d(e, t, n)
        })
    }

    function c() {
        var e = n.createElement("style");
        e.innerHTML = "html,body{padding:0 !important;margin:0 !important;overflow:hidden !important}", n.head.appendChild(e), W.setAttribute("style", "position: absolute; top: 0; left: 0; right: 0; bottom: 60px")
    }

    function s() {
        return t.location.pathname + t.location.search
    }

    function f(e) {
        if (e = e || t.location, e.origin) return e.origin;
        var n = e.protocol + "//" + e.hostname;
        return !e.port || "http:" === e.protocol && "80" === e.port || "https:" === e.protocol && "443" === e.port ? n : n + ":" + e.port
    }

    function p() {
        return L && (L.contentDocument || L.contentWindow.document).defaultView
    }

    function h() {
        var e = p() || t, n = e.document;
        return e.pageYOffset || "CSS1Compat" === n.compatMode && n.documentElement.scrollTop || n.body.scrollTop || 0
    }

    function g() {
        try {
            if (t.top !== t.self) return !0
        } catch (e) {
            return !0
        }
        return !1
    }

    function m() {
        for (var e = n.getElementsByTagName("form"), t = 0; t < e.length; t++) e[t].setAttribute("target", "_blank")
    }

    function v(e) {
        if (e.metaKey || e.ctrlKey) return !1;
        var t = e.which || e.keyCode;
        return 32 !== t ? !1 : e.target.tagName.match(D) ? !1 : !0
    }

    function y(e, t) {
        var n = M + "/widget/iframe/?feed=" + encodeURIComponent(e) + "&hide_cover=1";
        return t.stylecolor && (n += "&stylecolor=" + encodeURIComponent(t.stylecolor)), t.hide_artwork && (n += "&hide_artwork=1"), t.autoplay && (n += "&autoplay=1"), t.light && (n += "&light=1"), t.html5audio && (n += "&html5audio=1"), t.disableUnloadWarning && (n += "&disable_unload_warning=1"), n
    }

    function w(e) {
        I.events.play.on(b), I.events.pause.on(x), I.events.buffering.on(x), I.events.ended.on(x), I.events.error.on(x), e.disableHotkeys || (o(n, "keydown", function (e) {
            I && v(e) && I.togglePlay()
        }), I.enableHotkeys()), e.disableUnloadWarning || o(t, "beforeunload", function (e) {
            return _ ? (e.returnValue = "Are you sure you want to stop listening and leave this page?", e.returnValue) : void 0
        })
    }

    function b() {
        C = !0, _ = !0
    }

    function x() {
        _ = !1
    }

    function A() {
        for (var t, o = n.getElementsByTagName("script"), r = null, i = 0; i < o.length; i++) if (t = o[i].getAttribute("src"), t && t.replace(/https?:/i, "") === N) {
            r = o[i];
            break
        }
        if (r) try {
            var a = JSON.parse(r.innerHTML), l = a.feed;
            l && (delete a.feed, e.FooterWidget(l, a))
        } catch (u) {
        }
    }

    var M = "https://www.mixcloud.com", N = "//widget.mixcloud.com/media/js/footerWidgetApi.js", E = function () {
        return -1 !== t.navigator.appVersion.indexOf("MSIE 10") ? !1 : !!(t.history && t.history.pushState && t.history.replaceState)
    }(), k = /#(.*)/, C = !1, P = function () {
        function i() {
            r(n, "DOMContentLoaded", i), r(t, "load", i), a.resolve()
        }

        var a = e.Deferred();
        return "complete" === n.readyState ? a.resolve() : (o(n, "DOMContentLoaded", i), o(t, "load", i)), a.promise
    }(), S = function () {
        function e(e) {
            return {url: e, id: o++}
        }

        var n = null, o = 1;
        return {
            replace: function (o) {
                n = e(o), t.history.replaceState(n, null, n.url)
            }, push: function (o) {
                n = e(o), t.history.pushState(n, null, n.url)
            }, shouldPop: function (e) {
                return n.id !== e.id
            }, updateScrollPosition: function (e) {
                n && (n.scrollPosition = e, t.history.replaceState(n, null, n.url))
            }
        }
    }(), T = null, L = null, W = null, D = /^(INPUT|TEXTAREA|A)$/i, I = null, _ = !1;
    if (o(n, "click", function (e) {
            for (var t = e.target; t && t.parentNode && (!t.hasAttribute || !t.hasAttribute("data-mixcloud-play-button"));) t = t.parentNode;
            t && t.hasAttribute && t.hasAttribute("data-mixcloud-play-button") && l("play", t.getAttribute("data-mixcloud-play-button"))
        }), g()) o(n, "click", i), e.navigate = function (e) {
        l("navigate", e)
    }, l("load", s(), n.title, t.location.hash), e.FooterWidget = function () {
        return e.Deferred().promise
    }, o(n, "keydown", function (e) {
        v(e) && l("togglePlay")
    }), P.then(m); else {
        var O = {
            load: function (e, o, r) {
                S.replace(e), n.title = o, r && (t.location.hash = r), T && (p().scrollTo(0, T > 20 ? T : 0), T = null)
            }, play: function (e) {
                I && I.load(e, !0)
            }, togglePlay: function () {
                I && I.togglePlay()
            }
        };
        O.navigate = function (e) {
            d(e)
        };
        var j = !1;
        e.FooterWidget = function (r, l) {
            if (j) throw Error("Mixcloud Widget API: You can only create one footer widget");
            j = !0;
            var d = e.Deferred();
            return l.disablePushstate || (o(n, "click", i), E && (e.navigate = O.navigate, o(t, "message", u), o(t, "popstate", a), S.replace(s()))), P.then(function () {
                if (E && !l.disablePushstate) for (W = n.createElement("div"), W.setAttribute("class", "mixcloud-footer-widget-body-wrapper"), n.body.appendChild(W); n.body.childNodes.length > 1;) W.appendChild(n.body.childNodes[0]);
                m();
                var o = n.createElement("div");
                o.setAttribute("style", "position: fixed; left: 0; bottom: 0; right: 0; height: 60px; z-index: 10"), o.setAttribute("class", "mixcloud-footer-widget-container"), n.body.appendChild(o);
                var i = 0;
                t.getComputedStyle && (i = parseFloat(t.getComputedStyle(n.body)["padding-bottom"].replace(/px$/, ""))), n.body.style.paddingBottom = i + 60 + "px", o.innerHTML = '<iframe width="100%" height="100%" frameborder="0" src="' + y(r, l) + '"></iframe>';
                var a = e.PlayerWidget(o.childNodes[0]);
                a.ready.then(function () {
                    I = a, w(l), d.resolve(a)
                })
            }), d.promise
        }, A()
    }
}(window.Mixcloud, window, document);