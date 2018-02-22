window.Template.Controllers.MobileEventsController = function (element) {
    'use strict';
    var mobileEvents = Y.one('#mobileEvents');
    var eventsTabs = mobileEvents.all('.tabs a');
    var tabClickEvents, scrollEvent;

    function initTabs() {
        Y.one('#mobileEvents .tabs').addClass('tabs-active');
        eventsTabs = mobileEvents.all('.tabs a');
        var eventTabsContainer = mobileEvents.one('.mobileEvents-wrapper');
        var eventTabsBorder = mobileEvents.one('.tab-border');
        var eventTabsLists = mobileEvents.all('.mobileEvents');
        tabClickEvents = eventsTabs.on('click', function (e) {
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
                Y.all('.mobile-nav-custom .active-link').removeClass('active-link');
                Y.one('.mobile-nav-custom a[href*="/mobile-app"]').get('parentNode').addClass('active-link');
            }
            else {
                setTimeout(function () {
                    mobileEvents.one('.mobileEvents-Upcoming').removeClass('active');
                }, 360);
                eventTabsContainer.setStyles({
                    'transform': 'translate3d(-50%,0,0)'
                });
                eventTabsBorder.setStyles({
                    'transform': 'translate3d(100%,0,0)'
                });
                Y.all('.mobile-nav-custom .active-link').removeClass('active-link');
                Y.one('.mobile-nav-custom a[href*="/shows"]').get('parentNode').addClass('active-link');
            }
            eventTabsLists.removeClass('active');
            Y.one(id).addClass('active');
            if(Y.one(id+ ' #grid')){
                setTimeout(function () {
                    Y.all(id+'img').each(function(img){ImageLoader.load(img,{load:true, fit:true})})
                }, 500)
            }
            mobileEvents.getDOMNode().className = id.replace('#', 'tab-');
/*            setTimeout(function () {
                Y.one('body').removeClass('mobile-app-menu-active');
            }, 400);*/
        });
/*        scrollEvent = Y.one(window).on('scroll', function () {
            if (window.pageYOffset + 100 > mobileEvents.getY()) {
                mobileEvents.addClass('overflow-auto');
            } else {
                mobileEvents.removeClass('overflow-auto');
            }
        });*/
        mobileEvents.one('.content-loader').removeAttribute('style');
    }

    function createEvent(e) {
        e.halt();
        if(e.currentTarget.hasClass('event-on-air')||!window.plugins||!window.plugins.calendar) return false;
        var parent = e.currentTarget.ancestor('.event-item');
        var title = parent.getAttribute('data-title') || "Listen 20FTRadio";
        var eventLocation = parent.getAttribute('data-location') || "31 Nyzhnoiurkivska Street, Kyiv, Ukraine";
        var notes = parent.getAttribute('data-tags') || "Listen 20FTRadio";
        var startDate = new Date(parseInt(parent.getAttribute('data-start-date'))); // beware: month 0 = january, 11 = december
        var endDate = new Date(parseInt(parent.getAttribute('data-end-date')));
        var calOptions = window.plugins.calendar.getCalendarOptions(); // grab the defaults
        calOptions.firstReminderMinutes = 30; // default is 60, pass in null for no reminder (alarm)
        calOptions.secondReminderMinutes = 5;
        calOptions.url = "https://www.20ftradio.net" + parent.getAttribute('data-url');
        var error = function (message) {
            console.error("Error: " + message);
            setTimeout(function () {
                Y.fire('checkScheduledEvents');
                checkScheduledEvents();
            }, 100);
        };
        var success = function (message) {
            console.log(message);
            setTimeout(function () {
                Y.fire('checkScheduledEvents');
                checkScheduledEvents();
            }, 100);
        };
        var askToDelete = function (buttonIndex) {
            if (buttonIndex == 2) {
                window.plugins.calendar && window.plugins.calendar.deleteEvent(title, eventLocation, notes, startDate, endDate, success, error);
            }
        };
        var askToCreate = function (buttonIndex) {
            if (buttonIndex == 2) {
                window.plugins.calendar && window.plugins.calendar.createEventWithOptions(title, eventLocation, notes, startDate, endDate, calOptions, success, error);
            }
        };
        if (!parent.hasClass('scheduled')) {
            navigator.notification && navigator.notification.confirm(
                'Schedule ' + title + ' show?',
                askToCreate,
                'Schedule show',
                ['Cancel', 'Schedule']
            );
        } else {
            navigator.notification && navigator.notification.confirm(
                title + ' already scheduled.',
                askToDelete,
                'Delete Scheduled show',
                ['Cancel', 'Delete']
            );
        }
    }

    function initCalendarClick() {
        mobileEvents.one('.schedule-event') && mobileEvents.all('.schedule-event').on('click', createEvent);
    }

    function checkScheduledEvents() {
        var scheduleEvents = mobileEvents.all('.event-item');
        var upcoming = mobileEvents.all('#mobile-events-upcoming .event-item');
        var planedEvents = [];
        if (scheduleEvents.size()) {
            var startDate = new Date(parseInt(scheduleEvents.item(0).getAttribute('data-start-date')));
            var endDate = new Date(parseInt(scheduleEvents.item(scheduleEvents._nodes.length - 1).getAttribute('data-end-date')));
            window.plugins&&window.plugins.calendar && window.plugins.calendar.findEvent(null, null, null, startDate, endDate, function (data) {
                if (data.length) {
                    data.forEach(function (event) {
                        scheduleEvents.each(function (e) {
                            var title = e.getAttribute('data-title') || "Listen 20FTRadio";
                            var eventLocation = e.getAttribute('data-location') || "31 Nyzhnoiurkivska Street, Kyiv, Ukraine";
                            if (event.title == title && event.location == eventLocation) {
                                planedEvents.push(e)
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
        mobileEvents.all('.event-item').on('click', function (e) {
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
        if (mobileEvents && Y.one('.mobileEvents-container')) {
            if (Y.one('#mobile-events-upcoming')) {
                Y.io('https://www.20ftradio.net/events?format=main-content', {
                    on: {
                        success: function (data, resp) {
                            if (resp.responseText) {
                                Y.one('#mobile-events-upcoming').empty().prepend(resp.responseText);
                                Y.fire('getCurrentEvent');
                                localizeAndBuildDates && localizeAndBuildDates();
                                checkScheduledEvents();
                                setTimeout(function () {
                                    initCalendarClick();
                                    initEventClick();
                                }, 200);
                            } else {
                                console.log('MobileEvents: no results');
                            }
                            Y.one('#mobile-events-upcoming').show(true);
                        }
                    }
                })
            }
            if (Y.one('#mobile-events-past')) {
                loadShows();
            }
            initTabs();
        } else {
            mobileEvents.one('.content-loader').removeAttribute('style');
        }
    }

    function loadShows() {
        Y.io('https://www.20ftradio.net/shows?format=main-content', {
            on: {
                success: function (data, resp) {
                    Y.one('#mobile-events-past').append(resp.responseText);
                    if (Y.one('#grid')) {
                        Site.gridEl = Y.one('#grid');
                        Y.all('#grid img').each(function(img){ImageLoader.load(img,{load:true, fit:true})})
                    }
                }
            }
        })
    }
    initialize();

    return {
        sync: function () {
            initialize();
        },
        destroy: function () {
            console.log('destroy Mobile Events');
            tabClickEvents && tabClickEvents.detach();
            scrollEvent && scrollEvent.detach();
        }
    };

};

