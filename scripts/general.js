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
    Y.all('.embed-block[data-block-json*="mixcloud.com"]').each(function (item) {
        var content = item.one('.sqs-block-content');
        var json = JSON.parse(item.getAttribute('data-block-json'));
        var feed = decodeURIComponent(json.html.split('feed=')[1].split('"')[0]).replace('https://mixcloud.com/', '').replace('https://www.mixcloud.com/', '').replace('&hide_cover=1', '') || '';
        if (feed) {
            item.setAttribute('data-mixcloud-url', '/'+feed).setAttribute('data-mixcloud-api-url', 'https://api.mixcloud.com/' + feed).addClass(slugify(feed)+'-mix-item');
            content.empty();
        }
    });
    Y.all('[data-mixcloud-api-url]').each(function (embed) {
        var content = embed.one('.sqs-block-content');
        var api_url = embed.getAttribute('data-mixcloud-api-url');
        if (api_url&&!embed.hasClass('inited')) {
            embed.addClass('inited');
            $.getJSON(api_url + '?callback=', function (data) {
                console.log("success", data);
                content.append('<div class="custom-mixcloud-widget"><div class="track-art" style="background: #333 url('+data.pictures.medium+') no-repeat;background-size: cover"></div><div class="text-info clear">' +
                    '<a class="play-button mixcloud-butt"></a><div class="meta"><div class="track-title">'+data.name+'</div></div></div></div>')
            })
                .fail(function (err) {
                    console.log(err);
                })
        }
        /*var widget = Mixcloud.PlayerWidget(iframe._node);
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
        });*/
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
    console.log(window_loaded, Y.all('.embed-block[data-block-json*="mixcloud.com"]'))
    if (window_loaded && Y.one('.embed-block[data-block-json*="mixcloud.com"]')) {
        Y.all('.embed-block[data-block-json*="mixcloud.com"]').each(function (item) {
            //item.one('.sqs-block-content').empty();
        });
        console.log('runnnn');
        activateMixcloudThings()
    }
});
Y.config.win.Squarespace.onDestroy(Y, function () {
    formSubmitEvent && formSubmitEvent.detach();
});
if (!window_loaded && Y.one('.embed-block[data-block-json*="mixcloud.com"]')) {
    console.log('DOM Ready');
    activateMixcloudThings();
    body.delegate('click', function (e) {
        e.halt()
        var url = e.currentTarget.ancestor('.embed-block').getAttribute('data-mixcloud-url');
        if(url){
            mixCloudFooterPlayer&&mixCloudFooterPlayer.load&&mixCloudFooterPlayer.load(url, true);
        }
    }, '.mixcloud-butt')
}