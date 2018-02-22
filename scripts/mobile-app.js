Y.one('body').delegate('click', function (e) {
    console.log(e);
    e.halt();
    e.preventDefault();
    e.stopPropagation();
}, '[data-dynamic-load],a[href="/shows"]');