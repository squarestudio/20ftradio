Y.one('body').delegate('click', function (e) {
    console.log(e);
    e.halt();

}, '[data-dynamic-load],a[href="/shows"]');