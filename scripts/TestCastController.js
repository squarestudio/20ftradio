window.Template.Controllers.TestCastController = function (element) {
    'use strict';
    /*    console.log = function () {
     return false
     }*/
    var castPlayer,
        sitePlayer = Y.one('.site-player'),
        trackName = sitePlayer.one('.track-name'),
        videoId,
        shoutCastUrl,
        soundCloudUrl,
        retry = 0,
        maxRetry = 5,
        notYoutube = false,
        youtubeReady = false,
        notShoutcast = false,
        notSoundcloud = false,
        mobile,
        mobilePlayButton,
        userClickPlay = false,
        userPaused,
        players = {},
        activePlayer = false,
        checkingTime = 2000,
        streamCheckInterval,
        fbPlayer = null,
        fbReady = false,
        youtubePlayer = null,
        shoutcastPlayer = null,
        soundCloudPlayer = null,
        eventStatusInterval,
        currentEvents,
        castContainer = Y.one('#castDiv');

    function initialize() {
        if (Y.one('#castDiv') && !Y.one('#castDiv').hasClass('initialized')) {
            mobile = Y.UA.mobile;
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

    function initFBPlayer() {
        window.fbAsyncInit = function () {
            FB.init({
                //appId      : '{your-app-id}',
                xfbml: true,
                version: 'v2.6'
            });
            console.log('FB init')
            FB.Event.subscribe('xfbml.ready', function (msg) {
                if (msg.type === 'video' && msg.id === 'fbPlayer') {
                    fbPlayer = msg.instance;
                    console.log(msg);
                    fbPlayer.subscribe('startedPlaying', function () {
                        onPlayerStateChange('facebook', 'play');
                    });
                    fbPlayer.subscribe('paused', function () {
                        onPlayerStateChange('facebook', 'pause');
                    });
                    fbPlayer.subscribe('error', onFBError);
                    players['facebook'] = fbPlayer;
                    onPlayerReady('facebook');
                }
            });
            FB.XFBML.parse(castContainer._node);
        };
        fbPlayer = Y.one('#fbPlayer') || null;
        if (!fbPlayer) {
            fbPlayer = Y.Node.create('<div id="fbPlayer" data-height="' + castContainer.get('offsetHeight') + '" class="fb-video stream-player" data-allowfullscreen="false" data-href="' + videoId + '"></div>');
        }
        castContainer.prepend(fbPlayer);
        if (!window.FB) {
            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s);
                js.id = id;
                js.src = "//connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.6";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        }
    }

    function initYoutubePlayer() {
        if (videoId.indexOf('watch') > -1) {
            videoId = videoId.split('=')[1];
        } else if (videoId.indexOf('live_stream') > -1) {
            var channel = videoId.split('channel=')[1];
            videoId = 'live_stream';
            console.log(videoId, channel)
        }
        youtubePlayer = new YT.Player('youtubePlayer', {
            height: '720',
            width: '1280',
            videoId: videoId,
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'modestbranding': 0,
                'rel': 0,
                'showinfo': 0,
                'channel': channel || '',
                'playsinline': 1,
                'fs': 0
            },
            events: {
                'onReady': function () {
                    onPlayerReady('youtube')
                },
                'onStateChange': function (e) {
                    onPlayerStateChange('youtube', e.data)
                },
                'onError': onYoutubeError
            }
        });
        players['youtube'] = youtubePlayer;
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
            onYoutubeError();
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
        mobilePlayButton = castContainer.one('.mobile-play-button');
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
            activePlayer = activePlayer || 'youtube';
            if (activePlayer == 'youtube') {
                state = youtubePlayer.getPlayerState();
                console.log('youtube video', state)
                if (state === YT.PlayerState.PLAYING) {
                    youtubePlayer.pauseVideo();
                    userPaused = true;
                } else if (state === YT.PlayerState.PAUSED) {
                    youtubePlayer.playVideo();
                    userPaused = false;
                } else {
                    youtubePlayer.playVideo();
                    userPaused = false;
                }
                mobile && checkStreams();
            } else if (activePlayer == 'shoutcast') {
                state = shoutcastPlayer.getPlayerState();
                if (mobile && !userClickPlay) {
                    shoutcastPlayer.playVideo();
                    userPaused = false;
                    userClickPlay = true;
                }
                if (state) {
                    shoutcastPlayer.playVideo();
                    userPaused = false;
                } else {
                    shoutcastPlayer.pauseVideo();
                    userPaused = true;
                }
                mobile && checkStreams();
            } else if (activePlayer == 'soundcloud') {
                if (mobile && !userClickPlay) {
                    soundCloudPlayer.play();
                    userPaused = false;
                    userClickPlay = true;
                    checkStreams();
                } else {
                    soundCloudPlayer.isPaused(function (state) {
                        if (state) {
                            soundCloudPlayer.play();
                            userPaused = false;
                        } else {
                            soundCloudPlayer.pause();
                            userPaused = true;
                        }
                        mobile && checkStreams();
                    });
                }
            }
            userClickPlay = true;
        });
        mobilePlayButton.on('click', function () {
            sitePlayer.one('#playButton').simulate('click')
        });
        videoYoutubazing();
        volumeIcon.on('click', function (e) {
            e.halt();
            if (castContainer.get('offsetWidth') < 430) {
                sitePlayer.toggleClass('volume-range-visible');
            } else {
                console.log('volume' + activePlayer);
                if (e.currentTarget.hasClass('icono-volumeMute')) {
                    if (activePlayer) {
                        if (activePlayer == 'soundcloud') {
                            players[activePlayer].setVolume(0.5);
                        } else {
                            players[activePlayer].setVolume(50);
                        }
                        volumeControl.set('value', 50);
                        volumeIcon._node.className = 'icono-volumeMedium';
                    }
                } else {
                    if (activePlayer) {
                        players[activePlayer].setVolume(0);
                        volumeControl.set('value', 0);
                        volumeIcon._node.className = 'icono-volumeMute';
                    }
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
            if (activePlayer) {
                if (activePlayer == 'soundcloud') {
                    players[activePlayer].setVolume(volume / 100);
                } else {
                    players[activePlayer].setVolume(volume);
                }
            }
        });
        if (!mobile) {
            if (videoId) {
                if (videoId.indexOf('facebook') > -1) {
                    initFBPlayer();
                } else if (videoId.indexOf('youtube')) {
                    initYoutubeStream();
                }
            } else if (shoutCastUrl) {
                initShoutCast();
            } else if (soundCloudUrl) {
                initSoundCloud();
            } else {
                console.log("No data to init");
            }
        }
        if (mobile) {
            if (videoId) {
                if (videoId.indexOf('facebook') > -1) {
                    initFBPlayer();
                } else if (videoId.indexOf('youtube')) {
                    initYoutubeStream();
                }
            }
            if (shoutCastUrl) {
                initShoutCast();
            }
            if (soundCloudUrl) {
                initSoundCloud();
            }
        }
        if (videoId || shoutCastUrl || soundCloudUrl) {
            if (!mobile) {
                /*                streamCheckInterval = setInterval(function () {
                 checkStreams();
                 }, checkingTime);
                 console.log('stream check interval set')*/
            }
        }
    }

    function pausePlayersExept(playerType) {
        playerType = playerType || false;
        for (var player in players) {
            if (players.hasOwnProperty(player) && player !== playerType) {
                console.log(player + ': Paused');
                if (players[player].pauseVideo) {
                    players[player].pauseVideo()
                } else if (players[player].pause) {
                    if (player == 'soundcloud') {
                        players[player].isPaused(function (paused) {
                            if (!paused) {
                                soundCloudPlayer.pause()
                            }
                        });
                    }
                }
            }
        }
    }

    function checkStreams() {
        retry++;
        console.log('Retries: ' + retry);
        if (!userPaused) {
            console.log("ACTIVE PLAYER = " + activePlayer);
            if (retry < maxRetry) {
                console.log('until less than maxRetry, trying load youtube')
            }
            if (youtubePlayer && !notYoutube && !fbPlayer) {
                var state = youtubePlayer.getPlayerState && youtubePlayer.getPlayerState();
                if (youtubePlayer.getDuration && youtubePlayer.getDuration()) {
                    if (mobile) {
                        notSoundcloud = true;
                    }
                    console.log('may play youtube');
                    if (state > 1) {//paused or buffering
                        youtubePlayer.playVideo();
                        pausePlayersExept('youtube');
                        onPlayerStateChange('youtube');
                        if (state == 3 && retry < 6) {//buffering
                            console.log('youtube buffering', retry);
                            if (retry > 5) {
                                activePlayer = false;
                                if (mobile) {
                                    notYoutube = true;
                                }
                                checkStreams()
                                console.log('need try another players')
                            }
                        }
                    } else {
                        console.log('try to play youtube');
                        if (youtubePlayer.getPlayerState() == 1) {
                            youtubePlayer.playVideo();
                            pausePlayersExept('youtube');
                            onPlayerStateChange('youtube');
                        }
                        retry = 0;
                        if (state == -1) {
                            activePlayer = false;
                            retry = 5;
                            if (mobile) {
                                notYoutube = true;
                                checkStreams();
                            }
                        }
                    }
                } else {//no duration
                    youtubePlayer.playVideo();
                    console.log('no youtube data', retry);
                    setActivePlayer();
                    if (mobile && retry > 2) {
                        retry = 5;
                        notYoutube = true;
                        activePlayer = false;
                        checkStreams();
                        return false;
                    } else {
                        if (retry < 2 || retry == 2) {
                            activePlayer = 'youtube';
                        } else {
                            activePlayer = false;
                        }
                    }
                }
                console.log(state, YT.PlayerState.PLAYING, YT.PlayerState.PAUSED, youtubePlayer.getDuration());
            }
            if (fbPlayer && !youtubePlayer) {
                var state = fb.getPlayerState && fb.getPlayerState();
                if (fbPlayer.getDuration && fbPlayer.getDuration()) {
                    
                }
            }
            console.log("ACTIVE PLAYER = " + activePlayer);
            if (retry > 4 || notYoutube) {
                console.log('try another players', notShoutcast, notSoundcloud);
                if (!activePlayer) {
                    if (shoutcastPlayer && !notShoutcast) {
                        state = shoutcastPlayer.getPlayerState && shoutcastPlayer.getPlayerState();
                        console.log(state, shoutcastPlayer.duration, shoutcastPlayer.duration.toString() == 'NaN', shoutcastPlayer.networkState);
                        if (shoutcastPlayer.duration.toString() !== 'NaN' && shoutcastPlayer.networkState && shoutcastPlayer.networkState < 3 && shoutcastPlayer.networkState !== 1) {
                            shoutcastPlayer.play();
                            activePlayer = 'shoutcast';
                            pausePlayersExept('shoutcast');
                            onPlayerStateChange('shoutcast');
                            if (mobile) {
                                notSoundcloud = true;
                            }
                        } else {
                            shoutcastPlayer.load();
                            activePlayer = false;
                            if (mobile) {
                                notShoutcast = true;
                                checkStreams();
                            }
                        }
                    } else {
                        initShoutCast();
                    }
                }
                console.log("ACTIVE PLAYER = " + activePlayer);
                if (!activePlayer) {
                    if (soundCloudPlayer && !notSoundcloud) {
                        soundCloudPlayer.isPaused(function (paused) {
                            if (paused) {
                                soundCloudPlayer.play();
                                activePlayer = 'soundcloud';
                                onPlayerStateChange('soundcloud');
                            }
                        });
                        pausePlayersExept('soundcloud');
                        activePlayer = 'soundcloud';
                    } else {
                        initSoundCloud();
                    }
                }
                console.log("ACTIVE PLAYER = " + activePlayer);
            }
            //youtubeReady && setActivePlayer(activePlayer);
        }
    }

    function setActivePlayer(active) {
        if (active == 'youtube') {
            castContainer.addClass(active);
            castContainer.one('#youtubePlayer') && castContainer.one('#youtubePlayer').addClass('active-player');
            castContainer.one('#shoutcastPlayer') && castContainer.one('#shoutcastPlayer').removeClass('active-player');
            castContainer.one('#soundcloudPlayer') && castContainer.one('#soundcloudPlayer').removeClass('active-player');
        } else if (active == 'facebook') {
            castContainer.addClass(active);
            castContainer.one('#fbPlayer') && castContainer.one('#fbPlayer').addClass('active-player');
            castContainer.one('#youtubePlayer') && castContainer.one('#youtubePlayer').removeClass('active-player');
            castContainer.one('#shoutcastPlayer') && castContainer.one('#shoutcastPlayer').removeClass('active-player');
            castContainer.one('#soundcloudPlayer') && castContainer.one('#soundcloudPlayer').removeClass('active-player');
        }
        else {
            castContainer.removeClass('youtube').removeClass('facebook').addClass(active);
            castContainer.one('#youtubePlayer') && castContainer.one('#youtubePlayer').removeClass('active-player');
            castContainer.one('#fbPlayer') && castContainer.one('#fbPlayer').removeClass('active-player');
        }
    }

    function initSoundCloud() {
        if (soundCloudUrl) {
            console.log('soundcloud loading');
            if (soundCloudPlayer) {
                soundCloudPlayer.play();
            } else {
                soundCloudPlayer = Y.Node.create('<iframe id="soundCloudPlayer" src="https://w.soundcloud.com/player/?url=' + soundCloudUrl + '&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&visual=false" class="soundcloud-stream"></iframe>');
                castContainer.append(soundCloudPlayer);
                soundCloudPlayer = soundCloudPlayer._node;
                soundCloudPlayer = SC.Widget(soundCloudPlayer);
                soundCloudPlayer.bind(SC.Widget.Events.READY, function () {
                    onPlayerReady('soundcloud')
                });
                soundCloudPlayer.bind(SC.Widget.Events.PLAY, function () {
                    onPlayerStateChange('soundcloud', 'play')
                });
                soundCloudPlayer.bind(SC.Widget.Events.PAUSE, function () {
                    onPlayerStateChange('soundcloud', 'pause')
                });
                soundCloudPlayer.bind(SC.Widget.Events.FINISH, onSoundCloudError());
                players['soundcloud'] = soundCloudPlayer;
            }
        } else {
            console.log('no SoundCloud url')
        }
    }

    function initShoutCast() {
        console.log('shoutcast starting');
        shoutcastPlayer = Y.one('#shoutcastPlayer') || null;
        if (!shoutcastPlayer) {
            shoutcastPlayer = Y.Node.create('<audio id="shoutcastPlayer" class="hidden" preload playsinline autoplay="0" name="media"><source src="' + shoutCastUrl + '" type="audio/mpeg"></audio>');
        }
        castContainer.append(shoutcastPlayer);
        shoutcastPlayer = shoutcastPlayer._node;
        shoutcastPlayer.addEventListener('canplaythrough', function () {
            onPlayerReady('shoutcast');
        });
        shoutcastPlayer.addEventListener('play', function () {
            onPlayerStateChange('shoutcast', 'play')
        });
        shoutcastPlayer.addEventListener('pause', function () {
            onPlayerStateChange('shoutcast', 'pause')
        });
        shoutcastPlayer.addEventListener('error', onShoutCastError);
        shoutcastPlayer.addEventListener('abort', onShoutCastError);
        shoutcastPlayer.addEventListener('stalled', onShoutCastError);
        shoutcastPlayer.addEventListener('suspend', onShoutCastError);
        shoutcastPlayer.addEventListener('emptied', onShoutCastError);
        players['shoutcast'] = shoutcastPlayer;
    }

    function onFBError(e) {
        console.log('FB failed - ', e);
    }

    function onShoutCastError(e) {
        console.log('shoutcast failed');
        if (mobile) {
            notShoutcast = true;
            retry = 5;
            checkStreams();
        }
    }

    function onSoundCloudError(e) {
        console.log('soundcloud error')
    }

    function onYoutubeError(event) {
        console.log('youtube error');
        if (mobile) {
            notYoutube = true;
            retry = 5;
            checkStreams();
        }
    }

    function onPlayerReady(playerType) {
        if (playerType == 'youtube') {
            youtubePlayer.setVolume(50);
            youtubePlayer.playVideo();
            youtubeReady = true;
            pausePlayersExept('youtube');
        } else if (playerType == 'facebook') {
            fbPlayer.setVolume(50);
            fbPlayer.play();
            fbReady = true;
            pausePlayersExept('facebook');
        }
        else if (playerType == 'shoutcast' && youtubeReady) {
            shoutcastPlayer.play();
            shoutcastPlayer.setVolume(50);
            setActivePlayer();
        } else if (playerType == 'soundcloud' && youtubeReady) {
            soundCloudPlayer.play();
            soundCloudPlayer.setVolume(0.5);
            setActivePlayer();
        }
        if (youtubeReady) {
            !castContainer.hasClass && castContainer.addClass('initialized');//checkStreams
            if (!streamCheckInterval) {
                streamCheckInterval = setInterval(function () {
                    checkStreams();
                }, checkingTime);
                console.log('stream check interval set')
            }
        }
        console.log(playerType, 'playerReady');
    }

    function onPlayerStateChange(playerType, state) {
        if (mobile && !userClickPlay) return;
        if (playerType == 'youtube') {
            console.log('youtube player change', state);
            if (youtubePlayer && state) {
                if (state == YT.PlayerState.PLAYING) {
                    sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                    !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
                    setActivePlayer('youtube');
                    pausePlayersExept(playerType);
                } else if (state == YT.PlayerState.PAUSED) {
                    sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
                }
            }
        } else if (playerType == 'shoutcast') {
            if (!shoutcastPlayer.paused) {
                sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
                setActivePlayer('shoutcast');
                pausePlayersExept(playerType);
            } else {
                sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
            }
        } else if (playerType == 'soundcloud') {
            soundCloudPlayer.isPaused(function (paused) {
                if (!paused) {
                    sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                    !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
                    setActivePlayer('soundcloud');
                    pausePlayersExept(playerType);
                } else {
                    sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
                }
            });
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