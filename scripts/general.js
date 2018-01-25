/*Y.use('node', function () {
    Y.on('domready', function () {
        var move;
        Y.all('.subnav a').each(function (a) {
            a.on('touchstart', function () {
                move = false;
            });
            a.on('touchmove', function () {
                move = true;
            });
            a.on('touchend', function () {
                if (move === false) {
                    window.location = a.getAttribute('href');
                }
            });
        });
    });
});*/
function donateWithLiqPay(val, name, surname, email) {
    var callbackArr = initLiqpayCall(val, name, surname, email);
    LiqPayCheckout.init({
        data: callbackArr['data'],
        signature: callbackArr['signature'],
        embedTo: "#liqpay_checkout",
        language: "ru",
        mode: "embed" // embed || popup
    }).on("liqpay.callback", function (data) {
        console.log(data.status);
        console.log(data);
    }).on("liqpay.ready", function (data) {
        console.log(data);
    }).on("liqpay.close", function (data) {
        console.log(data);
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
});
Y.config.win.Squarespace.onDestroy(Y, function () {
    formSubmitEvent && formSubmitEvent.detach();
});