var mixCloudFooterPlayer = false;
var window_loaded = false;
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
                html.removeClass('mixcloud-footer-playing').addClass('mixcloud-footer-stopped');
                Y.fire('mixcloud:pause');
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
    console.log(Y.all('iframe[src*=".mixcloud"]'))
    Y.all('iframe[src*=".mixcloud"]').each(function (iframe) {
        var widget = Mixcloud.PlayerWidget(iframe._node);
        widget.ready.then(function (widg) {
            //widget.setOption('mini', true);
            var url = getParameterByName('feed', iframe.getAttribute('src')).replace('https://mixcloud.com','');
            widg.events.play.on(function () {
                console.log(url);
                mixCloudFooterPlayer&&mixCloudFooterPlayer.load&&mixCloudFooterPlayer.load(url, true);
                widg.pause();
            });
            widg.events.error.on(function () {
                console.log(url, 'error');
            });
            window.mixCloudEmbeds.push(widg);
        });
    })
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
    console.log(window_loaded,Y.all('.embed-block[data-block-json*="mixcloud.com"]'))
    if (window_loaded && Y.one('.embed-block[data-block-json*="mixcloud.com"]')) {
        console.log('runnnn');
        activateMixcloudThings()
    }
});
Y.config.win.Squarespace.onDestroy(Y, function () {
    formSubmitEvent && formSubmitEvent.detach();
});
Y.on('domready', function () {
    if (!window_loaded && Y.one('.embed-block[data-block-json*="mixcloud.com"]')) {
        console.log('DOM Ready')
        activateMixcloudThings();
    }
});