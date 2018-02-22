Y.one('body').delegate('click', function (e) {
    console.log(e);
    e.halt();

}, '[data-dynamic-load],a[href="/shows"]');
window.Squarespace.onInitialize(Y, function () {
    Y.all()
});