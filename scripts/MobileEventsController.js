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
        console.log('mobileEvents init');
        mobileEvents = Y.one('#mobileEvents');
        if (mobileEvents) {
/*            if (animOnScroll) animOnScroll = null;
            animOnScroll = new AnimOnScroll(document.getElementById("mobileEvents"), {
                minDuration: 1,
                maxDuration: 2,
                viewportFactor: 0.2
            });*/
            if (Y.one('#mobile-events-query-template')) {
                Y.use(['node', 'squarespace-json-template'], function (Y) {
                    var template = Y.one('#mobile-events-query-template').getHTML().replace(/\^/g, '{');
                    var url = 'https://www.20ftradio.com/events/';
                    getCollectionItems(url).then(function (items) {
                        console.log(items);
                        if (items) {
                            var compiled = Y.JSONTemplate.evaluateJsonTemplate(template, items); //compile template with received data
                            var compiledFragment = Y.Node.create(compiled);
                            mobileEvents.append(compiledFragment);
                            Y.fire('getCurrentEvent');
                            /*                                if (window.AjaxLoader) {
                             Y.all('.wallGrid a').setAttribute('data-ajax-loader', 'ajax-loader-binded');
                             }*/
                        } else {
                            console.log('MobileEvents: no results');
                        }
                    })
                })
            }
        }
    }

    initialize();

    return {
        sync: function () {
            initialize();
        },
        destroy: function () {
            console.log('destroy Mobile Events');
        }
    };

};

