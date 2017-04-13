Y.use(['node'], function (a) {
    var c = function (a, c, d) {
            "undefined" === typeof d && (d = 10);
            for (c += ""; parseInt(a, 10) < d && 1 < d; d /= 10) a = c + a;
            return a.toString()
        },
        d = {
            formats: {
                a: function (a, c) {
                    return c.a[a.getDay()]
                },
                A: function (a, c) {
                    return c.A[a.getDay()]
                },
                b: function (a, c) {
                    return c.b[a.getMonth()]
                },
                B: function (a, c) {
                    return c.B[a.getMonth()]
                },
                C: function (a) {
                    return c(parseInt(a.getFullYear() / 100, 10), 0)
                },
                d: ["getDate", "0"],
                e: ["getDate", " "],
                g: function (a) {
                    return c(parseInt(d.formats.G(a) % 100, 10), 0)
                },
                G: function (a) {
                    var c = a.getFullYear(),
                        e = parseInt(d.formats.V(a), 10);
                    a = parseInt(d.formats.W(a), 10);
                    a > e ? c++ : 0 === a && 52 <= e && c--;
                    return c
                },
                H: ["getHours", "0"],
                I: function (a) {
                    a = a.getHours() % 12;
                    return c(0 === a ? 12 : a, 0)
                },
                j: function (a) {
                    var d = new Date("" + a.getFullYear() + "/1/1 GMT");
                    a = new Date("" + a.getFullYear() + "/" + (a.getMonth() + 1) + "/" + a.getDate() + " GMT") - d;
                    a =
                        parseInt(a / 6E4 / 60 / 24, 10) + 1;
                    return c(a, 0, 100)
                },
                k: ["getHours", " "],
                l: function (a) {
                    a = a.getHours() % 12;
                    return c(0 === a ? 12 : a, " ")
                },
                m: function (a) {
                    return c(a.getMonth() + 1, 0)
                },
                M: ["getMinutes", "0"],
                p: function (a, c) {
                    return c.p[12 <= a.getHours() ? 1 : 0]
                },
                P: function (a, c) {
                    return c.P[12 <= a.getHours() ? 1 : 0]
                },
                s: function (a, c) {
                    return parseInt(a.getTime() / 1E3, 10)
                },
                S: ["getSeconds", "0"],
                u: function (a) {
                    a = a.getDay();
                    return 0 === a ? 7 : a
                },
                U: function (a) {
                    var g = parseInt(d.formats.j(a), 10);
                    a = 6 - a.getDay();
                    g = parseInt((g + a) / 7, 10);
                    return c(g,
                        0)
                },
                V: function (a) {
                    var g = parseInt(d.formats.W(a), 10),
                        e = (new Date("" + a.getFullYear() + "/1/1")).getDay(),
                        g = g + (4 < e || 1 >= e ? 0 : 1);
                    53 === g && 4 > (new Date("" + a.getFullYear() + "/12/31")).getDay() ? g = 1 : 0 === g && (g = d.formats.V(new Date("" + (a.getFullYear() - 1) + "/12/31")));
                    return c(g, 0)
                },
                w: "getDay",
                W: function (a) {
                    var g = parseInt(d.formats.j(a), 10);
                    a = 7 - d.formats.u(a);
                    g = parseInt((g + a) / 7, 10);
                    return c(g, 0, 10)
                },
                y: function (a) {
                    return c(a.getFullYear() % 100, 0)
                },
                Y: "getFullYear",
                z: function (a) {
                    a = a.getTimezoneOffset();
                    var d = c(parseInt(Math.abs(a /
                            60), 10), 0),
                        e = c(Math.abs(a % 60), 0);
                    return (0 < a ? "-" : "+") + d + e
                },
                Z: function (a) {
                    var c = a.toString().replace(/^.*:\d\d( GMT[+-]\d+)? \(?([A-Za-z ]+)\)?\d*$/, "$2").replace(/[a-z ]/g, "");
                    4 < c.length && (c = d.formats.z(a));
                    return c
                },
                "%": function (a) {
                    return "%"
                }
            },
            aggregates: {
                c: "locale",
                D: "%m/%d/%y",
                F: "%Y-%m-%d",
                h: "%b",
                n: "\n",
                r: "%I:%M:%S %p",
                R: "%H:%M",
                t: "\t",
                T: "%H:%M:%S",
                x: "locale",
                X: "locale"
            },
            format: function (b, g) {
                g = g || {};
                if (!a.Lang.isDate(b)) return a.Lang.isValue(b) ? b : "";
                var e, l;
                e = g.format || "%Y-%m-%d";
                l = a.Intl.get("datatype-date-format");
                for (var k = function (a, b) {
                    var c = d.aggregates[b];
                    console.log(c)
                    return "locale" === c ? l[b] : c
                }, f = function (k, g) {
                    var e = d.formats[g];
                    switch (a.Lang.type(e)) {
                        case "string":
                            return b[e]();
                        case "function":
                            return e.call(b, b, l);
                        case "array":
                            if ("string" === a.Lang.type(e[0])) return c(b[e[0]](), e[1]);
                        default:
                            return g
                    }
                }; e.match(/%[cDFhnrRtTxX]/);) e = e.replace(/%([cDFhnrRtTxX])/g, k);
                e = e.replace(/%([aAbBCdegGHIjklmMpPsSuUVwWyYzZ%])/g, f);
                k = f = void 0;
                return e
            }
        };
    a.mix(a.namespace("Date"), d);
    a.namespace("DataType");
    a.DataType.Date = a.Date
})
YUI.add("lang/datatype-date-format_en", function(a) {
    a.Intl.add("datatype-date-format", "en", {
        a: "Sun Mon Tue Wed Thu Fri Sat".split(" "),
        A: "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
        b: "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),
        B: "January February March April May June July August September October November December".split(" "),
        c: "%a, %b %d, %Y %l:%M:%S %p %Z",
        p: ["AM", "PM"],
        P: ["am", "pm"],
        x: "%m/%d/%y",
        X: "%l:%M:%S %p"
    })
}, "3.17.2")
YUI.add("datatype-date-format", function (a, e) {

}, "3.17.2", {lang: "ar ar-JO ca ca-ES da da-DK de de-AT de-DE el el-GR en en-AU en-CA en-GB en-IE en-IN en-JO en-MY en-NZ en-PH en-SG en-US es es-AR es-BO es-CL es-CO es-EC es-ES es-MX es-PE es-PY es-US es-UY es-VE fi fi-FI fr fr-BE fr-CA fr-FR hi hi-IN hu id id-ID it it-IT ja ja-JP ko ko-KR ms ms-MY nb nb-NO nl nl-BE nl-NL pl pl-PL pt pt-BR ro ro-RO ru ru-RU sv sv-SE th th-TH tr tr-TR vi vi-VN zh-Hans zh-Hans-CN zh-Hant zh-Hant-HK zh-Hant-TW".split(" ")})
YUI.add("squarespace-date-utils", function(a) {
    function f(d) {
        d = a.Intl.get("datatype-date-format")[d];
        return { monday: d[1], tuesday: d[2], wednesday: d[3], thursday: d[4], friday: d[5], saturday: d[6], sunday: d[0] }
    }
    var d = a.namespace("Squarespace").DateUtils = {
        LANG: { days: { full: f.call(null, "A"), abbreviated: f.call(null, "a") } },
        humanizeAllDates: function(d) {
            a.all(d).each(function(d) {
                var c =
                    parseInt(d.getAttribute("data-date"), 10);
                a.Lang.isNumber(c) ? d.set("innerHTML", a.Squarespace.DateUtils.humanizeDate(c)) : console.warn("Invalid date on node: ", d)
            })
        },
        humanizeDate: function(d, c) {
            a.Lang.isDate(d) && (d = d.getTime());
            a.Lang.isString(d) && (d = parseInt(d, 10));
            var f = Date.now() - d,
                m = Math.floor(f / 31536E6),
                p = Math.floor(f / 2592E6),
                q = Math.floor(f / 6048E5),
                r = Math.floor(f / 864E5),
                s = Math.floor(f / 36E5),
                u = Math.floor(f / 6E4),
                f = Math.floor(f / 1E3),
                g = function(a, b) {
                    var d = "";
                    return d = (1 == a ? d + (("hour" === b ? "An " : "A ") +
                        b) : d + (a + " " + b + "s")) + " ago"
                };
            return 0 < m ? g(m, "year") : 0 < p ? g(p, "month") : 0 < q ? g(q, "week") : 0 < r ? g(r, "day") : 0 < s ? g(s, "hour") : 0 < u ? g(u, "minute") : c ? g(f, "second") : e("Just now")
        },
        humanizeDuration: function(a) {
            var b = Math.round(a / 1E3);
            a = Math.floor(b / 60);
            b -= 60 * a;
            return a + ":" + ((10 > b ? "0" : "") + b)
        },
        getContextualDate: function(d) {
            var c = a.Squarespace.DateUtils.dateFormat,
                f = new Date,
                m = c(new Date(d)),
                f = c(f),
                p = Date.now(),
                q = this.getOptimizedTime(d);
            return d > p + 6048E5 ? c(d, { format: "%b %e, %Y" }) : d > p + 864E5 ? c(d, { format: "%A" }) + " " + q :
                f === m ? e("Today ") + q : d > p ? e("Tomorrow ") + q : 864E5 > Date.now() - d ? e("Yesterday ") + q : 6048E5 > Date.now() - d ? c(d, { format: "%A" }) + " " + q : 31536E6 > Date.now() - d ? c(d, { format: "%b %e" }) : c(d, { format: "%b %e, %Y" })
        },
        getOptimizedTime: function(d) {
            var c = a.Squarespace.DateUtils.dateFormat;
            return "00" === c(d, { format: "%M" }) ? c(d, { format: "%l%P" }) : c(d, { format: "%l:%M%P" })
        },
        dateFormat: function(h, f) {
            f = f || {};
            f.format = f.format || "%B %e, %Y";
            if (h)
                if (!a.Lang.isDate(h) && (a.Lang.isNumber(h) || a.Lang.isString(h))) h = new Date(h);
                else {
                    if (isNaN(h.getTime())) return e("Invalid Date")
                }
            else h =
                new Date;
            if (!a.Lang.isValue(a.Object.getValue(Static, ["SQUARESPACE_CONTEXT", "tzData"]))) return a.DataType.Date.format(h, f);
            var n = c(h),
                m = new Date(h.getTime()),
                p = m.getTimezoneOffset() + n.utcOffset;
            m.setMinutes(m.getMinutes() + p);
            a.Lang.isString(a.Object.getValue(f, ["format"])) && (n.abbreviation && (f.format = f.format.replace(/%Z/g, n.abbreviation.replace("%s", ""))), f.format = d.fixYUIFormatForMissingDate(h, f.format, n));
            return a.DataType.Date.format(m, f)
        },
        fixYUIFormatForMissingDate: function(a, b, d) {
            var c = new Date(a);
            c.setMinutes(c.getMinutes() + (d.utcOffset + c.getTimezoneOffset()));
            var f = new Date(a.getTime() + 6E4 * d.utcOffset);
            if (c.getHours() == f.getUTCHours()) return b;
            var e = {
                e: function() {
                    return f.getUTCDate()
                },
                l: function() {
                    var a = f.getUTCHours() % 12;
                    return 0 === a ? 12 : a
                },
                k: function() {
                    return f.getUTCHours()
                },
                H: function() {
                    var a = e.k();
                    return 10 > a ? "0" + a : a
                },
                I: function() {
                    var a = e.l();
                    return 10 > a ? "0" + a : a
                },
                p: function() {
                    return 12 > f.getUTCHours() ? "AM" : "PM"
                },
                P: function() {
                    return e.p().toLowerCase()
                },
                r: function() {
                    return "%I:%M:%S %p"
                },
                T: function() {
                    return "%H:%M:%S"
                },
                Z: function() {
                    return d.abbreviation
                }
            };
            for (a = function(a) {
                a = a.substr(1, 1);
                return e[a].call(this).toString()
            }; b.match(/%[elkHIpPrTZ]/);) b = b.replace(/%[elkHIpPrTZ]/g, a);
            return b
        },
        getTimeOffsetToWebsiteTimezone: a.cached(function(d) {
            if (a.Lang.isDate(d)) d = d.getTime();
            else if (!a.Lang.isNumber(d)) throw Error("Invalid argument");
            var f = -(new Date(d)).getTimezoneOffset();
            return c(d).utcOffset - f
        }),
        createWebsiteDate: function() {
            var a = new Date(Date.UTC.apply(this, arguments)),
                b = c(a.getTime()),
                b = b.standardUTCOffset,
                b = c(a.getTime() - 6E4 * b),
                b = b.utcOffset;
            a.setMinutes(a.getMinutes() - b);
            return a
        },
        shiftForWebsiteTimezoneDisplay: function(d) {
            if (!a.Lang.isValue(d)) return null;
            if (!a.Lang.isValue(a.Object.getValue(Static, ["SQUARESPACE_CONTEXT", "tzData"]))) return new Date(d);
            d = new Date(d);
            var c = a.Squarespace.DateUtils.getTimeOffsetToWebsiteTimezone(d);
            d.setMinutes(d.getMinutes() + c);
            return d
        },
        calculateFullDayOffset: function(c, f) {
            if (!a.Lang.isValue(c) || !a.Lang.isValue(f)) return null;
            var e = function(a) {
                    a =
                        d.shiftForWebsiteTimezoneDisplay(a);
                    a.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
                    return Math.floor(a.getTime() / 864E5)
                },
                m = e(c);
            return e(f) - m
        },
        getEnglishDateWithOrdinal: function(a) {
            a = this.shiftForWebsiteTimezoneDisplay(a);
            a = a.getDate();
            var b;
            if (10 < a && 20 > a) return a + "th";
            switch (a % 10) {
                case 1:
                    b = "st";
                    break;
                case 2:
                    b = "nd";
                    break;
                case 3:
                    b = "rd";
                    break;
                default:
                    b = "th"
            }
            return a + b
        },
        calculateDateDiff: function(a, b) {
            if (b < a) return this.calculateDateDiff(b, a);
            var d = b.getFullYear() - a.getFullYear();
            b.getMonth() < a.getMonth() &&
            d--;
            var c = (b.getMonth() - a.getMonth() + 12) % 12;
            if (b.getDate() < a.getDate()) {
                c--;
                var f = (new Date(a.getYear(), a.getMonth() + 1, 0)).getDate() - a.getDate() + b.getDate()
            } else f = b.getDate() - a.getDate();
            var e = Math.floor(f / 7);
            return { year: d, month: c, week: e, day: f - 7 * e }
        }
    }
}, "1.0", { requires: ["intl", "lang/datatype-date-format_en", "squarespace-beforeunload"] });
YUI.add("squarespace-json-template", function (a) {
    function f(a) {
        return a.replace(/([\{\}\(\)\[\]\|\^\$\-\+\?])/g,
            "\\$1")
    }

    function b(a, b) {
        var c = t[a + b];
        void 0 === c && (c = "(" + f(a) + "\\S.*?" + f(b) + "\n?)", c = RegExp(c, "g"));
        return c
    }

    function e(a, b) {
        var c = [{context: a, index: -1}];
        return {
            PushSection: function (a) {
                if (void 0 === a || null === a) return null;
                a = "@" == a ? c[c.length - 1].context : c[c.length - 1].context[a] || null;
                c.push({context: a, index: -1});
                return a
            },
            Pop: function () {
                c.pop()
            },
            next: function () {
                var a = c[c.length - 1];
                -1 == a.index && (a = {context: null, index: 0}, c.push(a));
                var b = c[c.length - 2].context;
                if (a.index == b.length) c.pop();
                else return a.context =
                    b[a.index++], !0
            },
            _Undefined: function (a) {
                return void 0 === b ? null : b
            },
            _LookUpStack: function (a) {
                for (var b = c.length - 1; ;) {
                    var e = c[b];
                    if ("@index" == a) {
                        if (-1 != e.index) return e.index
                    } else if (e = e.context, "object" === typeof e && (e = e[a], void 0 !== e)) return e;
                    b--;
                    if (-1 >= b) return this._Undefined(a)
                }
            },
            get: function (a) {
                if ("@" == a) return c[c.length - 1].context;
                var b = a.split("."),
                    e = this._LookUpStack(b[0]);
                if (1 < b.length)
                    for (var f = 1; f < b.length; f++) {
                        if (null === e) return "[JSONT: Can't resolve '" + a + "'.]";
                        e = e[b[f]];
                        if (void 0 === e) return this._Undefined(b[f])
                    }
                return e
            }
        }
    }

    function c(a, b, c) {
        for (var e = 0; e < a.length; e++) {
            var f = a[e];
            if ("string" == typeof f) c(f);
            else(0, f[0])(f[1], b, c)
        }
    }

    function k(a, b, c) {
        var e;
        e = b.get(a.name);
        for (var f = 0; f < a.formatters.length; f++) {
            var k = a.formatters[f];
            e = (0, k[0])(e, b, k[1])
        }
        c(e)
    }

    function l(a, b, e) {
        var f = b.PushSection(a.section_name),
            k = !1;
        f && (k = !0);
        f && 0 === f.length && (k = !1);
        k ? (c(a.Statements(), b, e), b.Pop()) : (b.Pop(), c(a.Statements("or"), b, e))
    }

    function g(a, b, e) {
        for (var f = b.get("@"), k = 0; k < a.clauses.length; k++) {
            var l = a.clauses[k],
                p = l[1];
            if ((0, l[0][0])(f,
                    b, l[0][1])) {
                c(p, b, e);
                break
            }
        }
    }

    function q(a, b, e) {
        var f = b.PushSection(a.section_name);
        if (f && 0 < f.length) {
            var f = f.length - 1,
                k = a.Statements();
            a = a.Statements("alternate");
            for (var l = 0; void 0 !== b.next(); l++) c(k, b, e), l != f && c(a, b, e)
        } else c(a.Statements("or"), b, e);
        b.Pop()
    }

    function r(c, e) {
        function f(b) {
            if (b.startsWith(h)) {
                var c = e.partials[b.substr(h.length)];
                if (c) return [function (b, e, f) {
                    return a.JSONTemplate.evaluateJsonTemplate(c, b)
                }, null];
                throw {
                    name: "BadPartialInclude",
                    message: b.substr(h) + " is not a valid partial. Remember, loops are not supported (a partial include cannot be included inside itself)."
                };
            }
            var k = t.lookup(b);
            if (!k[0]) throw {name: "BadFormatter", message: b + " is not a valid formatter"};
            return k
        }

        function r(a) {
            var b = y.lookup(a);
            if (!b[0]) throw {name: "BadPredicate", message: a + " is not a valid predicate"};
            return b
        }

        var t = new w([u(a.JSONTemplate.DEFAULT_FORMATTERS), v(a.JSONTemplate.DEFAULT_PREFIX_FORMATTERS)]),
            y = w([u(a.JSONTemplate.DEFAULT_PREDICATES), v(a.JSONTemplate.DEFAULT_PARAMETRIC_PREDICATES)]),
            I = e.format_char || "|";
        if (":" != I && "|" != I) throw {
            name: "ConfigurationError",
            message: "Only format characters : and | are accepted"
        };
        var O = e.meta || "{}",
            Q = O.length;
        if (1 == Q % 2) throw {name: "ConfigurationError", message: O + " has an odd number of metacharacters"};
        for (var $ = O.substring(0, Q / 2), O = O.substring(Q / 2, Q), Q = b($, O), T = x({}), R = [T], M = $.length, U, P, S = 0; ;) {
            U = Q.exec(c);
            if (null === U) break;
            else P = U[0];
            U.index > S && (S = c.slice(S, U.index), T.Append(S));
            S = Q.lastIndex;
            U = !1;
            "\n" == P.slice(-1) && (P = P.slice(null, -1), U = !0);
            P = P.slice(M, -M);
            if ("#" != P.charAt(0)) {
                if ("." == P.charAt(0)) {
                    P = P.substring(1, P.length);
                    var N = {
                        "meta-left": $,
                        "meta-right": O,
                        space: " ",
                        tab: "\t",
                        newline: "\n"
                    }[P];
                    if (void 0 !== N) {
                        T.Append(N);
                        continue
                    }
                    if (N = P.match(B)) {
                        P = N[3];
                        N[1] ? (U = q, P = A({section_name: P})) : (U = l, P = x({section_name: P}));
                        T.Append([U, P]);
                        R.push(P);
                        T = P;
                        continue
                    }
                    var V;
                    if (N = P.match(C)) {
                        U = (V = N[1]) ? r(V) : null;
                        T.NewOrClause(U);
                        continue
                    }
                    var N = !1,
                        X = P.match(D);
                    if (X) {
                        if (V = X[1], N = !0, -1 == V.indexOf("?")) {
                            U = [function (a) {
                                return function (b, c) {
                                    var e, f, k;
                                    if (-1 !== a.indexOf(" || ")) {
                                        e = a.split("||");
                                        for (k = 0; k < e.length; k++)
                                            if (f = e[k].trim(), c.get(f)) return !0;
                                        return !1
                                    }
                                    if (-1 !== a.indexOf(" && ")) {
                                        e = a.split(" && ");
                                        for (k = 0; k < e.length; k++)
                                            if (f = e[k].trim(), !c.get(f)) return !1;
                                        return !0
                                    }
                                    return c.get(a)
                                }
                            }(V), null];
                            P = z();
                            P.NewOrClause(U);
                            T.Append([g, P]);
                            R.push(P);
                            T = P;
                            continue
                        }
                    } else if ("?" == P.charAt(P.length - 1) || "?" == P.split(" ")[0].charAt(P.split(" ")[0].length - 1)) V = P, N = !0;
                    if (N) {
                        U = V ? r(V) : null;
                        P = z();
                        P.NewOrClause(U);
                        T.Append([g, P]);
                        R.push(P);
                        T = P;
                        continue
                    }
                    if ("alternates with" == P) {
                        T.AlternatesWith();
                        continue
                    }
                    if ("end" == P) {
                        R.pop();
                        if (0 < R.length) T = R[R.length - 1];
                        else throw {name: "TemplateSyntaxError", message: "Got too many {end} statements"};
                        continue
                    }
                }
                X = P.split(I);
                if (1 == X.length) N = [f("str")];
                else {
                    N = [];
                    for (P = 1; P < X.length; P++) N.push(f(X[P]));
                    P = X[0]
                }
                T.Append([k, {name: P, formatters: N}]);
                U && T.Append("\n")
            }
        }
        T.Append(c.slice(S));
        if (1 !== R.length) throw {name: "TemplateSyntaxError", message: "Got too few {end} statements."};
        return T
    }

    a.namespace("JSONTemplate");
    var h = "apply ",
        t = {};
    a.JSONTemplate.DEFAULT_FORMATTERS = a.Squarespace.TEMPLATE_FORMATTERS;
    a.JSONTemplate.DEFAULT_PREFIX_FORMATTERS = [].concat(a.Squarespace.TEMPLATE_PREFIX_FORMATTERS, [{
        name: "pluralize",
        func: function (a, b, c) {
            switch (c.length) {
                case 0:
                    b = "";
                    c = "s";
                    break;
                case 1:
                    b = "";
                    c = c[0];
                    break;
                case 2:
                    b = c[0];
                    c = c[1];
                    break;
                default:
                    throw {name: "EvaluationError", message: "pluralize got too many args"};
            }
            return 1 == a ? b : c
        }
    }, {
        name: "encode-space", func: function (a, b, c) {
            return a.replace(/\s/g, "&nbsp;")
        }
    }, {
        name: "truncate", func: function (a, b, c) {
            b = c[0] || 100;
            c = c[1] || "...";
            a && a.length > b && (a = a.substring(0, b), a = a.replace(/\w+$/, ""), a += c);
            return a
        }
    }, {
        name: "date",
        func: function (b, c, e) {
            var f = 0,
                f = (new Date(b)).getTimezoneOffset();
            if (!a.Lang.isNumber(b)) return "Invalid date.";
            if ("undefined" !== typeof TimezoneJS) {
                var k;
                try {
                    k = new TimezoneJS.Date(b, c.get("website.timeZone"))
                } catch (l) {
                    return "Invalid Timezone"
                }
                f = (isNaN(k.getTimezoneOffset()) ? 0 : k.getTimezoneOffset()) - f
            } else c = -parseInt(Static.SQUARESPACE_CONTEXT.website.timeZoneOffset, 10) / 6E4, k = (new Date).getTimezoneOffset(), f = c - k;
            b = new Date(b - 6E4 * f);
            e = e.join(" ");
            return a.DataType.Date.format(b, {format: e})
        }
    }, {
        name: "image",
        func: function (b, c, e) {
            var f;
            b.mediaFocalPoint && (f = b.mediaFocalPoint.x + "," + b.mediaFocalPoint.y);
            return '<img class="' + (e[0] ? e[0] : "thumb-image") + '" ' + (b.title ? 'alt="' + a.Squarespace.Escaping.escapeForHtmlTag(b.title) + '" ' : "") + ' data-image="' + b.assetUrl + '" data-image-dimensions="' + b.originalSize + '" data-image-focal-point="' + f + '"/>'
        }
    }, {
        name: "timesince", func: function (b, c, e) {
            if (!a.Lang.isNumber(b)) return "Invalid date.";
            e.join(" ");
            return '<span class="timesince" data-date="' + b + '">' + a.Squarespace.DateUtils.humanizeDate(b) + "</span>"
        }
    }, {
        name: "resizedHeightForWidth",
        func: function (a, b, c) {
            b = a.split("x");
            if (2 != b.length) return "Invalid source parameter.  Pass in 'originalSize'.";
            a = parseInt(b[0], 10);
            b = parseInt(b[1], 10);
            c = parseInt(c[0], 10) / a;
            return parseInt(b * c, 10)
        }
    }, {
        name: "resizedWidthForHeight", func: function (a, b, c) {
            b = a.split("x");
            if (2 != b.length) return "Invalid source parameter.  Pass in 'originalSize'.";
            a = parseInt(b[0], 10);
            b = parseInt(b[1], 10);
            c = parseInt(c[0], 10) / b;
            return parseInt(a * c, 10)
        }
    }, {
        name: "squarespaceThumbnailForWidth",
        func: function (b, c, e) {
            return a.Squarespace.Rendering.getSquarespaceSizeForWidth(parseInt(e[0],
                10))
        }
    }, {
        name: "squarespaceThumbnailForHeight", func: function (b, c, e) {
            c = b.split("x");
            if (2 != c.length) return "Invalid source parameter.  Pass in 'originalSize'.";
            b = parseInt(c[0], 10);
            c = parseInt(c[1], 10);
            e = parseInt(e[0], 10) / c;
            e = parseInt(b * e, 10);
            return a.Squarespace.Rendering.getSquarespaceSizeForWidth(e)
        }
    }, {
        name: "cycle", func: function (a, b, c) {
            return c[(a - 1) % c.length]
        }
    }]);
    var u = function (a) {
            return {
                lookup: function (b) {
                    return [a[b] || null, null]
                }
            }
        },
        v = function (a) {
            return {
                lookup: function (b) {
                    for (var c = 0; c < a.length; c++) {
                        var e =
                                a[c].name,
                            f = a[c].func;
                        if (b.slice(0, e.length) == e) return c = b.charAt(e.length), b = "" === c ? [] : b.split(c).slice(1), [f, b]
                    }
                    return [null, null]
                }
            }
        },
        w = function (a) {
            return {
                lookup: function (b) {
                    for (var c = 0; c < a.length; c++) {
                        var e = a[c].lookup(b);
                        if (e[0]) return e
                    }
                    return [null, null]
                }
            }
        },
        y = function (a) {
            var b = {
                current_clause: [],
                Append: function (a) {
                    b.current_clause.push(a)
                },
                AlternatesWith: function () {
                    throw {
                        name: "TemplateSyntaxError",
                        message: "{.alternates with} can only appear with in {.repeated section ...}"
                    };
                },
                NewOrClause: function (a) {
                    throw {name: "NotImplemented"};
                }
            };
            return b
        },
        x = function (a) {
            var b = y(a);
            b.statements = {"default": b.current_clause};
            b.section_name = a.section_name;
            b.Statements = function (a) {
                return b.statements[a || "default"] || []
            };
            b.NewOrClause = function (a) {
                if (a) throw {
                    name: "TemplateSyntaxError",
                    message: "{.or} clause only takes a predicate inside predicate blocks"
                };
                b.current_clause = [];
                b.statements.or = b.current_clause
            };
            return b
        },
        A = function (a) {
            var b = x(a);
            b.AlternatesWith = function () {
                b.current_clause = [];
                b.statements.alternate = b.current_clause
            };
            return b
        },
        z = function (a) {
            var b =
                y(a);
            b.clauses = [];
            b.NewOrClause = function (a) {
                a = a || [function (a) {
                        return !0
                    }, null];
                b.current_clause = [];
                b.clauses.push([a, b.current_clause])
            };
            return b
        },
        B = /(repeated)?\s*(section)\s+(\S+)?/,
        C = /^or(?:[\s\-]+(.+))?/,
        D = /^if(?:[\s\-]+(.+))?/;
    a.JSONTemplate.Template = Class.create({
        initialize: function (a, b, c) {
            a = this.removeMultilineComments(a);
            this._options = b || {};
            this._program = r(a, this._options)
        },
        removeMultilineComments: function (a) {
            for (var b = a.search("{##"), c; 0 <= b;) c = a.substr(b), a = a.substr(0, b) + c.substr(c.search("##}") +
                    3), b = a.search("{##");
            return a
        },
        render: function (a, b) {
            var f = e(a, this._options.undefined_str);
            c(this._program.Statements(), f, b)
        },
        expand: function (a) {
            var b = [];
            this.render(a, function (a) {
                b.push(a)
            });
            return b.join("")
        }
    });
    a.JSONTemplate.DEFAULT_PREDICATES = a.Squarespace.TEMPLATE_PREDICATES;
    a.JSONTemplate.DEFAULT_PARAMETRIC_PREDICATES = a.Squarespace.TEMPLATE_PARAMETRIC_PREDICATES;
    a.JSONTemplate.evaluateJsonTemplate = function (b, c, e) {
        return "string" != typeof b ? "JSON Template Error: Processing failed because no input was provided. (type: " + typeof b + ", template: " + JSON.stringify(b) + ", dictionary: " + JSON.stringify(c) + ", partials: " + JSON.stringify(e) + ")" : (new a.JSONTemplate.Template(b, {partials: e})).expand(c)
    }
}, "1.0", {requires: "json squarespace-common squarespace-date-utils squarespace-escaping-utils squarespace-rendering squarespace-template-helpers squarespace-util".split(" ")})