var mixCloudFooterPlayer = false;
var window_loaded = false;
var bindMixcloudPlay = false;
var mobileMenuListener = false;
window.mixCloudEmbeds = [];
var body = Y.one('body');
var html = Y.one('html');
var canvasEq = false;
var mixcloudFooter;
var loadedTracks = {
    current: false,
    all: []
};

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function addScript(script, callback) {
    var s;
    var parent = script.parent || document.head;
    if (script.id && !parent.querySelector('#' + script.id)) {
        s = document.createElement("script");
        s.id = script.id;
    } else {
        if (callback) {
            callback({});
        }
        return;
    }
    if (script.src) {
        if (s.readyState) {
            s.onreadystatechange = function() {
                if (s.readyState == "loaded" || s.readyState == "complete") {
                    s.onreadystatechange = null;
                    if (callback) {
                        callback(this);
                    }
                }
            };
        } else {
            s.onload = function() {
                if (callback) {
                    callback(this);
                }
            };
        }
        s.src = script.src;
    }
    if (script.code || script.innerText) {
        s.appendChild(document.createTextNode(script.innerText));
    }
    s.async = !!script.async;
    parent.appendChild(s);
}

function sendReplyEmail(name, email, data) {
    $.ajax({
        type: 'POST',
        url: 'https://app.20ftradio.net/mail-callback.php',
        data: {
            name: name,
            email: email,
            data: data
        },
        dataType: 'json'
    }).done(function(data) {
        console.log(data);
    }).fail(function(data) {
        console.log(data);
    });
}

function donateWithLiqPay(val, name, email, subscription) {
    var callbackArr = initLiqpayCall(val, name, email, subscription);
    console.log(callbackArr);
    var status = false;
    LiqPayCheckout.init({
        data: callbackArr['data'],
        signature: callbackArr['signature'],
        embedTo: "#liqpay-donation",
        language: "ru",
        mode: "embed" // embed || popup
    }).on("liqpay.callback", function(data) {
        if (!status && data.status === 'success') {
            status = true;
            sendReplyEmail(name, email, JSON.stringify(data));
        }
    }).on("liqpay.ready", function(data) {
        //console.log(data);
    }).on("liqpay.close", function(data) {
        //console.log(data);
    });
}

function mixcloudPlay() {
    console.log('PLAY')
    var pl_url = Y.one('html').getAttribute('data-mixcloud-pl-url');
    var pl_mixcloud_items = Y.one('html').all('[data-mixcloud-url="' + pl_url + '"]');
    if (pl_mixcloud_items && pl_mixcloud_items.size()) {
        pl_mixcloud_items.addClass('playing');
    }
    Y.one('html').addClass('mixcloud-footer-playing').removeClass('mixcloud-footer-stopped');
    Y.fire('mixcloud:play');
}

function mixcloudPause() {
    console.log('PAUSE');
    Y.one('html').removeClass('mixcloud-footer-playing');
    Y.all('[data-mixcloud-url]').removeClass('playing');
    if (!Y.one('#castDiv').hasClass('playing')) {
        Y.one('html').addClass('mixcloud-footer-stopped');
    }
    Y.fire('mixcloud:pause');
}

function initMixCloudFooter() {
    if (!mixCloudFooterPlayer) {
        console.log('MixCloudFooter init');
        window.addEventListener("message", function(e) {
            var data = e.data ? JSON.parse(e.data) : false;
            if (data && data.mixcloud) {
                if (data.type && data.type == 'ready') {
                    mixCloudFooterPlayer.play && mixCloudFooterPlayer.play()
                }
                if (data.type == 'event' && data.data) {
                    if (data.data.eventName == 'play') {
                        mixcloudPlay();
                    }
                    if (data.data.eventName == 'pause') {
                        mixcloudPause();
                    }
                }
            }
        }, !1);
        if (!Y.one('.mixcloud-footer-widget-container')) {
            body.append('<div class="mixcloud-footer-widget-container" style="position: fixed; left: 0; bottom: 0; right: 0; z-index: 10"></div>');
            mixCloudFooter = body.one('.mixcloud-footer-widget-container');
        }
        /*        mixCloudFooterPlayer = Mixcloud.FooterWidget('/20ftradio/hotel-magnolia-2-w-tosha-chehonte-ross-khmil-20ft-radio-11032019/', {
                    disablePushstate: true,
                    disableUnloadWarning: true
                });
                window.mixCloudFooterPlayer = mixCloudFooterPlayer;
                mixCloudFooterPlayer.then(function(widget) {
                    mixCloudFooterPlayer = widget;
                    console.log('READY');
                    window.mixCloudFooterPlayer = mixCloudFooterPlayer;
                    //mixCloudFooterPlayer.load('/20ftradio/hotel-magnolia-2-w-tosha-chehonte-ross-khmil-20ft-radio-11032019/')

                });*/
    } else {
        console.log('MixCloudFooter here');
    }
}

function activateMixcloudThings() {
    window_loaded = true;
    window.mixCloudEmbeds = [];
    initMixCloudFooter();
    Y.all('.embed-block[data-block-json*="mixcloud.com"], .code-block iframe[src*="mixcloud.com"]').each(function(item) {
        var code_block = false;
        var iframe_src = '';
        if (item.get('nodeName') === 'IFRAME') {
            iframe_src = item.getAttribute('src');
            item = item.ancestor('.code-block');
            code_block = true;
        }
        var content = item.one('.sqs-block-content');
        if (!item.hasClass('inited')) {
            var json = code_block ? '' : JSON.parse(item.getAttribute('data-block-json'));
            var feed = code_block ? getParameterByName('feed', iframe_src) : decodeURIComponent(json.html.split('feed=')[1].split('"')[0]);
            feed = feed.replace('https://mixcloud.com/', '').replace('https://www.mixcloud.com/', '').replace('&hide_cover=1', '');
            if (feed) {
                if (feed[0] === '/') {
                    feed = feed.slice(1);
                }
                item.setAttribute('data-mixcloud-url', '/' + feed).setAttribute('data-mixcloud-api-url', 'https://api.mixcloud.com/' + feed).addClass(slugify(feed) + '-mix-item').addClass('inited mixcloud-item');
                content.empty();
                $.getJSON('https://api.mixcloud.com/' + feed, function(data) {
                        //console.log(data);
                        content.append('<div class="custom-mixcloud-widget"><div class="track-art" style="background: url(' + data.pictures.large + ') no-repeat;background-size: cover"></div><div class="text-info clear">' +
                            '<div class="play-button mixcloud-butt"></div><div class="meta"><div class="track-title">' + data.name + '</div></div></div></div>')
                    })
                    .fail(function(err) {
                        console.log(err);
                    })
            }
        }
    });
}

var formSubmitEvent = null;
var filterInit = null;
var searchGenre = function(e) {
    e.halt && e.halt();
    var value = e.newVal.trim();
    value = value && value.length ? new RegExp(value.toLowerCase(), 'gi') : false;
    Y.all('.filter-sidebar .FeedFilter-item').each(function(genre) {
        var genre_val = genre.getAttribute('data-val');
        if (value && genre_val.match(value) || !value) {
            genre.show(true);
        } else {
            genre.hide(true);
        }
    });
};

function filterMusicFeed() {
    var filterableFeed = Y.one('.filterable-feed');
    if (!filterableFeed) return;
    var tags = [];
    var collectionUrl = location.pathname && location.pathname.length > 2 ? location.pathname : '/archive'; //'/music-feed';//?format=main-content
    //console.log(collectionUrl,location.pathname)
    if (collectionUrl[collectionUrl.length - 1] == '/') {
        collectionUrl = collectionUrl.slice(0, collectionUrl.length - 1);
    }
    Y.all('.FeedFilter .active').each(function(tag) {
        tags.push(tag.getAttribute('data-val'));
    });
    tags.sort(function(a, b) {
        a = a.toLowerCase().replace(/\r?\n|\r/g, '').replace(/ /g, '');
        b = b.toLowerCase().replace(/\r?\n|\r/g, '').replace(/ /g, '');
        return (a < b) ? -1 : (a > b) ? 1 : 0;
    });
    var tags_string = tags.length ? '?tag=' + tags : '/';
    filterableFeed.all('.FeedItem').each(function(it, i) {
        it.setStyle('transitionDelay', (60 * i) + 'ms');
    });
    filterableFeed.addClass('loading');
    var sim_a = Y.Node.create('<a style="display:none" class="sim_link needsclick" data-ajax-loader="ajax-loader-binded" href="' + collectionUrl + tags_string + '"></a>');
    Y.one('body').append(sim_a);
    if (Y.one('#searchTag')) {
        searchGenre({ newVal: Y.one('#searchTag').get('value') })
    }
    setTimeout(function() {
        sim_a._node.click();
        sim_a.simulate('click');
    }, 500);
}

function mixcloudFeedGrid() {
    var filterableFeed = Y.one('.filterable-feed');
    if (Y.one('.FeedGrid .FeedItem')) {
        Y.use('squarespace-gallery-ng', function() {
            k = new Y.Squarespace.Gallery2({
                container: ".FeedGrid",
                slides: ".FeedItem",
                autoplay: !1,
                lazyLoad: !0,
                loaderOptions: { mode: "fill" },
                design: "autocolumns",
                designOptions: {
                    lightbox: !1,
                    columnWidthBehavior: 'max',
                    gutter: 0,
                    columnWidth: Math.max(window.innerWidth / 3, 400),
                    aspectRatio: 0
                },
                historyHash: !1
            });
        });
        filterableFeed.all('.FeedItem').each(function(it, i) {
            it.setStyle('transitionDelay', (60 * i) + 'ms');
        });
    }
    setTimeout(function() {
        filterableFeed && filterableFeed.removeClass('loading');
    }, 200);
}

window.Squarespace.onInitialize(Y, function() {
    Y.all('.sim_link').remove();
    // if (Y.one('#liqpay_checkout')) {
    //     var codeBlockLiq = Y.one('#liqpay_checkout').ancestor('.code-block');
    //     codeBlockLiq.addClass('hidden');
    //     if (!Y.one('#liqpayAPI')) {
    //         window.Y.Get.js('https://static.liqpay.ua/libjs/checkout.js', function(err, tx) {
    //             if (err) {
    //                 Y.log('Error loading Lazy Summaries JS: ' + err[0].error, 'error');
    //                 return;
    //             }
    //             tx && tx.nodes[0].setAttribute('id', 'liqpayAPI');
    //         });
    //     }
    //     formSubmitEvent = Y.Global.on('form:submitSuccess', function(e) {
    //         console.log('form submit success');
    //         var form = Y.one('#container form');
    //         var name = form.one('.first-name input').get('value') || 'John';
    //         var surname = form.one('.last-name input').get('value') || 'Smith';
    //         var val = form.one('.field input[placeholder*="UAH"]') ? parseInt(form.one('.field input[placeholder*="UAH"]').get('value')) : 10;
    //         var email = form.one('.email input').get('value');
    //         codeBlockLiq.removeClass('hidden');
    //         localStorage.setItem('payerName', name);
    //         localStorage.setItem('payerSurname', surname);
    //         localStorage.setItem('paymentSumm', val);
    //         localStorage.setItem('payerEmail', email);
    //         donateWithLiqPay(val, name, surname, email);
    //     });
    // }

    if (Y.one('#liqpay-popup')) {
        $('#liqpay-popup').prepend('<div class="liqpay-close">CLOSE</div>');
        var l_subscription;
        var codeBlockLiqPopup = Y.one('#liqpay_checkout').ancestor('.code-block');
        codeBlockLiqPopup.addClass('hidden');
        if (!Y.one('#liqpayAPI')) {
            window.Y.Get.js('https://static.liqpay.ua/libjs/checkout.js', function(err, tx) {
                if (err) {
                    Y.log('Error loading Lazy Summaries JS: ' + err[0].error, 'error');
                    return;
                }
                tx && tx.nodes[0].setAttribute('id', 'liqpayAPI');
            });
        }


        $('#select-yui_3_17_2_1_1605783798627_24384-field').on('change',function(){
            l_subscription = $(this).val();
        });
        formSubmitEvent = Y.Global.on('form:submitSuccess', function(e) {
            console.log('form submit');

            let l_form = Y.one('form');
            let l_name = l_form.one('.field-list .form-item:nth-child(1) input').get('value') || 'John Smith';
            var l_email = l_form.one('.field-list .form-item:nth-child(2) input').get('value');
            var l_donate = l_form.one('.field input[placeholder*="$ ENTER AMOUNT"]') ? parseInt(l_form.one('.field input[placeholder*="$ ENTER AMOUNT"]').get('value')) : 10;


            codeBlockLiqPopup.removeClass('hidden');
            localStorage.setItem('payerName', l_name);
            localStorage.setItem('paymentSumm', l_donate);
            localStorage.setItem('payerEmail', l_email);
            localStorage.setItem('payerSubscription', l_subscription);
            donateWithLiqPay(l_donate, l_name, l_email, l_subscription);
        });

        $('button.liqpay-paypal').on('click', function(){
            $('body').addClass('liqpay-on-screen');
        });
        $('.liqpay-close').on('click', function(){
            $('body').removeClass('liqpay-on-screen');
        })
    }

    if ((window_loaded || window.app_initialized) && (Y.one('.embed-block[data-block-json*="mixcloud.com"]') || Y.one('.code-block iframe[src*="mixcloud.com"]'))) {
        activateMixcloudThings();
        if (!bindMixcloudPlay) {

        }
    }
    if (window.app_initialized) {
        var cont = document.getElementById('container');
        cont.scrollTo(0, 0);
    }
    Y.fire('getCurrentEvent');
    Y.all('#navigator script[data-src]').each(function(script) {
        script = script._node;
        script.id = script.id || slugify(script.src);
        var parent = script.parentNode;
        parent.removeChild(script);
        script.src = script.dataset.src;
        script.parent = parent;
        addScript(script);
    });
    if (!filterInit) {
        searchGenreInit = Y.one('body').delegate('valuechange', searchGenre, '#searchTag');
        filterInit = Y.one('body').delegate('click', function(e) {
            e.halt();
            e.currentTarget.toggleClass('active');
            var activeFilterTags = Y.one('.active-filter-tags ul');
            var val = e.currentTarget.getAttribute('data-val');
            if (!activeFilterTags.one('[data-val="' + val + '"]') && e.currentTarget.hasClass('active')) {
                var cloned = e.currentTarget.get('parentNode').cloneNode(!0).addClass('top-tag');
                activeFilterTags.append(cloned);
            }
            if (e.currentTarget.get('parentNode').hasClass('top-tag') && !e.currentTarget.hasClass('active')) {
                var sidebar_tag = Y.one('.FeedFilter [data-val="' + val + '"]');
                sidebar_tag && sidebar_tag.removeClass('active');
                e.currentTarget.get('parentNode').remove();
            }
            filterMusicFeed();
        }, '.FeedFilter-item');
        Y.one('body').delegate('click', function(e) {
            e.halt();
            filterMusicFeed();
        }, '.filterButton');
        var filterList = Y.one('.FeedFilter');
        if (filterList && !filterList.hasClass('sorted')) {
            var items = filterList.all('li');
            if (items.size()) {
                items._nodes.sort(function(a, b) {
                    a = a.querySelector('[data-val]') ? a.querySelector('[data-val]').dataset['val'].toLowerCase().replace(/\r?\n|\r/g, '').replace(/ /g, '') : '';
                    b = b.querySelector('[data-val]') ? b.querySelector('[data-val]').dataset['val'].toLowerCase().replace(/\r?\n|\r/g, '').replace(/ /g, '') : '';
                    return (a < b) ? -1 : (a > b) ? 1 : 0;
                });
                filterList.addClass('sorted').insert(items, null);
            }
        }
    }
    var doc = Y.one('html');
    if (doc.hasClass('mixcloud-footer-playing') && doc.getAttribute('data-mixcloud-pl-url')) {
        var pl_mixcloud_items = doc.all('[data-mixcloud-url="' + doc.getAttribute('data-mixcloud-pl-url') + '"]');
        if (pl_mixcloud_items && pl_mixcloud_items.size()) {
            pl_mixcloud_items.addClass('playing');
        }
    }
    try {
        if (location.search) {
            var search = location.search.substring(1);
            var params = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
            activateFilterTags(params);
        }
    } catch (e) {
        console.log(e);
    }
    mixcloudFeedGrid();
    if (!mobileMenuListener) {
        var nav = Y.one('#mobile-navigation');
        var doc = Y.one('html');
        var body = Y.one('body');
        if (nav) {
            if (doc.hasClass('touch')) {
                nav.on('click', function(e) {
                    nav.toggleClass('sqs-mobile-nav-open');
                    Y.one('body').toggleClass('sqs-mobile-nav-open');
                });
            } else {
                nav.on('hover', function(e) {
                    nav.addClass('sqs-mobile-nav-open');
                    body.addClass('sqs-mobile-nav-open');
                }, function() {
                    nav.removeClass('sqs-mobile-nav-open');
                    body.removeClass('sqs-mobile-nav-open');
                });
            }
            mobileMenuListener = true;
        }
    }
});

function activateFilterTags(params) {
    //console.log(params)
    if (params && params.tag) {
        var tags = params.tag.split(',');
        var filterItems = Y.all('.FeedFilter-item');
        if (tags.length && filterItems.size()) {
            var activeFilterTags = Y.one('.active-filter-tags ul');
            filterItems.each(function(it) {
                var val = it.getAttribute('data-val');
                if (val && tags.indexOf(val) > -1 && !it.hasClass('active')) {
                    it.addClass('active');
                    if (!activeFilterTags.one('[data-val="' + val + '"]')) {
                        var cloned = it.get('parentNode').cloneNode(!0).addClass('top-tag');
                        activeFilterTags.append(cloned);
                    }
                }
            })
        }
    }
}

function playMixcloudFooterIfLoaded(url) {
    console.log(mixCloudFooterPlayer);
    mixCloudFooterPlayer.ready.then(function(widg) {
        console.log('ready');
        loadedTracks.current = url;
        loadedTracks.all.indexOf(url) == -1 && loadedTracks.all.push(url);
        mixCloudFooterPlayer.play();
        mixcloudPlay();
    });
}
window.Squarespace.onDestroy(Y, function() {
    formSubmitEvent && formSubmitEvent.detach();
});
if (!window_loaded) {
    activateMixcloudThings();
    body.delegate('click', function(e) {
        e.halt();
        var ancestor = e.currentTarget.ancestor('.mixcloud-item') || e.currentTarget.ancestor('.sqs-block');
        var url = ancestor.getAttribute('data-mixcloud-url');
        ancestor.toggleClass('playing');
        //console.log(url, ancestor)
        if (url && ancestor.hasClass('playing')) {
            console.log('open');
            ancestor.addClass('current');
            Y.all('.mixcloud-item.playing:not(.current)').removeClass('playing').removeClass('current');
            ancestor.removeClass('current');
            var currentIframe = body.one('.mixcloud-content');
            if (!currentIframe || currentIframe && currentIframe.getAttribute('data-src') !== url) {
                //currentIframe&&currentIframe.addClass('need-remove');
                currentIframe = Y.Node.create('<iframe data-src="' + url + '" class="mixcloud-content" width="100%" src="https://www.mixcloud.com/widget/iframe/?hide_cover=1autoplay=1&mini=0&disable_unload_warning=1&feed=' + (i = encodeURIComponent(decodeURIComponent(url))) + '" frameborder="0" allow="autoplay"></iframe>')
                currentIframe.on('load', function() {
                    mixCloudFooterPlayer = Mixcloud.PlayerWidget(document.querySelector(".mixcloud-content"));

                    setTimeout(function(){
                        console.log('after');
                        playMixcloudFooterIfLoaded(url);
                    }, 1000)
                    var need_remove = mixCloudFooter.all('.need-remove');
                    if (need_remove.size()) {
                        need_remove.each(function(it) {
                            it.remove()
                        })
                    }
                })
                mixCloudFooter.empty().append(currentIframe);
            } else {
                playMixcloudFooterIfLoaded(url);
            }

            /*if (mixCloudFooterPlayer && mixCloudFooterPlayer.load) {
                mixCloudFooterPlayer.load(url, true);
                mixCloudFooterPlayer.ready.then(function(widg) {
                    loadedTracks.current = url;
                    loadedTracks.all.indexOf(url) == -1 && loadedTracks.all.push(url);
                    mixCloudFooterPlayer = widg;
                    mixCloudFooterPlayer.play();
                    mixcloudPlay();
                    widg.loaded++;
                });
            }*/
            Y.one('html').addClass('mixcloud-footer-playing').removeClass('mixcloud-footer-stopped').setAttribute('data-mixcloud-pl-url', url);
        } else {
            console.log('close');
            Y.all('.mixcloud-item.playing').removeClass('playing').removeClass('current');
            Y.one('html').removeClass('mixcloud-footer-playing');
            mixCloudFooterPlayer && mixCloudFooterPlayer.pause && mixCloudFooterPlayer.pause();
        }
    }, '.mixcloud-butt');
}
var canvas_activated = false;
window.heightFactor = 150;

function easeInOutQuad(t) {
    return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
};

function initVisual() {
    if (canvas_activated || !canvasEq) return;
    console.log('PPPPPP');
    canvas_activated = true;
    var canvas = document.getElementById("visualCanvas") || document.getElementById("canvas");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    var ctx = canvas.getContext("2d");
    var context;
    if (typeof AudioContext !== "undefined") {
        context = new AudioContext();
    } else if (typeof webkitAudioContext !== "undefined") {
        context = new webkitAudioContext();
    } else {
        console.log('NOWEBK');
        return;
    }
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    var analyser = context.createAnalyser();
    analyser.fftSize = 64;
    var bufferLength = analyser.frequencyBinCount;

    var dataArray = new Uint8Array(bufferLength);

    var WIDTH = canvas.width;
    var HEIGHT = canvas.height;
    var barWidth = (WIDTH / bufferLength);
    var barHeight;
    var x = 0;

    // Get the frequency data and update the visualisation
    function update() {
        requestAnimationFrame(update);
        x = 0;

        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        for (var i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] - 130;
            //if(i===0){console.log(barHeight)}
            var r = barHeight + (25 * (i / bufferLength));
            var g = 250; //* (i / bufferLength);
            var b = 250;

            //ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            ctx.fillStyle = "rgb(1, 168, 158)";
            ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    var source = context.createMediaElementSource(document.getElementById('shoutcastPlayer'));
    source.connect(analyser);
    analyser.connect(context.destination);
    update();
}

Y.once('play:shoutcast', function() {
    initVisual();
});
window.customLazySummaries = {
    general: { //runs for all summary blocks
        afterRenderItemFunction: function(it, jsonData) {
            var item = it._node || it;
            var b = item.querySelector('.mixcloud-butt');
            var thumb_container = item.querySelector('.summary-thumbnail-container');
            if (thumb_container && jsonData && jsonData.sourceUrl && jsonData.sourceUrl.indexOf('https://www.mixcloud.com/') > -1 && !b) {
                item.classList && item.classList.add('mixcloud-item');
                //console.log(item.classList, item.querySelector('.summary-thumbnail'));
                var button = document.createElement('div');
                button.className = 'play-button mixcloud-butt';
                var thumb = item.querySelector('.summary-thumbnail');
                thumb && thumb.appendChild(button);
                item.setAttribute('data-mixcloud-url', jsonData.sourceUrl);
                thumb_container.setAttribute('href', jsonData.sourceUrl);
                thumb_container.removeAttribute('data-ajax-loader');
            }
        }
    }
}