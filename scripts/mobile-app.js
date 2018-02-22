function loadOneShow(url) {
    if (Y.one('#mobile-events-past')) {
        Y.io(url + '?format=main-content', {
            on: {
                success: function (data, resp) {
                    window.SQS.Lifecycle.destroy();
                    Y.one('#mobile-events-past').empty().append(resp.responseText);
                    window.SQS.Lifecycle.init();
                    setTimeout(function () {
                        Y.all('.mobile-nav-custom a[href*="/shows"]').addClass('active-link');
                    }, 400);
                }
            }
        })
    }
}

function loadShows() {
    Y.io('https://www.20ftradio.net/shows?format=main-content', {
        on: {
            success: function (data, resp) {
                Y.one('#mobile-events-past').append(resp.responseText);
                if (Y.one('#grid')) {
                    Site.gridEl = Y.one('#grid');
                    Y.all('#grid img').each(function (img) {
                        ImageLoader.load(img, {load: true, fit: true})
                    });
                    Y.all('.mobile-nav-custom a[href*="/shows"]').addClass('active-link');
                }
            }
        }
    })
}

Y.one('body').delegate('click', function (e) {
    e.halt();
    var url = e.currentTarget.getAttribute('href');
    console.log(url, e.currentTarget.hasAttribute('data-dynamic-load'));
    if (url.indexOf('/shows') > -1) {
        if (Y.one('#mobileEvents .tab-2')) {
            Y.one('#mobileEvents .tab-2').simulate('click');
            Y.one('html').addClass('full-mode-active');
            Y.all('.mobile-nav-custom .active-link').removeClass('active-link');
            Y.all('.mobile-nav-custom a[href*="/shows"]').addClass('active-link');
            e.currentTarget.addClass('active-link');
            if (Y.one('#mobile-events-past .sqs-layout')) {
                Y.one('#mobile-events-past').empty();
                loadShows();
            }
        } else {

        }
    } if (url.indexOf('/mobile-app') > -1) {
        if (Y.one('#mobileEvents .tab-2')) {
            Y.one('#mobileEvents .tab-2').simulate('click');
            Y.one('html').addClass('full-mode-active');
            Y.all('.mobile-nav-custom .active-link').removeClass('active-link');
            Y.all('.mobile-nav-custom a[href*="/shows"]').addClass('active-link');
            e.currentTarget.addClass('active-link');
            if (Y.one('#mobile-events-past .sqs-layout')) {
                Y.one('#mobile-events-past').empty();
                loadShows();
            }
        } else {

        }
    }
    else if (e.currentTarget.hasAttribute('data-dynamic-load')) {
        loadOneShow('https://www.20ftradio.net' + url);
    }
}, '[data-dynamic-load],a[href="/shows"],a[href*="/mobile-app"]');

window.Squarespace.onInitialize(Y, function () {

});