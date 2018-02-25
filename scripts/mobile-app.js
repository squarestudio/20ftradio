window.SHOWS = {};
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/\//g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
function loadOneShow(url) {
    if (Y.one('#mobile-events-past')) {
        var append = function (content) {
            window.SQS.Lifecycle.destroy();
            Y.one('.mobileEvents-wrapper')._node.scrollTo(0, 0);
            Y.one('#mobile-events-past').addClass('loaded').empty();
            Y.one('#mobile-events-past').append(content);
            window.SQS.Lifecycle.init();
        };
        var slugified_url = slugify(url);
        if(window.SHOWS[slugified_url]){
            append(window.SHOWS[slugified_url]);
        } else {
            Y.io(url + '?format=main-content', {
                on: {
                    success: function (data, resp) {
                        append(resp.responseText);
                        setTimeout(function () {
                            Y.all('.mobile-nav-custom .active-link').removeClass('active-link');
                            Y.one('.mobile-nav-custom a[href*="/shows"]').get('parentNode').addClass('active-link');
                            Y.one('body').removeClass('mobile-app-menu-active');
                            window.SHOWS[slugified_url] = Y.one('#mobile-events-past').getContent();
                        }, 400);
                    }
                }
            })
        }
    }
}

function loadShows() {
    var append = function (content) {
        Y.one('.mobileEvents-wrapper')&&Y.one('.mobileEvents-wrapper')._node.scrollTo(0, 0);
        Y.one('#mobile-events-past').append(content).addClass('loaded');
        if (Y.one('#grid')) {
            Site.gridEl = Y.one('#grid');
            Y.all('#grid img').each(function (img) {
                ImageLoader.load(img, {load: true, fit: true})
            });
            Y.one('.mobile-nav-custom a[href*="/shows"]').get('parentNode').addClass('active-link');
        }
    };
    if (window.SHOWS_CONTENT) {
        append(window.SHOWS_CONTENT);
    } else {
        Y.io('https://www.20ftradio.net/shows?format=main-content', {
            on: {
                success: function (data, resp) {
                    append(resp.responseText);
                    setTimeout(function () {
                        window.SHOWS_CONTENT = Y.one('#mobile-events-past').getContent();
                    }, 300)
                }
            }
        })
    }
}

function activateTab2() {
    Y.one('.mobileEvents-wrapper')&&Y.one('.mobileEvents-wrapper')._node.scrollTo(0, 0);
    var mobileEvents = Y.one('#mobileEvents');
    var eventTabsContainer = mobileEvents.one('.mobileEvents-wrapper');
    var eventTabsBorder = mobileEvents.one('.tab-border');
    mobileEvents.all('.tabs a').removeClass('active');
    mobileEvents.one('.tab-2').addClass('active');
    mobileEvents.one('.mobileEvents-Past').addClass('active');
    mobileEvents.one('.mobileEvents-Upcoming').removeClass('active');
    eventTabsContainer.setStyles({
        'transform': 'translate3d(-50%,0,0)'
    });
    eventTabsBorder.setStyles({
        'transform': 'translate3d(100%,0,0)'
    });
    Y.one('html').addClass('full-mode-active');
    Y.all('.mobile-nav-custom .active-link').removeClass('active-link');
    Y.one('.mobile-nav-custom a[href*="/shows"]').get('parentNode').addClass('active-link');
    setTimeout(function () {
        Y.one('body').removeClass('mobile-app-menu-active');
    }, 400);
}

function activateTab1() {
    var mobileEvents = Y.one('#mobileEvents');
    var eventTabsContainer = mobileEvents.one('.mobileEvents-wrapper');
    var eventTabsBorder = mobileEvents.one('.tab-border');
    mobileEvents.all('.tabs a').removeClass('active');
    mobileEvents.one('.tab-1').addClass('active');
    mobileEvents.one('.mobileEvents-Past').removeClass('active');
    mobileEvents.one('.mobileEvents-Upcoming').addClass('active');
    eventTabsContainer.setStyles({
        'transform': 'translate3d(0,0,0)'
    });
    eventTabsBorder.setStyles({
        'transform': 'translate3d(0,0,0)'
    });
    Y.one('html').addClass('full-mode-active');
    Y.all('.mobile-nav-custom .active-link').removeClass('active-link');
    Y.one('.mobile-nav-custom a[href*="/mobile-app"]').get('parentNode').addClass('active-link');
    setTimeout(function () {
        Y.one('body').removeClass('mobile-app-menu-active');
    }, 400);
};
Y.one('body').delegate('click', function (e) {
    e.halt();
    var url = e.currentTarget.getAttribute('href');
    var mobileEvents = Y.one('#mobileEvents');
    console.log(url, e.currentTarget.hasAttribute('data-dynamic-load'));
    if (url.indexOf('/shows') > -1) {
        if (mobileEvents.one('.tab-2')) {
            activateTab2();
            if (Y.one('#mobile-events-past .sqs-layout')) {
                Y.one('#mobile-events-past').empty().append('<div class="content-loader"></div>').removeClass('loaded');
                loadShows();
            }
        } else {

        }
    } else if (url.indexOf('/mobile-app') > -1) {
        if (mobileEvents.one('.tab-1')) {
            activateTab1();
        } else {

        }
    }
    else if (e.currentTarget.hasAttribute('data-dynamic-load')) {
        Y.one('#mobile-events-past').empty().append('<div class="content-loader"></div>').removeClass('loaded');
        loadOneShow('https://www.20ftradio.net' + url);
    }
}, '[data-dynamic-load],a[href="/shows"],a[href*="/mobile-app"]');

window.Squarespace.onInitialize(Y, function () {
    if (window.activateShows) {
        window.activateShows = false;
        activateTab2();
    }
});