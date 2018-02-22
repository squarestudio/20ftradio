function loadOneShow(url) {
    if (Y.one('#mobile-events-past')) {
        Y.io(url + '?format=main-content', {
            on: {
                success: function (data, resp) {
                    Y.one('#mobile-events-past').empty().append(resp.responseText);
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
                    })
                }
            }
        }
    })
}
Y.one('body').delegate('click', function (e) {
    e.halt();
    var url = e.currentTarget.getAttribute('href');
    console.log(url,e.currentTarget.hasAttribute('data-dynamic-load'));
    if (url.indexOf('/shows') > -1) {
        if (Y.one('#mobileEvents .tab-2')) {
            Y.one('#mobileEvents .tab-2').simulate('click');
            Y.one('html').addClass('full-mode-active');
            Y.all('.active-link').removeClass('active-link');
            e.currentTarget.addClass('active-link');
        }
    } else if (e.currentTarget.hasAttribute('data-dynamic-load')) {
        loadOneShow('https://www.20ftradio.net' + url);
    }
}, '[data-dynamic-load],a[href="/shows"]');

window.Squarespace.onInitialize(Y, function () {

});