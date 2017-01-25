window.Template.Controllers.MobileEventsController = function (element) {
    'use strict';
    var animOnScroll;
    var mobileEvents = Y.one('#mobileEvents');

    function getCollectionItems(collection_url) {
        return new Y.Promise(function (resolve) {
            var content_items = {past: [], upcoming: []};
            var offset = '';

            function getItems(collection_url, offset) {
                Y.Data.get({
                    url: collection_url + '?format=json',
                    data: {
                        view: 'list',
                        time: new Date().getTime(),
                        offset: offset || ''
                    },
                    success: function (items) {
                        if ((items.past && items.past.length) || (items.upcoming&&items.upcoming.length)) {
                            if (items.upcoming) {
                                content_items.upcoming = content_items.upcoming.concat(items.upcoming);
                            }
                            if (items.past) {
                                content_items.past = content_items.past.concat(items.past);
                            }
                            if (items.pagination && items.pagination.nextPage && offset !== items.pagination.nextPageUrl.split('offset=')[1]) {
                                getItems(collection_url, items.pagination.nextPageUrl.split('offset=')[1]);
                            } else {
                                resolve(content_items);
                            }
                        } else {
                            resolve(content_items);
                        }
                    },
                    failure: function (e) {
                        console.warn('error : ' + e.message);
                        resolve(content_items);
                    }
                })
            }

            getItems(collection_url);
        })
    }

    function initialize() {
        console.log('Wall init');
        mobileEvents = Y.one('#wallGrid');
        if (mobileEvents) {
            var mobileWall = mobileEvents.one('.mobile-only');
            window.Template.Util.initShareButtons();
            if (animOnScroll) animOnScroll = null;
            var imagesReady = function () {
                imagesLoaded(document.getElementById("wallGrid"), function () {
                    console.log('activated wall');
                    initGalleries();
                    initVideos();
                    initTexts();
                    animOnScroll = new AnimOnScroll(document.getElementById("wallGrid"), {
                        minDuration: 1,
                        maxDuration: 2,
                        viewportFactor: 0.2
                    });
                    setTimeout(function () {
                        simulateResize();
                    }, 100);
                });
            };
            if (Y.one('.wall-item-link')) {
                Y.use(['node', 'squarespace-json-template'], function (Y) {
                    var template = Y.one(Y.one('.wall-item-link').getData('template')).getHTML().replace(/\^/g, '{');
                    mobileEvents.all('.wall-item-link').each(function (link) {
                        var url = link.getAttribute('href'),
                            order = link.getAttribute('data-first-order');
                        getCollectionItems(url).then(function (items) {
                            console.log(items);
                            if (items) {
                                var compiled = Y.JSONTemplate.evaluateJsonTemplate(template, items); //compile template with received data
                                var compiledFragment = Y.Node.create(compiled);
                                /*                            if(order == 'true'){
                                 var nodes = getNodesOrderedByAdded(wallGrid.all('li'));
                                 wallGrid.append(nodes);
                                 wallGrid.prepend(getNodesOrderedByDate(compiledFragment.all('li')));
                                 } else {
                                 link.insert(compiledFragment, 'before');
                                 nodes = getNodesOrderedByAdded(wallGrid.all('li'));
                                 wallGrid.append(nodes);
                                 }*/
                                if (compiledFragment.one('.wallEvents-Upcoming')) {
                                    var upcomingMob = compiledFragment.one('.wallEvents-Upcoming').cloneNode(!0);
                                    mobileWall.prepend(upcomingMob.get('children'));
                                }
                                if (compiledFragment.one('.wallEvents-Past')) {
                                    var pastMob = compiledFragment.one('.wallEvents-Past').cloneNode(!0);
                                    mobileWall.append(pastMob.get('children'));
                                }
                                var events = Y.Node.create('<ul class="wallGrid wallEvents"></ul>');
                                mobileEvents.prepend(events.prepend(compiledFragment.all('li')));
                                link.remove();
                                imagesReady();
                                loadImages();
                                Y.fire('getCurrentEvent');
                                if (window.AjaxLoader) {
                                    Y.all('.wallGrid a').setAttribute('data-ajax-loader', 'ajax-loader-binded');
                                    //Y.all('.wallEvents a').setAttribute('data-ajax-loader','ajax-loader-binded');
                                }
                            } else {
                                link.remove();
                                imagesReady();
                                loadImages();
                            }
                        })
                    })
                })
            } else {
                imagesReady();
                loadImages();
            }
        }
    }

    function getNodesOrderedByDate(nodes) {
        var now = (new Date()).getTime();
        nodes._nodes.sort(function (a, b) {
            var bigger = parseInt(b.getAttribute('data-start-date')) - parseInt(a.getAttribute('data-start-date'));
            console.log(bigger);
            return bigger - now;
        });
        return nodes;
    }

    function getNodesOrderedByAdded(nodes) {
        nodes._nodes.sort(function (a, b) {
            return +b.getAttribute('data-added-on') - +a.getAttribute('data-added-on');
        });
        return nodes;
    }

    initialize();

    return {
        sync: function () {
            initialize();
        },
        destroy: function () {
            console.log('destroy wall');
        }
    };

};

