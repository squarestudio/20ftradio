window.Squarespace.onInitialize(Y, function () {
    Y.one('body').delegate('click', function (e) {
        e.halt();
        var url = e.currentTarget.getAttribute('href');
        console.log(url);
        if(url.indexOf('/shows')>-1){

        } else if(e.currentTarget.hasAttribute('data-dynamic-load')){
            window.Template.Controllers.MobileEventsController.loadOneShow(url);
        }
    }, '[data-dynamic-load],a[href="/shows"]');
});