var mixCloudFooterPlayer = false;
var window_loaded = false;
var bindMixcloudPlay = false;
window.mixCloudEmbeds = [];
var body = Y.one('body');
var html = Y.one('html');

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

function sendReplyEmail(name, surname, email, data) {
    $.ajax({
        type: 'POST',
        url: 'https://app.20ftradio.net/mail-callback.php',
        data: {
            name: name,
            surname: surname,
            email: email,
            data: data
        },
        dataType: 'json'
    }).done(function (data) {
        console.log(data);
    }).fail(function (data) {
        console.log(data);
    });
}

function donateWithLiqPay(val, name, surname, email) {
    var callbackArr = initLiqpayCall(val, name, surname, email);
    var status = false;
    LiqPayCheckout.init({
        data: callbackArr['data'],
        signature: callbackArr['signature'],
        embedTo: "#liqpay_checkout",
        language: "ru",
        mode: "embed" // embed || popup
    }).on("liqpay.callback", function (data) {
        if (!status && data.status === 'success') {
            status = true;
            sendReplyEmail(name, surname, email, JSON.stringify(data));
        }
    }).on("liqpay.ready", function (data) {
        //console.log(data);
    }).on("liqpay.close", function (data) {
        //console.log(data);
    });
}

function initMixCloudFooter() {
    if (!mixCloudFooterPlayer) {
        console.log('MixCloudFooter init');
        mixCloudFooterPlayer = Mixcloud.FooterWidget('https://www.mixcloud.com/20ftradio/', {
            disablePushstate: true,
            disableUnloadWarning: true
        });
        window.mixCloudFooterPlayer = mixCloudFooterPlayer;
        mixCloudFooterPlayer.then(function (widget) {
            mixCloudFooterPlayer = widget;
            mixCloudFooterPlayer.events.play.on(function () {
                html.addClass('mixcloud-footer-playing').removeClass('mixcloud-footer-stopped');
                Y.fire('mixcloud:play');
            });
            mixCloudFooterPlayer.events.pause.on(function () {
                html.removeClass('mixcloud-footer-playing');
                if (!html.one('#castDiv').hasClass('playing')) {
                    html.addClass('mixcloud-footer-stopped');
                }
                Y.fire('mixcloud:pause');
            });
            mixCloudFooterPlayer.events.ended.on(function () {
                html.removeClass('mixcloud-footer-playing').removeClass('mixcloud-footer-stopped');
                Y.all('.mixcloud-item.playing').removeClass('playing').removeClass('current');
                Y.fire('mixcloud:ended');
            });
            mixCloudFooterPlayer.events.error.on(function (e) {
                console.log('MixCloud Error', e);
            });
        });
    } else {
        console.log('MixCloudFooter here');
    }
}

function activateMixcloudThings() {
    window_loaded = true;
    window.mixCloudEmbeds = [];
    initMixCloudFooter();
    Y.all('.embed-block[data-block-json*="mixcloud.com"], .code-block iframe[src*="mixcloud.com"]').each(function (item) {
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
                $.getJSON('https://api.mixcloud.com/' + feed + '?callback=', function (data) {
                    //console.log(data);
                    content.append('<div class="custom-mixcloud-widget"><div class="track-art" style="background: #' + data.picture_primary_color + ' url(' + data.pictures.large + ') no-repeat;background-size: cover"></div><div class="text-info clear">' +
                        '<div class="play-button mixcloud-butt"></div><div class="meta"><div class="track-title">' + data.name + '</div></div></div></div>')
                })
                    .fail(function (err) {
                        console.log(err);
                    })
            }
        }
    });
}

var formSubmitEvent = null;
Y.config.win.Squarespace.onInitialize(Y, function () {
    if (Y.one('#liqpay_checkout')) {
        var codeBlockLiq = Y.one('#liqpay_checkout').ancestor('.code-block');
        codeBlockLiq.addClass('hidden');
        if (!Y.one('#liqpayAPI')) {
            window.Y.Get.js('https://static.liqpay.ua/libjs/checkout.js', function (err, tx) {
                if (err) {
                    Y.log('Error loading Lazy Summaries JS: ' + err[0].error, 'error');
                    return;
                }
                tx && tx.nodes[0].setAttribute('id', 'liqpayAPI');
            });
        }
        formSubmitEvent = Y.Global.on('form:submitSuccess', function (e) {
            var form = Y.one('#container form');
            var name = form.one('.first-name input').get('value') || 'John';
            var surname = form.one('.last-name input').get('value') || 'Smith';
            var val = form.one('.field input[placeholder*="UAH"]') ? parseInt(form.one('.field input[placeholder*="UAH"]').get('value')) : 10;
            var email = form.one('.email input').get('value');
            codeBlockLiq.removeClass('hidden');
            localStorage.setItem('payerName', name);
            localStorage.setItem('payerSurname', surname);
            localStorage.setItem('paymentSumm', val);
            localStorage.setItem('payerEmail', email);
            donateWithLiqPay(val, name, surname, email);
        });
    }
    if ((window_loaded || window.app_initialized) && (Y.one('.embed-block[data-block-json*="mixcloud.com"]') || Y.one('.code-block iframe[src*="mixcloud.com"]'))) {
        activateMixcloudThings();
        if (!bindMixcloudPlay) {
            body.delegate('click', function (e) {
                e.halt();
                var ancestor = e.currentTarget.ancestor('.sqs-block');
                var url = ancestor.getAttribute('data-mixcloud-url');
                ancestor.toggleClass('playing');
                if (url && ancestor.hasClass('playing')) {
                    ancestor.addClass('current');
                    Y.all('.mixcloud-item.playing:not(.current)').removeClass('playing').removeClass('current');
                    ancestor.removeClass('current');
                    mixCloudFooterPlayer && mixCloudFooterPlayer.load && mixCloudFooterPlayer.load(url, true);
                } else {
                    Y.all('.mixcloud-item.playing').removeClass('playing').removeClass('current');
                    mixCloudFooterPlayer && mixCloudFooterPlayer.pause && mixCloudFooterPlayer.pause();
                }
            }, '.mixcloud-butt');
        }
    }
});
Y.config.win.Squarespace.onDestroy(Y, function () {
    formSubmitEvent && formSubmitEvent.detach();
});
if (!window_loaded && (Y.one('.embed-block[data-block-json*="mixcloud.com"]') || Y.one('.code-block iframe[src*="mixcloud.com"]'))) {
    console.log('DOM Ready');
    activateMixcloudThings();
}
var canvas_activated = false;
window.heightFactor = 150;

function initVisual() {
    if (canvas_activated) return;
    console.log('PPPPPP');
    canvas_activated = true;
    var canvas = document.getElementById("visualCanvas");
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
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame']
            || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    var analyser = context.createAnalyser();
    analyser.fftSize = 128;
    var bufferLength = analyser.frequencyBinCount;

    var dataArray = new Uint8Array(bufferLength);

    var WIDTH = canvas.width;
    var HEIGHT = canvas.height;
    var barWidth = (WIDTH / bufferLength) * 2;
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
            barHeight = dataArray[i] - (1000 * (i / bufferLength));
            //if(i===0){console.log(barHeight)}
            var r = barHeight + (25 * (i / bufferLength));
            var g = 250;//* (i / bufferLength);
            var b = 250;

            ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
            ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    var source = context.createMediaElementSource(document.getElementById('shoutcastPlayer'));
    source.connect(analyser);
    analyser.connect(context.destination);
    update();
}

Y.once('play:shoutcast', function () {
    initVisual();
});
