window.Template.Controllers.MobileEventsController = function (element) {
    'use strict';
    var mobileEvents = Y.one('#mobileEvents');
    var eventsTabs = mobileEvents.all('.tabs a');

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
                        if ((items.past && items.past.length) || (items.upcoming && items.upcoming.length)) {
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

    function initTabs() {
        Y.one('#mobileEvents .tabs').addClass('tabs-active');
        eventsTabs = mobileEvents.all('.tabs a');
        var eventTabsContainer = mobileEvents.one('.mobileEvents-wrapper');
        var eventTabsBorder = mobileEvents.one('.tab-border');
        var eventTabsLists = mobileEvents.all('.mobileEvents');
        eventsTabs.on('click', function (e) {
            e.halt();
            eventsTabs.removeClass('active');
            e.currentTarget.addClass('active');
            var id = e.currentTarget.getAttribute('href');
            if (e.currentTarget.hasClass('tab-1')) {
                setTimeout(function () {
                    mobileEvents.one('.mobileEvents-Past').removeClass('active');
                }, 360);
                eventTabsContainer.setStyles({
                    'transform': 'translate3d(0,0,0)'
                });
                eventTabsBorder.setStyles({
                    'transform': 'translate3d(0,0,0)'
                });
            } else {
                setTimeout(function () {
                    mobileEvents.one('.mobileEvents-Upcoming').removeClass('active');
                }, 360);
                eventTabsContainer.setStyles({
                    'transform': 'translate3d(-50%,0,0)'
                });
                eventTabsBorder.setStyles({
                    'transform': 'translate3d(100%,0,0)'
                });
            }
            eventTabsLists.removeClass('active');
            Y.one(id).addClass('active');
        })
    }

    function createEvent(e) {
        e.halt();
        var title = e.currentTarget.getAttribute('data-title') || "Listen 20FTRadio";
        var eventLocation = e.currentTarget.getAttribute('data-location') || "31 Nyzhnoiurkivska Street, Kyiv, Ukraine";
        var notes = e.currentTarget.getAttribute('data-tags') || "Listen 20FTRadio";
        var currentTime = new Date();
        var siteTimezoneOffset = Static.SQUARESPACE_CONTEXT.website.timeZoneOffset;
        var userTimezoneOffset = currentTime.getTimezoneOffset() * 60 * 1000;
        var startDate = new Date(parseInt(e.currentTarget.getAttribute('data-start-date')) + siteTimezoneOffset + userTimezoneOffset); // beware: month 0 = january, 11 = december
        var endDate = new Date(parseInt(e.currentTarget.getAttribute('data-end-date')) + siteTimezoneOffset + userTimezoneOffset);
        var calOptions = window.plugins.calendar.getCalendarOptions(); // grab the defaults
        calOptions.firstReminderMinutes = 30; // default is 60, pass in null for no reminder (alarm)
        calOptions.secondReminderMinutes = 5;
        calOptions.url = "https://www.20ftradio.net" + e.currentTarget.getAttribute('data-url');
        var error = function (message) {
            console.error("Error: " + message);
            setTimeout(function () {
                checkScheduledEvents();
            }, 100);
        };
        var success = function (message) {
            console.log(message);
            setTimeout(function () {
                checkScheduledEvents();
            }, 100);
        };
        var askToDelete = function (buttonIndex) {
            if (buttonIndex == 2) {
                window.plugins.calendar && window.plugins.calendar.deleteEvent(title,eventLocation,notes,startDate,endDate,success,error);
            }
        };
        var askToCreate = function (buttonIndex) {
            if (buttonIndex == 2) {
                window.plugins.calendar && window.plugins.calendar.createEventWithOptions(title, eventLocation, notes, startDate, endDate, calOptions, success, error);
            }
        };
        if (!e.currentTarget.ancestor('.event-item').hasClass('scheduled')) {
            navigator.notification && navigator.notification.confirm(
                'Schedule '+title + ' show?',
                askToCreate,
                'Schedule show',
                ['Cancel','Schedule']
            );
        } else {
            navigator.notification && navigator.notification.confirm(
                title + ' already scheduled.',
                askToDelete,
                'Delete Scheduled show',
                ['Cancel','Delete']
            );
        }
    }

    function initCalendarClick() {
        mobileEvents.one('.schedule-event') && mobileEvents.all('.schedule-event').on('click', createEvent);
    }

    function checkScheduledEvents() {
        var currentTime = new Date();
        var siteTimezoneOffset = Static.SQUARESPACE_CONTEXT.website.timeZoneOffset;
        var userTimezoneOffset = currentTime.getTimezoneOffset() * 60 * 1000;
        var scheduleEvents = mobileEvents.all('.schedule-event');
        var upcoming = mobileEvents.all('#mobile-events-upcoming li');
        var planedEvents = [];
        if (scheduleEvents._nodes.length){
            var startDate = new Date(parseInt(scheduleEvents.item(0).getAttribute('data-start-date')) + siteTimezoneOffset + userTimezoneOffset);
            var endDate = new Date(parseInt(scheduleEvents.item(scheduleEvents._nodes.length-1).getAttribute('data-end-date')) + siteTimezoneOffset + userTimezoneOffset);
            window.plugins.calendar && window.plugins.calendar.findEvent(null, null, null, startDate, endDate, function (data) {
                console.log(data);
                if (data.length) {
                    data.forEach(function (event) {
                        scheduleEvents.each(function (e) {
                            var title = e.getAttribute('data-title') || "Listen 20FTRadio";
                            var eventLocation = e.getAttribute('data-location') || "31 Nyzhnoiurkivska Street, Kyiv, Ukraine";
                            if (event.title == title && event.location == eventLocation){
                                planedEvents.push(e.ancestor('.event-item'))
                            }
                        })
                    })
                } else {
                    console.log('No scheduled in calendar for that period');
                }
                upcoming.removeClass('scheduled');
                planedEvents.length && planedEvents.forEach(function (event_item) {
                    event_item.addClass('scheduled');
                })
            }, function (err) {
                console.error(err);
            });
        }
    }

    function initEventClick() {
        mobileEvents.all('li').on('click', function (e) {
            if (e.currentTarget.one('.event-descr')) {
                e.currentTarget.all('img').each(function (img) {
                    img.removeAttribute('data-load');
                    ImageLoader.load(img, {load: true});
                });
                e.currentTarget.toggleClass('active');
            }
        })
    }

    function initialize() {
        console.log('mobileEvents init');
        mobileEvents = Y.one('#mobileEvents');
        if (mobileEvents) {
            if (Y.one('#mobile-events-query-template')) {
                Y.use(['node', 'squarespace-json-template'], function (Y) {
                    var template = Y.one('#mobile-events-query-template').getHTML().replace(/\^/g, '{');
                    var url = 'https://www.20ftradio.net/events/';
                    getCollectionItems(url).then(function (items) {
                        console.log(items);
                        if (items) {
                            var compiled = Y.JSONTemplate.evaluateJsonTemplate(template, items); //compile template with received data
                            var compiledFragment = Y.Node.create(compiled);
                            mobileEvents.append(compiledFragment);
                            Y.fire('getCurrentEvent');
                            initTabs();
                            checkScheduledEvents();
                            setTimeout(function () {
                                initCalendarClick();
                                initEventClick();
                            }, 200);
                        } else {
                            mobileEvents.append(' <div class="mobileEvents-wrapper"><ul id="mobile-events-upcoming" class="mobileEvents mobileEvents-Upcoming active"><p class="no-events-message">No Results</p></ul><ul id="mobile-events-past" class="mobileEvents mobileEvents-Past"><p class="no-events-message">No Results</p></ul></div>');
                            console.log('MobileEvents: no results');
                            initTabs();
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

