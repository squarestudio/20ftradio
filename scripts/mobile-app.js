Y.one('body').delegate('click', function (e) {
    console.log(e);
    e.halt();
    e.preventDefault();
}, '[data-dynamic-load],a[href="/shows"]');