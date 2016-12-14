window.Template.Controllers.CastController = function (element) {
    'use strict';
    var castPlayer,
        sitePlayer = Y.one('.site-player'),
        trackName = sitePlayer.one('.track-name'),
        videoId,
        shoutCastUrl,
        soundCloudUrl,
        retry = 0,
        maxRetry = 5,
        playerType = 'youtube',
        checkingTime = 2000,
        streamCheckInterval,
        youtubePlayer = null,
        shoutcastPlayer = null,
        soundCloudPlayer = null,
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
        }
    }

    function refreshImages() {
        castContainer.all('img').each(function (img) {
            img.removeAttribute('data-load');
            ImageLoader.load(img, {load: true});
        });
    }

    function initYoutubePlayer() {
        if (videoId.indexOf('watch') > -1) {
            videoId = videoId.split('=')[1];
        } else if (videoId.indexOf('live_stream') > -1) {
            var channel = videoId.split('channel=')[1];
            videoId = 'live_stream';
            console.log(videoId, channel)
        }
        playerType = 'youtube';
        youtubePlayer = new YT.Player('youtubePlayer', {
            height: '720',
            width: '1280',
            videoId: videoId,
            playerVars: {
                'autoplay': 1,
                'controls': 1,
                'modestbranding': 1,
                'rel': 0,
                'showinfo': 1,
                'channel': channel || '',
                'fs': 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange,
                'onError': onPlayerError
            }
        });
    }

    function initYoutubeStream() {
        if (videoId) {
            console.log('init youtube');
            if (!castContainer.one('#youtubePlayer')) {
                castContainer.prepend('<div id="youtubePlayer" class="stream-player"></div>');
            }
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
            onPlayerError();
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
        HTMLMediaElement.prototype.mute = function () {
            this.muted = true;
        };
        HTMLMediaElement.prototype.unMute = function () {
            this.muted = false;
        };
        HTMLMediaElement.prototype.getPlayerState = function () {
            return this.paused;
        };
    }

    function initCast() {
        console.log('init cast');
        Y.one('#castDiv').addClass('initialized');
        getCurrentEvent();
        if (eventStatusInterval) {
            clearInterval(eventStatusInterval);
            console.log('Event status reset');
            eventStatusInterval = null;
        }
        eventStatusInterval = setInterval(function () {
            getCurrentEvent();
        }, 10000);
        Y.on('getCurrentEvent', getCurrentEvent);
        castContainer = Y.one('#castDiv');
        videoId = castContainer.getAttribute('data-url');
        shoutCastUrl = castContainer.getAttribute('data-alternative-url');
        soundCloudUrl = castContainer.getAttribute('data-soundcloud-url');
        var volumeIcon = sitePlayer.one('#volumeButton i');
        var volumeControl = sitePlayer.one('#volControl');
        castContainer.one('img') && castContainer.one('img').removeAttribute('data-load') && ImageLoader.load(castContainer.one('img'), {
            load: true,
            fill: true
        });
        sitePlayer.one('#playButton').on('click', function (e) {
            e.halt();
            var state = null;
            if (playerType == 'youtube') {
                state = youtubePlayer.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    youtubePlayer.pauseVideo();
                } else if (state === YT.PlayerState.PAUSED) {
                    youtubePlayer.playVideo();
                }
            } else if (playerType == 'shoutcast') {
                state = castPlayer.getPlayerState();
                if (state) {
                    shoutcastPlayer.playVideo();
                } else {
                    shoutcastPlayer.pauseVideo();
                }
            } else {
                castPlayer.isPaused(function (state) {
                    if (state) {
                        castPlayer.play();
                    } else {
                        castPlayer.pause();
                    }
                })
            }
        });
        videoYoutubazing();
        volumeIcon.on('click', function (e) {
            e.halt();
            if (castContainer.get('offsetWidth') < 430) {
                sitePlayer.toggleClass('volume-range-visible');
            } else {
                if (e.currentTarget.hasClass('icono-volumeMute')) {
                    castPlayer.setVolume(50);
                    volumeControl.set('value', 50);
                    volumeIcon._node.className = 'icono-volumeMedium';
                } else {
                    castPlayer.setVolume(0);
                    volumeControl.set('value', 0);
                    volumeIcon._node.className = 'icono-volumeMute';
                }
            }
        });
        volumeControl.on(['change', 'input'], function (e) {
            e.halt();
            var volume = parseInt(e.currentTarget.get('value'));
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
        } else if (soundCloudUrl) {
            initSoundCloud();
        } else {
            console.log("No data to init");
        }
        if (videoId || shoutCastUrl || soundCloudUrl){
            streamCheckInterval = setInterval(function () {
                checkStreams();
            }, checkingTime);
        }
    }

    function checkStreams() {
        if (youtubePlayer){
            var state = youtubePlayer.getPlayerState && youtubePlayer.getPlayerState();
            if (youtubePlayer.getDuration && youtubePlayer.getDuration()){
                if(state > 1){
                    youtubePlayer.playVideo();
                    if(state == 3){
                        youtubePlayer.mute();
                        console.log('mute while buffer');
                    }
                } else {
                    console.log('unmute and play');
                    youtubePlayer.unMute();
                }
            } else {
                youtubePlayer.mute();
                console.log('mute while no youtube data');
                if(shoutcastPlayer){
                    shoutcastPlayer.play();
                    shoutcastPlayer.unMute();
                    if (soundCloudPlayer){
                        soundCloudPlayer.pause();
                        soundCloudPlayer.setVolume(0);
                    }
                } else {
                    initShoutCast();
                }
                if(soundCloudPlayer){
                    soundCloudPlayer.play();
                    soundCloudPlayer.setVolume(50);
                    if (shoutcastPlayer){
                        shoutcastPlayer.pause();
                        shoutcastPlayer.setVolume(0);
                    }
                } else {
                    initSoundCloud();
                }
            }
            console.log(state, YT.PlayerState.PLAYING, YT.PlayerState.PAUSED, youtubePlayer.getDuration());
        }
        if (shoutcastPlayer){
            state = shoutcastPlayer.getPlayerState && shoutcastPlayer.getPlayerState();
            console.log(state, shoutcastPlayer.duration, shoutcastPlayer.error, shoutcastPlayer.networkState, shoutcastPlayer.progress);
            if (shoutcastPlayer.duration !== 'NaN' && state && shoutcastPlayer.networkState<3){
                if(youtubePlayer && youtubePlayer.getPlayerState() !== 1){
                    shoutcastPlayer.play();
                } else {
                    shoutcastPlayer.play();
                }
            } else {
                if(youtubePlayer){
                    youtubePlayer.playVideo();
                    youtubePlayer.unMute();
                } else {
                    initYoutubePlayer();
                }
            }
        }

        /*if (state === YT.PlayerState.PLAYING) {
         youtubePlayer.pauseVideo();
         } else if (state === YT.PlayerState.PAUSED) {
         onPlayerError()
         }*/
    }

    function initSoundCloud() {
        if (soundCloudUrl){
            console.log('soundcloud');
            playerType = 'soundcloud';
            if (soundCloudPlayer){
                soundCloudPlayer.play();
            } else {
                soundCloudPlayer = Y.Node.create('<iframe id="soundCloudPlayer" src="https://w.soundcloud.com/player/?url=' + soundCloudUrl + '&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&visual=false" class="soundcloud-stream"></iframe>');
                castContainer.append(soundCloudPlayer);
                soundCloudPlayer = soundCloudPlayer._node;
                soundCloudPlayer = SC.Widget(soundCloudPlayer);
                soundCloudPlayer.bind(SC.Widget.Events.READY, onPlayerReady);
                soundCloudPlayer.bind(SC.Widget.Events.PLAY, onPlayerStateChange);
                soundCloudPlayer.bind(SC.Widget.Events.PAUSE, onPlayerStateChange);
                soundCloudPlayer.bind(SC.Widget.Events.FINISH, onPlayerError);
            }
        } else {
            console.log('no SoundCloud url')
        }
    }

    function initShoutCast() {
        console.log('shoutcast');
        shoutcastPlayer = Y.one('#shoutcastPlayer') || null;
        if (!shoutcastPlayer){
            shoutcastPlayer = Y.Node.create('<audio id="shoutcastPlayer" class="hidden" playsinline autoplay="0" name="media"><source src="' + shoutCastUrl + '" type="audio/mpeg"></audio>');
        }
        castContainer.append(shoutcastPlayer);
        shoutcastPlayer = shoutcastPlayer._node;
        shoutcastPlayer.addEventListener('canplaythrough', onPlayerReady);
        shoutcastPlayer.addEventListener('play', onPlayerStateChange);
        shoutcastPlayer.addEventListener('pause', onPlayerStateChange);
        shoutcastPlayer.addEventListener('error', onPlayerError);
        shoutcastPlayer.addEventListener('abort', onPlayerError);
        shoutcastPlayer.addEventListener('stalled', onPlayerError);
        shoutcastPlayer.addEventListener('suspend', onPlayerError);
        shoutcastPlayer.addEventListener('emptied', onPlayerError);
    }

    function onPlayerError(event) {
        retry++;
        var castType = '';
        if (event){
            if(event.data || event.target && event.target.shoutcastPlayer){
                castType = 'youtube';
            } else if(1){

            }
        }
        console.log('Cast Type = '+castType);
        console.log(retry, playerType, event);
        castContainer.removeClass('initialized');
        if (retry < maxRetry) {
            if (playerType == 'youtube' && videoId) {
                console.log('youtube failed');
                console.log('loading shoutcast');
                if(shoutcastPlayer){
                    shoutcastPlayer.load()
                } else {
                    initShoutCast();   
                }
            } else if (playerType == 'shoutcast' && shoutCastUrl) {
                console.log('shoutcast failed');
                console.log('loading youtube');
                if (youtubePlayer){
                    youtubePlayer.playVideo();
                } else {
                    initYoutubeStream();   
                }
            }
            else {
                console.log('Seems no data to work now');
            }
        } else if (retry == maxRetry) {
            if (soundCloudUrl) {
                console.log('Trying soundcloud');
                initSoundCloud();
            }
        } else {
            console.log('Seems no one stream working');
        }
    }

    function onPlayerReady(event) {
        if (playerType == 'youtube'){
            youtubePlayer.setVolume(50);
            youtubePlayer.playVideo();
            castContainer.addClass('initialized');
        }
        console.log(playerType, 'playerReady');
    }

    function onPlayerStateChange(event) {
        if (event.data) {
            if (event.data == YT.PlayerState.PLAYING) {
                sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
            } else if (event.data == YT.PlayerState.PAUSED) {
                sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
            }
        } else if (event.target) {
            if (!event.target.paused) {
                sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
            } else {
                sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
            }
        } else if (playerType == 'soundcloud') {
            soundCloudPlayer.isPaused(function (paused) {
                console.log(paused);
                if (!paused) {
                    sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                    !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
                } else {
                    sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
                }
            })
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
            Y.detach('getCurrentEvent', getCurrentEvent);
        }
    };
};