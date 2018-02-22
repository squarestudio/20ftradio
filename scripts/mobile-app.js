window.Squarespace.onInitialize(Y, function () {
    Y.one('body').delegate('click', function (e) {
        console.log(e);
        e.halt();
        if(e.currentTarget.getAttribute('href').indexOf('/shows')>-1){
            
        }
    }, '[data-dynamic-load],a[href="/shows"]');
});