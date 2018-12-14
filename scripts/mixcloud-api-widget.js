! function() {
    var e = window.Mixcloud,
        t = {
            noConflict: function() {
                return window.Mixcloud = e, t
            }
        };
    window.Mixcloud = t
}(), window.Mixcloud.Callbacks = function() {
        var e = [];
        return {
            apply: function(t, n) {
                for (var o = 0; o < e.length; o++) e[o].apply(t, n)
            },
            external: {
                on: function(t) {
                    e.push(t)
                },
                off: function(t) {
                    for (var n = 0; n < e.length; n++)
                        if (e[n] === t) {
                            e.splice(n, 1);
                            break
                        }
                }
            }
        }
    },
    function() {
        function e(e, t) {
            return (typeof e)[0] === t
        }
        var t = 1;
        window.Mixcloud.Deferred = function() {
            function n(e) {
                r(t, e)
            }

            function o(e) {
                r(2, e)
            }

            function r(r, a) {
                if (!d) {
                    if (s.resolve = s.reject = function() {}, r === t) {
                        if (a === s.promise) return void o(new TypeError);
                        if (a instanceof l) return void a.then(n, o);
                        if (e(a, "f") || e(a, "o")) {
                            var c;
                            try {
                                c = a.then
                            } catch (e) {
                                return void o(e)
                            }
                            if (e(c, "f")) {
                                try {
                                    c.call(a, n, o)
                                } catch (e) {
                                    d || o(e)
                                }
                                return
                            }
                        }
                    }
                    u = a, d = r, i()
                }
            }

            function i() {
                setTimeout(function() {
                    for (var e = 0; e < c.length; e++) c[e][d - 1].call(void 0, u);
                    c = []
                }, 0)
            }

            function a(t, n) {
                function o(e) {
                    return function(t) {
                        try {
                            r.resolve(e.call(this, t))
                        } catch (e) {
                            r.reject(e)
                        }
                    }
                }
                var r = window.Mixcloud.Deferred();
                return c.push([e(t, "f") ? o(t) : function(e) {
                    r.resolve(e)
                }, e(n, "f") ? o(n) : function(e) {
                    r.reject(e)
                }]), d && i(), r.promise
            }

            function l() {
                this.then = a
            }
            var u, c = [],
                d = 0,
                s = {
                    resolve: n,
                    reject: o,
                    promise: new l
                };
            return s
        }
    }(),
    function(e) {
        function t(t) {
            if (t.origin === o || t.origin === e.location.origin) {
                var n;
                try {
                    n = JSON.parse(t.data)
                } catch (e) {
                    return
                }
                if ("playerWidget" === n.mixcloud)
                    for (var r = 0; r < i.length; r++) i[r].window === t.source && i[r].callback(n.type, n.data)
            }
        }

        function n(e, t) {
        	console.log(t)
            e.postMessage(JSON.stringify(t), o)
        }
        var o = "https://www.mixcloud.com",
            r = 0,
            i = [];
        e.Mixcloud.PlayerWidget = function(t) {
            function o(e, t) {
                "ready" === e ? n(u, {
                    type: "getApi"
                }) : "api" === e ? a(t) : "event" === e ? d[t.eventName].apply(f, t.args) : "methodResponse" === e && s[t.methodId] && (s[t.methodId].resolve(t.value), delete s[t.methodId])
            }

            function a(t) {
                var n;
                for (n = 0; n < t.methods.length; n++) f[t.methods[n]] = l(t.methods[n]);
                for (n = 0; n < t.events.length; n++) d[t.events[n]] = e.Mixcloud.Callbacks(), f.events[t.events[n]] = d[t.events[n]].external;
                c.resolve(f)
            }

            function l(t) {
                return function() {
                    return r++, s[r] = e.Mixcloud.Deferred(), n(u, {
                        type: "method",
                        data: {
                            methodId: r,
                            methodName: t,
                            args: Array.prototype.slice.call(arguments)
                        }
                    }), s[r].promise
                }
            }
            var u = t.contentWindow,
                c = e.Mixcloud.Deferred(),
                d = {},
                s = {},
                f = {
                    ready: c.promise,
                    events: {}
                };
            return i.push({
                window: u,
                callback: o
            }), n(u, {
                type: "getApi"
            }), f
        }, e.addEventListener ? e.addEventListener("message", t, !1) : e.attachEvent("onmessage", t)
    }(window),
    function(e, t, n) {
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
                    var i = r && r.match(N);
                    if (i) {
                        var a = r.replace(i[0], "");
                        if ("" === a || a === n.location.href) return
                    }
                    if (!M) return void(E && o.setAttribute("target", "_blank"));
                    if (f() !== f(o)) return void o.setAttribute("target", "_blank");
                    t.preventDefault(), e.navigate(o.pathname + o.search)
                }
            }
        }

        function a(e) {
            e.state && e.state.url && C.shouldPop(e.state) && c(e.state.url, !0, e.state.scrollPosition)
        }

        function l(e) {
            t.top.postMessage({
                MixcloudNavigation: !0,
                messageType: e,
                params: Array.prototype.slice.call(arguments, 1)
            }, f())
        }

        function u(e) {
            e.data && e.data.MixcloudNavigation && I[e.data.messageType].apply(null, e.data.params)
        }

        function c(e, t, n) {
            if (!T) return void k.then(function() {
                c(e, t, n)
            });
            P = null, t || C.updateScrollPosition(h()), S ? S.parentNode.removeChild(S) : d(), P = n, T.innerHTML = '<iframe width="100%" height="100%" frameborder="0"></iframe>', S = T.childNodes[0], p().location = f() + encodeURI(e), t || C.push(e)
        }

        function d() {
            var e = n.createElement("style");
            e.innerHTML = "html,body{padding:0 !important;margin:0 !important;overflow:hidden !important}", n.head.appendChild(e), T.setAttribute("style", "position: absolute; top: 0; left: 0; right: 0; bottom: 60px")
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
            return S && (S.contentDocument || S.contentWindow.document).defaultView
        }

        function h() {
            var e = p() || t,
                n = e.document;
            return e.pageYOffset || "CSS1Compat" === n.compatMode && n.documentElement.scrollTop || n.body.scrollTop || 0
        }

        function g() {
            for (var e = n.getElementsByTagName("form"), t = 0; t < e.length; t++) e[t].setAttribute("target", "_blank")
        }

        function m(e) {
            return !e.metaKey && !e.ctrlKey && (32 === (e.which || e.keyCode) && !e.target.tagName.match(L))
        }

        function v(e, t) {
            var n = x + "/widget/iframe/?feed=" + encodeURIComponent(e) + "&footer_widget=1";
            return t.stylecolor && (n += "&stylecolor=" + encodeURIComponent(t.stylecolor)), t.hide_artwork && (n += "&hide_artwork=1"), t.autoplay && (n += "&autoplay=1"), t.light && (n += "&light=1"), t.html5audio && (n += "&html5audio=1"), t.disableUnloadWarning && (n += "&disable_unload_warning=1"), n
        }

        function y(e) {
            W.events.play.on(w), W.events.pause.on(b), W.events.buffering.on(b), W.events.ended.on(b), W.events.error.on(b), e.disableHotkeys || (o(n, "keydown", function(e) {
                W && m(e) && W.togglePlay()
            }), W.enableHotkeys()), e.disableUnloadWarning || o(t, "beforeunload", function(e) {
                if (D) return e.returnValue = "Are you sure you want to stop listening and leave this page?", e.returnValue
            })
        }

        function w() {
            E = !0, D = !0
        }

        function b() {
            D = !1
        }
        var x = "https://www.mixcloud.com",
            A = "//widget.mixcloud.com/media/js/footerWidgetApi.js",
            M = function() {
                return -1 === t.navigator.appVersion.indexOf("MSIE 10") && !!(t.history && t.history.pushState && t.history.replaceState)
            }(),
            N = /#(.*)/,
            E = !1,
            k = function() {
                function i() {
                    r(n, "DOMContentLoaded", i), r(t, "load", i), a.resolve()
                }
                var a = e.Deferred();
                return "complete" === n.readyState ? a.resolve() : (o(n, "DOMContentLoaded", i), o(t, "load", i)), a.promise
            }(),
            C = function() {
                function e(e) {
                    return {
                        url: e,
                        id: o++
                    }
                }
                var n = null,
                    o = 1;
                return {
                    replace: function(o) {
                        n = e(o), t.history.replaceState(n, null, n.url)
                    },
                    push: function(o) {
                        n = e(o), t.history.pushState(n, null, n.url)
                    },
                    shouldPop: function(e) {
                        return n.id !== e.id
                    },
                    updateScrollPosition: function(e) {
                        n && (n.scrollPosition = e, t.history.replaceState(n, null, n.url))
                    }
                }
            }(),
            P = null,
            S = null,
            T = null,
            L = /^(INPUT|TEXTAREA|A)$/i,
            W = null,
            D = !1;
        if (o(n, "click", function(e) {
                for (var t = e.target; t && t.parentNode && (!t.hasAttribute || !t.hasAttribute("data-mixcloud-play-button"));) t = t.parentNode;
                t && t.hasAttribute && t.hasAttribute("data-mixcloud-play-button") && l("play", t.getAttribute("data-mixcloud-play-button"))
            }), function() {
                try {
                    if (t.top !== t.self) return !0
                } catch (e) {
                    return !0
                }
                return !1
            }()) o(n, "click", i), e.navigate = function(e) {
            l("navigate", e)
        }, l("load", s(), n.title, t.location.hash), e.FooterWidget = function() {
            return e.Deferred().promise
        }, o(n, "keydown", function(e) {
            m(e) && l("togglePlay")
        }), k.then(g);
        else {
            var I = {
                load: function(e, o, r) {
                	console.log(e,o,r)
                    C.replace(e), n.title = o, r && (t.location.hash = r), P && (p().scrollTo(0, P > 20 ? P : 0), P = null)
                },
                play: function(e) {
                    W && W.load(e, !0)
                },
                togglePlay: function() {
                    W && W.togglePlay()
                }
            };
            I.navigate = function(e) {
                c(e)
            };
            var _ = !1;
            e.FooterWidget = function(r, l) {
                    if (_) throw Error("Mixcloud Widget API: You can only create one footer widget");
                    _ = !0;
                    var c = e.Deferred();
                    return l.disablePushstate || (o(n, "click", i), M && (e.navigate = I.navigate, o(t, "message", u), o(t, "popstate", a), C.replace(s()))), k.then(function() {
                        if (M && !l.disablePushstate)
                            for (T = n.createElement("div"), T.setAttribute("class", "mixcloud-footer-widget-body-wrapper"), n.body.appendChild(T); n.body.childNodes.length > 1;) T.appendChild(n.body.childNodes[0]);
                        g();
                        var o = n.createElement("div");
                        o.setAttribute("style", "position: fixed; left: 0; bottom: 0; right: 0; height: 60px; z-index: 10"), o.setAttribute("class", "mixcloud-footer-widget-container"), n.body.appendChild(o);
                        var i = 0;
                        t.getComputedStyle && (i = parseFloat(t.getComputedStyle(n.body)["padding-bottom"].replace(/px$/, ""))), n.body.style.paddingBottom = i + 60 + "px", o.innerHTML = '<iframe width="100%" height="100%" frameborder="0" src="' + v(r, l) + '"></iframe>';
                        var a = e.PlayerWidget(o.childNodes[0]);
                        a.ready.then(function() {
                            W = a, y(l), c.resolve(a)
                        })
                    }), c.promise
                },
                function() {
                    for (var t, o = n.getElementsByTagName("script"), r = null, i = 0; i < o.length; i++)
                        if ((t = o[i].getAttribute("src")) && t.replace(/https?:/i, "") === A) {
                            r = o[i];
                            break
                        }
                    if (r) try {
                        var a = JSON.parse(r.innerHTML),
                            l = a.feed;
                        l && (delete a.feed, e.FooterWidget(l, a))
                    } catch (e) {}
                }()
        }
    }(window.Mixcloud, window, document);