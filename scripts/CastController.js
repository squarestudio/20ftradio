window.Template.Controllers.CastController = function (element) {
    'use strict';
    var castPlayer,
        sitePlayer = Y.one('.site-player'),
        trackName = sitePlayer.one('.track-name'),
        videoId,
        shoutCastUrl,
        retry = 0,
        maxRetry = 5,
        playerType = 'youtube',
        shoutCastTimeout,
        shoutCastStatusInterval,
        eventStatusInterval,
        currentEvents,
        castContainer = Y.one('#castDiv');

    function initialize() {
        if (Y.one('#castDiv') && !Y.one('#castDiv').hasClass('initialized')) {
            initCast();
            Y.one(window).on('resize', refreshImages);
            if (window.self !== window.top) {
                window.top.Y.one('.sqs-preview-frame-content').addClass('content-loaded');
            }
            Y.one('#castDiv').addClass('initialized');
        }
    }

    function refreshImages() {
        castContainer.all('img').each(function (img) {
            img.removeAttribute('data-load');
            ImageLoader.load(img, {load: true});
        });
    }

    function initYoutubePlayer() {
        castPlayer = new YT.Player('castPlayer', {
            height: '720',
            width: '1280',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'modestbranding': 1,
                'rel': 0,
                //'showinfo': 0,
                'fs': 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
        playerType = 'youtube';
    }

    function initYoutubeStream() {
        if (videoId) {
            console.log('init youtube');
            if (!window.YT) {
                var tag = document.createElement('script');
                tag.src = "//www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                initYoutubePlayer();
            }
            window.onYouTubeIframeAPIReady = function () {
                initYoutubePlayer();
            };
        } else {
            console.log("No data to init youtube");
        }
    }

    function videoYoutubazing() {
        HTMLMediaElement.prototype.playVideo = function () {
            this.play();
        };
        HTMLMediaElement.prototype.pauseVideo = function () {
            this.pause();
        };
        HTMLMediaElement.prototype.setVolume = function (volume) {
            this.volume = volume / 100;
        };
        HTMLMediaElement.prototype.getPlayerState = function () {
            return this.paused;
        };
    }

    function initCast() {
        console.log('init cast');
        getCurrentEvent();
        eventStatusInterval = setInterval(function () {
            getCurrentEvent();
        }, 10000);
        Y.on('getCurrentEvent', getCurrentEvent);
        castContainer = Y.one('#castDiv');
        videoId = castContainer.getAttribute('data-url').split('=')[1];
        shoutCastUrl = castContainer.getAttribute('data-alternative-url');
        var volumeIcon = sitePlayer.one('#volumeButton i');
        var volumeControl = sitePlayer.one('#volControl');
        castContainer.one('img') && castContainer.one('img').removeAttribute('data-load') && ImageLoader.load(castContainer.one('img'), {
            load: true,
            fill: true
        });
        sitePlayer.one('#playButton').on('click', function (e) {
            e.halt();
            var state = castPlayer.getPlayerState();
            if (playerType == 'youtube') {
                if (state === YT.PlayerState.PLAYING) {
                    castPlayer.pauseVideo();
                } else if (state === YT.PlayerState.PAUSED) {
                    castPlayer.playVideo();
                }
            } else {
                if (state) {
                    castPlayer.playVideo();
                } else {
                    castPlayer.pauseVideo();
                }
            }
        });
        videoYoutubazing();
        volumeIcon.on('click', function (e) {
            e.halt();
            if (e.currentTarget.hasClass('icono-volumeMute')) {
                castPlayer.setVolume(50);
                volumeControl.set('value', 50);
                volumeIcon._node.className = 'icono-volumeMedium';
            } else {
                castPlayer.setVolume(0);
                volumeControl.set('value', 0);
                volumeIcon._node.className = 'icono-volumeMute';
            }
        });
        volumeControl.on(['change', 'input'], function (e) {
            e.halt();
            var volume = e.currentTarget.get('value');
            if (volume > 55) {
                volumeIcon._node.className = 'icono-volumeHigh';
            } else if (volume < 55 && volume > 20) {
                volumeIcon._node.className = 'icono-volumeMedium';
            } else if (volume < 20 && volume > 0) {
                volumeIcon._node.className = 'icono-volumeLow';
            } else {
                volumeIcon._node.className = 'icono-volumeMute';
            }
            castPlayer.setVolume(volume);
        });
        if (videoId) {
            initYoutubeStream();
        } else if (shoutCastUrl) {
            initShoutCast();
        }
        else {
            console.log("No data to init");
        }
    }

    function initShoutCast() {
        console.log('shoutcast');
        playerType = 'shoutcast';
        castPlayer && castPlayer.destroy && castPlayer.destroy();
        Y.one('#castPlayer').remove();
        castPlayer = Y.Node.create('<video id="castPlayer" class="hidden" playsinline autoplay="1" name="media"><source src="' + shoutCastUrl + '" type="audio/mpeg"></video>');
        castContainer.append(castPlayer);
        castPlayer = castPlayer._node;
        castPlayer.addEventListener('canplaythrough', onPlayerReady);
        castPlayer.addEventListener('play', onPlayerStateChange);
        castPlayer.addEventListener('pause', onPlayerStateChange);
        castPlayer.addEventListener('error', onPlayerError);
        castPlayer.addEventListener('abort', onPlayerError);
        castPlayer.addEventListener('stalled', onPlayerError);
        castPlayer.addEventListener('suspend', onPlayerError);
        castPlayer.addEventListener('emptied', onPlayerError);
        shoutCastTimeout = setTimeout(function () {
            if (castPlayer.paused) {
                onPlayerError();
            }
        }, 7000);
    }

    function onPlayerError(event) {
        retry++;
        console.log(retry, playerType, shoutCastUrl, videoId);
        castContainer.removeClass('initialized');
        if (shoutCastTimeout) {
            clearTimeout(shoutCastTimeout);
            console.log('Shoutcast timeout reset')
        }
        if (shoutCastStatusInterval) {
            clearInterval(shoutCastStatusInterval);
            console.log('Shoutcast status reset')
        }
        /*if (eventStatusInterval) {
         clearInterval(eventStatusInterval);
         console.log('Event status reset')
         }*/
        if (retry <= maxRetry) {
            if (playerType == 'youtube' && videoId) {
                console.log('youtube failed');
                console.log('loading shoutcast');
                initShoutCast()
            } else if (playerType == 'shoutcast' && shoutCastUrl) {
                console.log('shoutcast failed');
                console.log('loading youtube');
                castPlayer.removeEventListener('canplaythrough', onPlayerReady);
                castPlayer.removeEventListener('play', onPlayerStateChange);
                castPlayer.removeEventListener('pause', onPlayerStateChange);
                castPlayer.removeEventListener('error', onPlayerError);
                castPlayer.removeEventListener('abort', onPlayerError);
                castPlayer.removeEventListener('stalled', onPlayerError);
                castPlayer.removeEventListener('suspend', onPlayerError);
                castPlayer.removeEventListener('emptied', onPlayerError);
                initYoutubeStream();
            }
            else {
                console.log('Seems no data to work now');
            }
        } else {
            console.log('Seems no one stream working');
        }
    }

    function onPlayerReady(event) {
        if (shoutCastTimeout) {
            clearTimeout(shoutCastTimeout);
            console.log('Shoutcast timeout reset');
            getShoutcastStatus();
            shoutCastStatusInterval = setInterval(function () {
                getShoutcastStatus();
            }, 10000);
        }
        console.log(playerType, 'playerReady');
        event.target.setVolume(50);
        event.target.playVideo();
        castContainer.addClass('initialized');
    }

    function onPlayerStateChange(event) {
        if (event.data) {
            if (event.data == YT.PlayerState.PLAYING) {
                sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
            } else if (event.data == YT.PlayerState.PAUSED) {
                sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
            }
        } else {
            if (!event.target.paused) {
                sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
            } else {
                sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
            }
        }
    }

    function getCollectionItems(collection_url) {
        return new Y.Promise(function (resolve) {
            var content_items = {past: [], upcoming: []};
            var offset = '';

            function getItems(collection_url, offset) {
                Y.Data.get({
                    url: collection_url + '?format=json',
                    data: {
                        view: 'list',
                        offset: offset || ''
                    },
                    success: function (items) {
                        if (items.past.length || items.upcoming.length) {
                            if (items.upcoming) {
                                content_items.upcoming = content_items.upcoming.concat(items.upcoming);
                            }
                            if (items.past) {
                                content_items.past = content_items.past.concat(items.past);
                            }
                            if (items.pagination && items.pagination.nextPage) {
                                getItems(collection_url, items.pagination.nextPage.toLowerCase());
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

    function getCurrentEvent() {
        var checkEvents = function () {
            var currentTime = new Date();
            var siteTimezoneOffset = Static.SQUARESPACE_CONTEXT.website.timeZoneOffset;
            var userTimezoneOffset = currentTime.getTimezoneOffset() * 60 * 1000;
            currentTime = currentTime.getTime();
            var eventOnAir = false;
            currentEvents.upcoming.forEach(function (event) {
                if (currentTime >= new Date(event.startDate + siteTimezoneOffset + userTimezoneOffset).getTime() && currentTime <= new Date(event.endDate + siteTimezoneOffset + userTimezoneOffset).getTime()) {
                    eventOnAir = event;
                    console.log(event.title);
                }
            });
            if (eventOnAir) {
                trackName.one('span').set('text', eventOnAir.title);
                trackName.addClass('scroll-track');
                if (Y.one('.event-item-' + eventOnAir.id)) {
                    Y.all('.event-item-' + eventOnAir.id).addClass('event-on-air');
                }
            } else {
                trackName.one('span').set('text', '');
                trackName.removeClass('scroll-track');
                console.log('no current event');
                if (Y.one('.event-on-air')) {
                    Y.all('.event-on-air').removeClass('event-on-air');
                }
            }
        };
        if (!currentEvents) {
            getCollectionItems('/events').then(function (events) {
                if (events && events.upcoming) {
                    currentEvents = events;
                    checkEvents();
                }
            })
        } else {
            checkEvents();
        }
    }

    function getShoutcastStatus() {
        Y.io('https://uploader.squarespacewebsites.com/20ft-radio-status.php', {
            on: {
                success: function (i, data) {
                    if (data.status == 200 && data.readyState == 4) {
                        var status_html = Y.Node.create(data.responseText);
                        var current_song = status_html.one('table[cellpadding=2] tr:last-child').get('text');
                        console.log(current_song);
                        if (trackName.get('text') !== current_song) {
                            trackName.one('span').set('text', current_song);
                            trackName.removeClass('scroll-track').addClass('scroll-track');
                        }
                    }
                },
                failure: function () {
                    //err, 401
                }
            }
        });
    }

    initialize();

    return {
        sync: function () {
            initialize();
        },
        destroy: function () {
            console.log('destroy cast');
            Y.one(window).detach('resize', refreshImages);
        }
    };
};