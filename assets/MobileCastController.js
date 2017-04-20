window.Template.Controllers.MobileCastController = function (element) {
    'use strict';
    var dontCheck = false;
    //console.log = function () {};
    var sitePlayer = Y.one('.site-player'),
        trackName = sitePlayer.one('.track-name'),
        youtubeUrl,
        facebookUrl,
        shoutCastUrl,
        someCloudUrl,
        retry = 0,
        maxRetry = 3,
        youtubeRetry = 0,
        youtubeStatus = false,
        youtubeStatusLoad = false,
        youtubeCheckInterval,
        notYoutube = false,
        youtubeReady = false,
        fbReady = false,
        shoutCastReady = false,
        shoutcastStatus = false,
        shoutcastStatusCheckInterval,
        notShoutcast = false,
        notSoundCloud = false,
        notMixCloud = false,
        preventLoops = 0,
        lastCheckTime,
        mobile,
        mobilePlayButton,
        userClickPlay = false,
        userPaused = false,
        players = {},
        activePlayer = false,
        checkingTime = 2000,
        streamCheckInterval = false,
        youtubePlayer = null,
        fbPlayer = null,
        shoutcastPlayer = null,
        soundCloudPlayer = null,
        soundCloudReady = false,
        mixCloudPlayer = null,
        mixCloudReady = false,
        eventStatusInterval,
        currentEvents,
        liveIndicator,
        localNotification = false,
        useNotifications = true,
        castContainer = Y.one('#castDiv');
    var DEBUG = false;
    var youtubeStatusFactor = false, shoutcastStatusFactor = false;
    var autoplay = false;
    var mobileImage;

    function initialize() {
        if (Y.one('#castDiv') && !Y.one('#castDiv').hasClass('initialized')) {
            mobile = Y.UA.mobile;
            Site && Site._setupPositioning();
            setTimeout(function () {
                Site && Site._setupPositioning();
            }, 50);
            setTimeout(function () {
                initCast();
            }, 100);
            Y.one(window).on('resize', refreshImages);
            if (window.self !== window.top) {
                window.top.Y.one('.sqs-preview-frame-content').addClass('content-loaded');
            }

        }
    }

    function simulateResize() {
        window.top.innerWidth = window.top.innerWidth - 1;
        Y.one(window.top).simulate('resize');
        window.top.innerWidth = window.top.innerWidth + 1;
    }

    function refreshImages() {
        if (Y.one('#fbPlayer')) {
            Y.one('#fbPlayer').setAttribute('data-width', castContainer.get('offsetWidth'));
            Y.one('#fbPlayer').setAttribute('data-height', castContainer.get('offsetHeight'));
        }
        castContainer.all('img').each(function (img) {
            img.removeAttribute('data-load');
            ImageLoader.load(img, {load: true});
        });
        checkTrackNameOverflow();
    }

    function initYoutubePlayer() {
        if (youtubeUrl.indexOf('watch') > -1) {
            youtubeUrl = youtubeUrl.split('=')[1];
            youtubeStatus = youtubeStatusLoad = true;
        } else if (youtubeUrl.indexOf('live_stream') > -1) {
            var channel = youtubeUrl.split('channel=')[1];
            youtubeUrl = 'live_stream';
        }
        console.log(youtubeUrl, channel);
        youtubePlayer = new YT.Player('youtubePlayer', {
            height: '720',
            width: '1280',
            videoId: youtubeUrl,
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
        if (youtubeUrl) {
            console.log('init youtube');
            if (!castContainer.one('#youtubePlayer')) {
                castContainer.prepend('<div id="youtubePlayer" class="stream-player"></div>');
            }
            if (!window.YT) {
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                console.log('YOUTUBE API ADDED')
            } else {
                initYoutubePlayer();
            }
            window.onYouTubeIframeAPIReady = function () {
                console.log('YOUTUBE API READY');
                initYoutubePlayer();
            };
        } else {
            console.log("No data to init youtube");
            notYoutube = true;
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
        mobilePlayButton = castContainer.one('.mobile-trigger');
        mobileImage = castContainer.one('.mobile-image');
        castContainer = Y.one('#castDiv');
        sitePlayer = Y.one('.site-player');
        liveIndicator = castContainer.one('.live-indicator');
        youtubeUrl = castContainer.getAttribute('data-url');
        facebookUrl = castContainer.getAttribute('data-facebook-url');
        shoutCastUrl = castContainer.getAttribute('data-shoutcast-url');
        someCloudUrl = castContainer.getAttribute('data-soundcloud-url');
        var volumeIcon = sitePlayer.one('#volumeButton i');
        var volumeControl = sitePlayer.one('#volControl');
        var playButtonClick = function (e) {
            e.halt();
            console.log(activePlayer, players);
            if (!activePlayer) return;
            var state = null;
            if (activePlayer == 'youtube') {
                state = youtubePlayer.getPlayerState();
                console.log('youtube video', state, YT.PlayerState.PLAYING);
                if (mobile && !userClickPlay) {
                    youtubePlayer.playVideo();
                    userPaused = false;
                    checkStreams();
                }
                else if (state === YT.PlayerState.PLAYING) {
                    youtubePlayer.pauseVideo();
                    userPaused = true;
                } else if (state === YT.PlayerState.PAUSED) {
                    youtubePlayer.playVideo();
                    userPaused = false;
                } else {
                    youtubePlayer.playVideo();
                    userPaused = false;
                }
            }
            else if (activePlayer == 'facebook') {
                if (castContainer.hasClass('paused')) {
                    fbPlayer.play();
                    userPaused = false;
                } else {
                    fbPlayer.pause();
                    userPaused = true;
                }
            }
            else if (activePlayer == 'shoutcast') {
                state = shoutcastPlayer.getPlayerState();
                if (mobile && !userClickPlay) {
                    shoutcastPlayer.playVideo();
                    userPaused = false;
                }
                else if (state) {
                    shoutcastPlayer.playVideo();
                    userPaused = false;
                } else {
                    shoutcastPlayer.pauseVideo();
                    userPaused = true;
                }
            }
            else if (activePlayer == 'soundcloud') {
                if (mobile && !userClickPlay) {
                    soundCloudPlayer.play();
                    userPaused = false;
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
                    });
                }
            }
            else if (activePlayer == 'mixcloud') {
                if (mobile && !userClickPlay) {
                    mixCloudPlayer.play();
                    userPaused = false;
                    checkStreams();
                } else {
                    mixCloudPlayer.getIsPaused().then(function (state) {
                        if (state) {
                            mixCloudPlayer.play();
                            userPaused = false;
                        } else {
                            mixCloudPlayer.pause();
                            userPaused = true;
                        }
                    });
                }
            }
            mobile && activePlayer !== 'facebook' && checkStreams();
            userClickPlay = true;
        };
        castContainer.one('img') && castContainer.one('img').removeAttribute('data-load') && ImageLoader.load(castContainer.one('img'), {
            load: true,
            fill: true
        });
        sitePlayer.one('#playButton').on('click', playButtonClick);
        mobilePlayButton.on('click', playButtonClick);
        Y.one('.video-toggle') && Y.one('.video-toggle').on('click', function (e) {
            e.halt();
            e.currentTarget.toggleClass('active');
            Y.one('body').toggleClass('show-current-player');
        });
        videoYoutubazing();
        volumeIcon.on('click', function (e) {
            e.halt();
            if (castContainer.get('offsetWidth') < 430) {
                sitePlayer.toggleClass('volume-range-visible');
            } else {
                console.log('volume - ' + activePlayer);
                if (e.currentTarget.hasClass('icono-volumeMute')) {
                    if (activePlayer) {
                        if (activePlayer == 'soundcloud' || activePlayer == 'facebook' || activePlayer == 'mixcloud') {
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
            } else if (volume < 55 && volume > 21) {
                volumeIcon._node.className = 'icono-volumeMedium';
            } else if (volume <= 21 && volume > 0) {
                volumeIcon._node.className = 'icono-volumeLow';
            } else {
                volumeIcon._node.className = 'icono-volumeMute';
            }
            if (activePlayer) {
                if (activePlayer == 'soundcloud' || activePlayer == 'facebook' || activePlayer == 'mixcloud') {
                    players[activePlayer].setVolume(volume / 100);
                } else {
                    players[activePlayer].setVolume(volume);
                }
            }
        });
        if (!facebookUrl) {
            if (!youtubeUrl) {
                youtubeReady = true;
                youtubeStatusLoad = true;
                retry = maxRetry - 1;
            }
            if (!shoutCastUrl) {
                shoutCastReady = true;
                retry = maxRetry - 1;
            }
            if (youtubeUrl) {
                console.log('Have Youtube Url');
                initYoutubeStream();
            } else if (shoutCastUrl) {
                initShoutCast();
            } else if (someCloudUrl) {
                initSomeCloud();
            } else {
                console.log("No data to init");
            }
        } else {
            initFBPlayer();
        }
        getShoutcastStatus();
    }

    function initFBPlayer() {
        window.fbAsyncInit = function () {
            console.log('FB init');
            FB.Event.subscribe('xfbml.ready', function (msg) {
                console.log(msg)
                if (msg.type === 'video' && msg.id === 'fbPlayer') {
                    fbPlayer = msg.instance;
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
            setTimeout(function () {
                if (fbPlayer && fbPlayer._node) {
                    sitePlayer.addClass('initialized').addClass('no-events').addClass('played').removeClass('not-init');
                    mobilePlayButton.addClass('hidden');
                    if (mobile && Y.UA.ios) {
                        fbPlayer.append('<a class="fb-app-ios-link" target="_blank" href="https://itunes.apple.com/app/facebook/id284882215?ref=m_embedded_video"></a>');
                    }
                }
            }, 5000)
        };
        fbPlayer = Y.one('#fbPlayer') || null;
        if (!fbPlayer) {
            fbPlayer = Y.Node.create('<div id="fbPlayer" data-show-text="false"  data-height="' + castContainer.get('offsetHeight') + '" class="fb-video stream-player" data-allowfullscreen="false" data-href="' + facebookUrl + '"></div>');
        }
        castContainer.prepend(fbPlayer);
        if (!window.FB) {
            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) return;
                js = d.createElement(s);
                js.id = id;
                js.src = "//connect.facebook.net/ru_RU/sdk.js#xfbml=0&version=v2.8&appId=1313716692014044";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        }
    }

    function pausePlayersExept(playerType) {
        playerType = playerType || false;
        for (var player in players) {
            if (players.hasOwnProperty(player) && player !== playerType) {
                console.log(player + ': Paused');
                if (players[player].pauseVideo) {
                    players[player].pauseVideo();
                } else if (players[player].pause) {
                    if (player == 'soundcloud') {
                        players[player].isPaused(function (paused) {
                            if (!paused) {
                                soundCloudPlayer.pause()
                            }
                        });
                    } else if (player == 'mixcloud') {
                        players[player].getIsPaused().then(function (paused) {
                            if (!paused) {
                                mixCloudPlayer.pause()
                            }
                        });
                    }
                }
            }
        }
    }

    function checkStreams() {
        if (dontCheck) return;
        var now = new Date().getTime();
        retry++;
        console.log('Retries: ' + retry, now - lastCheckTime);
        if (now - lastCheckTime < checkingTime - 1000) {
            preventLoops++;
        }
        if (preventLoops > maxRetry * 3) {
            console.log('FFFFFF');
            //offlineMessage();
            //return;
        }
        var status = function () {
            if (activePlayer && (activePlayer == 'youtube' || activePlayer == 'shoutcast')) {
                liveIndicator.addClass('active');
            }
            else {
                liveIndicator.removeClass('active');
            }
            if (activePlayer == 'youtube' || activePlayer == 'facebook') {
                if (shoutcastStatusCheckInterval) {
                    clearInterval(shoutcastStatusCheckInterval);
                    console.log('Shoutcast status reset');
                    shoutcastStatusCheckInterval = null;
                    trackName.one('span').set('text', '');
                    trackName.removeClass('scroll-track');
                    setLocalNotification();
                }
                if (!eventStatusInterval) {
                    getCurrentEvent();
                    eventStatusInterval = setInterval(function () {
                        getCurrentEvent();
                    }, 10000);
                    Y.on('getCurrentEvent', getCurrentEvent);
                    console.log('Event status set');
                }
            }
            else if (activePlayer == 'shoutcast') {
                if (!shoutcastStatusCheckInterval) {
                    if (eventStatusInterval) {
                        clearInterval(eventStatusInterval);
                        console.log('Event status reset');
                        eventStatusInterval = null;
                        Y.detach('getCurrentEvent', getCurrentEvent);
                        trackName.one('span').set('text', '');
                        trackName.removeClass('scroll-track');
                        setLocalNotification();
                    }
                    getShoutcastStatus();
                    shoutcastStatusCheckInterval = setInterval(function () {
                        if (!shoutcastStatusFactor) {
                            getShoutcastStatus();
                        }
                    }, 10000);
                    console.log('Shoutcast status interval set');
                }
            }
            else {
                if (eventStatusInterval) {
                    clearInterval(eventStatusInterval);
                    console.log('Event status reset');
                    eventStatusInterval = null;
                    Y.detach('getCurrentEvent', getCurrentEvent);
                }
                if (shoutcastStatusCheckInterval) {
                    clearInterval(shoutcastStatusCheckInterval);
                    console.log('Shoutcast status reset');
                    shoutcastStatusCheckInterval = null;
                }
                trackName.one('span').set('text', '');
                setLocalNotification();
                trackName.removeClass('scroll-track');
            }
            if (activePlayer) {
                sitePlayer.addClass('played');
                mobilePlayButton.addClass('visible');
                Y.one('#navigator').addClass('stream-found');
                Y.one('.loading-overlay .line') && Y.one('.loading-overlay .line').setStyles({transform: 'scaleY(1000)'});
                setTimeout(function () {
                    !Y.one('.loading-overlay').hasClass('hided') && Y.one('.loading-overlay').hide(true).addClass('hided');
                }, 600)
            }
            lastCheckTime = new Date().getTime();
            console.log('ACTIVE PLAYER ==== ' + activePlayer);
        };
        if (!userPaused && activePlayer !== 'facebook') {
            console.log('CHECK Before Youtube');
            if (youtubeStatusLoad) {
                if (youtubePlayer && youtubeReady) {
                    var state = youtubePlayer.getPlayerState && youtubePlayer.getPlayerState();
                    if (youtubeStatus) {
                        if (state > 1 && !mobile) youtubePlayer.playVideo();
                        if (state == 3) {
                            youtubeRetry++;
                            if (youtubeRetry > maxRetry) {
                                retry = maxRetry;
                                //youtubeStatus = false;
                                return;
                            }
                        } else {
                            youtubeRetry = 0;
                        }
                        if (state == 1) {
                            youtubeStatus = true;
                        }
                        activePlayer = 'youtube';
                        pausePlayersExept('youtube');
                        onPlayerStateChange('youtube', state);
                        status();
                        retry = 1;
                        return;
                    }
                    console.log('Youtube State == ' + state, youtubePlayer.getDuration && youtubePlayer.getDuration(), youtubeStatus);
                }
                console.log('CHECK After Youtube');
                if (!youtubeStatus) {//retry > maxRetry || notYoutube
                    console.log('try another players', notShoutcast, notSoundCloud);
                    if (shoutcastPlayer && !notShoutcast) {
                        state = shoutcastPlayer.getPlayerState && shoutcastPlayer.getPlayerState();
                        console.log(state, shoutcastPlayer.duration, shoutcastPlayer.duration.toString() == 'NaN', shoutcastPlayer.networkState, shoutcastPlayer.readyState, shoutcastStatus);
                        if (shoutcastPlayer.duration.toString() !== 'NaN' && shoutcastPlayer.networkState && shoutcastPlayer.networkState < 3 && shoutcastPlayer.networkState !== 1 || shoutcastStatus) {
                            autoplay && shoutcastPlayer.play();
                            activePlayer = 'shoutcast';
                            pausePlayersExept('shoutcast');
                            onPlayerStateChange('shoutcast');
                            if (state == false) {

                            }
                            status();
                            retry = maxRetry - 1;
                            return;
                        } else {
                            if (retry > maxRetry + 3 && retry < maxRetry + 5) {
                                console.log('try to load shoutcast');
                                shoutcastPlayer.load();
                            } else {
                                console.log('wait to load shoutcast');
                            }
                        }
                    }
                    else {
                        if (shoutCastUrl) {
                            initShoutCast();
                            status();
                        } else {
                            notShoutcast = true;
                            retry = maxRetry + 6;
                        }
                    }
                    console.log('CHECK Before Soundcloud');
                    if (retry > maxRetry + 5 || notShoutcast) {
                        if (soundCloudPlayer && !notSoundCloud) {
                            activePlayer = 'soundcloud';
                            soundCloudPlayer.isPaused(function (paused) {
                                if (paused) {
                                    autoplay && soundCloudPlayer.play();
                                    activePlayer = 'soundcloud';
                                    onPlayerStateChange('soundcloud');
                                    pausePlayersExept('soundcloud');
                                } else {
                                    //retry = maxRetry + 6;
                                }
                                status();
                            });
                        } else if (mixCloudPlayer && !notMixCloud) {
                            activePlayer = 'mixcloud';
                            mixCloudPlayer.getIsPaused().then(function (paused) {
                                if (paused) {
                                    autoplay && mixCloudPlayer.play();
                                    activePlayer = 'mixcloud';
                                    onPlayerStateChange('mixcloud');
                                    pausePlayersExept('mixcloud');
                                } else {
                                    //retry = maxRetry + 6;
                                }
                                status()
                            });
                        } else {
                            if (someCloudUrl && youtubeReady) {
                                initSomeCloud();
                            }
                            status();
                        }
                    }
                    console.log('CHECK After Soundcloud');
                }
            }
            else {
                console.log('Still have no youtubee status load')
            }
            if (!Y.one('#navigator').hasClass('stream-found')) {
                Y.one('.loading-overlay .line') && Y.one('.loading-overlay .line').setStyles({transform: 'scaleY(' + retry * 15 + ')'})
            }
        }
    }

    function setActivePlayer(active) {
        castContainer.removeClass('shoutcast').removeClass('soundcloud').removeClass('youtube').removeClass('facebook').addClass(active);
        castContainer.all('.stream-player').removeClass('active-player');
        if (active == 'youtube') {
            castContainer.one('#youtubePlayer') && castContainer.one('#youtubePlayer').addClass('active-player');
            Y.one('body').addClass('video-player');
        } else if (active == 'facebook') {
            castContainer.one('#fbPlayer') && castContainer.one('#fbPlayer').addClass('active-player');
            Y.one('body').addClass('video-player');
        } else if (active == 'shoutcast') {
            castContainer.one('#shoutcastPlayer') && castContainer.one('#shoutcastPlayer').addClass('active-player');
            Y.one('body').removeClass('video-player');
        } else if (active == 'soundcloud') {
            castContainer.one('#soundCloudPlayer') && castContainer.one('#soundCloudPlayer').addClass('active-player');
            Y.one('body').removeClass('video-player');
        } else if (active == 'mixcloud') {
            castContainer.one('#mixCloudPlayer') && castContainer.one('#mixCloudPlayer').addClass('active-player');
            Y.one('body').removeClass('video-player');
        }
    }

    function initMixCloud() {
        console.log('MixCloud init');
        if (mixCloudPlayer) {
            autoplay && mixCloudPlayer.play();
        } else {
            mixCloudPlayer = Y.Node.create('<iframe id="mixCloudPlayer" src="https://www.mixcloud.com/widget/iframe/?feed=' + someCloudUrl + '&disable_unload_warning=1" class="stream-player mixcloud-stream"></iframe>');
            castContainer.append(mixCloudPlayer);
            mixCloudPlayer = mixCloudPlayer._node;
            mixCloudPlayer = Mixcloud.PlayerWidget(mixCloudPlayer, {
                disablePushstate: true,
                disableUnloadWarning: true
            });
            mixCloudPlayer.ready.then(function (widget) {
                mixCloudPlayer = widget;
                mixCloudPlayer.events.play.on(function () {
                    onPlayerStateChange('mixcloud', 'play')
                });
                mixCloudPlayer.events.pause.on(function () {
                    onPlayerStateChange('mixcloud', 'pause')
                });
                mixCloudPlayer.events.error.on(function (e) {
                    console.log('MixCloud Error', e);
                });
                onPlayerReady('mixcloud');
            });
            players['mixcloud'] = mixCloudPlayer;
        }
    }

    function initSoundCloud() {
        if (soundCloudPlayer) {
            autoplay && soundCloudPlayer.play();
        } else {
            soundCloudPlayer = Y.Node.create('<iframe id="soundCloudPlayer" src="https://w.soundcloud.com/player/?url=' + someCloudUrl + '&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&visual=false" class="stream-player soundcloud-stream"></iframe>');
            castContainer.append(soundCloudPlayer);
            soundCloudPlayer = soundCloudPlayer._node;
            soundCloudPlayer = SC.Widget(soundCloudPlayer);
            soundCloudPlayer.bind(SC.Widget.Events.READY, function () {
                soundCloudPlayer.getSounds(function (sounds) {
                    var skipIndex = 0;
                    if (sounds && sounds.length) {
                        skipIndex = Math.floor(Math.random() * (sounds.length - 1 + 1));
                        console.log('SKIPSCINDEX == ' + skipIndex);
                        soundCloudPlayer.skip(skipIndex);
                        soundCloudPlayer.setVolume(50);
                    }
                    onPlayerReady('soundcloud', {scSkipIndex: skipIndex});
                })
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
    }

    function initSomeCloud() {
        if (someCloudUrl) {
            if (someCloudUrl.indexOf('mixcloud') > -1) {
                initMixCloud();
            } else if (someCloudUrl.indexOf('soundcloud') > -1) {
                initSoundCloud();
            }
            console.log('Some cloud loading');
        } else {
            console.log('no SoundCloud url')
        }
    }

    function initShoutCast() {
        if (shoutCastUrl) {
            console.log('shoutcast starting');
            shoutcastPlayer = Y.one('#shoutcastPlayer') || null;
            if (!shoutcastPlayer) {
                shoutcastPlayer = Y.Node.create('<audio id="shoutcastPlayer" class="stream-player" preload playsinline -webkit-playsinline autoplay="0" name="media"><source src="' + shoutCastUrl + '" type="audio/mpeg"></audio>');
            }
            castContainer.append(shoutcastPlayer);
            shoutcastPlayer = shoutcastPlayer._node;
            shoutcastPlayer.addEventListener('loadstart', function () {
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
        } else {
            console.log('no shoutcast url to start');
            notShoutcast = true;
        }
    }

    function onShoutCastError(e) {
        console.log('shoutcast failed', e);
        e.target.someError = e.type;
    }

    function onSoundCloudError(e) {
        console.log('soundcloud error', e);
    }

    function onYoutubeError(event) {
        console.log('youtube error');
        if (mobile) {
            retry = maxRetry;
            checkStreams();
        }
    }

    function onFBError(e) {
        console.log('FB failed - ', e);
    }

    function onPlayerReady(playerType, data) {
        if (playerType == 'youtube') {
            youtubePlayer.setVolume(50);
            youtubePlayer.playVideo();
            youtubeReady = true;
            pausePlayersExept('youtube');
            if (!youtubeCheckInterval && !youtubeStatusLoad) {
                youtubeCheckInterval = setInterval(function () {
                    if (!youtubeStatusFactor) {
                        getYoutubeStatus();
                    }
                }, 30000);
                console.log('youtube check interval set');
                getYoutubeStatus();
            }
        }
        else if (playerType == 'facebook') {
            fbPlayer.setVolume(0.5);
            if (!mobile) {
                autoplay && fbPlayer.play();
            }
            if (mobile) {
                mobilePlayButton.addClass('hidden');
            }
            fbReady = true;
            pausePlayersExept('facebook');
            activePlayer = 'facebook';
            checkStreams();
        }
        else if (playerType == 'shoutcast') {
            if (!shoutCastReady) {
                shoutcastPlayer.setVolume(50);
                shoutCastReady = true;
                setActivePlayer();
            }
        }
        else if (playerType == 'soundcloud') {
            if (!soundCloudReady) {
                soundCloudPlayer.setVolume(0.5);
                soundCloudReady = true;
                setActivePlayer();
            }
        }
        else if (playerType == 'mixcloud') {
            if (!mixCloudReady) {
                mixCloudPlayer.setVolume(0.5);
                mixCloudReady = true;
                setActivePlayer();
            }
        }
        if (youtubeReady || shoutCastReady || soundCloudReady || mixCloudReady) {
            !castContainer.hasClass && castContainer.addClass('initialized');
            if (!streamCheckInterval) {
                streamCheckInterval = setInterval(function () {
                    checkStreams();
                }, checkingTime);
                console.log('stream check interval set');
                window.addEventListener('offline', offlineMessage);
                window.addEventListener('online', onlineMessage);
            }
            console.log('check STREAMS');
            checkStreams();
        }
        sitePlayer && sitePlayer.addClass('initialized').removeClass('not-init').removeClass('no-events');
        console.log(playerType, 'playerReady');
    }

    function offlineMessage() {
        console.log('offline');
        if (streamCheckInterval) {
            clearInterval(streamCheckInterval);
            streamCheckInterval = false;
            preventLoops = 0;
            lastCheckTime = 0;
        }
    }

    function onlineMessage() {
        console.log('online');
        if (streamCheckInterval == false) {
            streamCheckInterval = setInterval(function () {
                checkStreams();
            }, checkingTime);
            console.log('stream check interval set')
        }
    }

    function setPlaying(playerType) {
        console.log('SET PLAYING: ' + playerType);
        sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
        castContainer.addClass('playing').removeClass('paused').removeClass('stopped');
        !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
        setActivePlayer(playerType);
        pausePlayersExept(playerType);
        sitePlayer.addClass('played');
        mobilePlayButton.addClass('visible');
    }

    function setPaused() {
        sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
        castContainer.removeClass('playing').removeClass('stopped').addClass('paused');
    }

    function onPlayerStateChange(playerType, state) {
        //if (mobile && !userClickPlay) return;
        if (playerType == 'youtube') {
            console.log('youtube player change', state);
            if (youtubePlayer && state) {
                if (state == YT.PlayerState.PLAYING) {
                    setPlaying(playerType);
                } else if (state == YT.PlayerState.PAUSED) {
                    setPaused();
                }
            }
        }
        else if (playerType == 'facebook') {
            if (state == 'play') {
                setPlaying(playerType)
            } else {
                setPaused();
            }
        }
        else if (playerType == 'shoutcast') {
            if (!shoutcastPlayer.paused) {
                setPlaying(playerType);
            } else {
                setPaused();
            }
        } else if (playerType == 'soundcloud') {
            soundCloudPlayer.isPaused(function (paused) {
                if (!paused) {
                    setPlaying(playerType);
                } else {
                    setPaused();
                }
            });
        } else if (playerType == 'mixcloud') {
            mixCloudPlayer.getIsPaused().then(function (paused) {
                if (!paused) {
                    setPlaying(playerType);
                } else {
                    setPaused();
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
                        time: new Date().getTime()
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

    function checkTrackNameOverflow() {
        if (trackName.one('span').get('offsetWidth') > trackName.get('offsetWidth')) {
            trackName.addClass('scrolling');
        } else {
            trackName.removeClass('scrolling');
        }
    }

    function getCurrentEvent(shoutcast) {
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
                if (trackName.get('text') !== eventOnAir.title) {
                    trackName.one('span').set('text', eventOnAir.title);
                    trackName.removeClass('scroll-track').addClass('scroll-track');
                    setLocalNotification(eventOnAir.title);
                    checkTrackNameOverflow();
                }
                if (Y.one('.event-item-' + eventOnAir.id)) {
                    Y.all('.event-item-' + eventOnAir.id).addClass('event-on-air');
                }
            } else {
                if (!shoutcast) {
                    trackName.one('span').set('text', '');
                    setLocalNotification();
                    trackName.removeClass('scroll-track');
                }
                console.log('no current event');
                if (Y.one('.event-on-air')) {
                    Y.all('.event-on-air').removeClass('event-on-air');
                }
            }
        };
        if (!currentEvents) {
            getCollectionItems('https://www.20ftradio.com/events').then(function (events) {
                if (events && events.upcoming) {
                    currentEvents = events;
                    checkEvents();
                }
            })
        } else {
            checkEvents();
        }
    }

    function getYoutubeStatus() {
        return new Y.Promise(function (resolve) {
            if (!youtubeStatusLoad) {
                youtubeStatusLoad = true;
            }
            youtubeStatusFactor = true;
            Y.io('https://app.20ft.xyz/20ft-radio-youtube-status.php', {//https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCN5cr3-T9kZu5pis0Du_dXw&type=video&eventType=live&key=AIzaSyCfBnsl2HqqpJZASmWcN6Y40iffswOvhzo
                on: {
                    success: function (i, data) {
                        if (data.status == 200 && data.readyState == 4) {
                            var live = data.responseText == 'online';
                            console.log('Youtube STREAM is:  --' + live);
                            youtubeStatus = live;
                            checkStreams();
                            youtubeStatusFactor = false;
                            resolve(live);
                        }
                    },
                    failure: function (e) {
                        youtubeStatusFactor = false;
                        DEBUG && console.log(e);
                        resolve(false);
                    }
                }
            });
        });
    }

    function isAndroid() {
        return Y.UA.mobile.indexOf('droid') > -1 || device.platform.indexOf('droid') > -1;
    }

    function setLocalNotification(text) {
        if (useNotifications) {
            if (text) {
                if (!localNotification) {
                    cordova.plugins.notification.local && cordova.plugins.notification.local.schedule({
                        id: 1,
                        title: '20FTRadio',
                        text: text,
                        sound: null,
                        icon: "https://www.20ftradio.com/assets/icon.png"
                    });
                } else {
                    cordova.plugins.notification.local && cordova.plugins.notification.local.update({
                        id: 1,
                        title: '20FTRadio',
                        text: text,
                        sound: null,
                        icon: "https://www.20ftradio.com/assets/icon.png"
                    });
                }
            } else {
                cordova.plugins.notification.local && cordova.plugins.notification.local.cancel(1);
            }
        }
    }

    function getShoutcastStatus() {
        shoutcastStatusFactor = true;
        Y.io('https://app.20ft.xyz/20ft-radiobossfm-status.php', {
            on: {
                success: function (i, data) {
                    if (data.status == 200 && data.readyState == 4) {
                        var html = data.responseText.replace(/src=/g, 'data-href=');
                        var status_html = Y.Node.create(html);
                        if (status_html && status_html.one('table[cellpadding=2]')) {
                            var current_song = status_html.one('table[cellpadding=2] a[href*="currentsong"]').get('text');
                            current_song = 'Now playing: ' + current_song;
                            console.log(current_song, trackName.get('text'), trackName.get('text') !== current_song, activePlayer);
                            if (trackName.get('text') !== current_song && current_song !== 'Now playing: ' && activePlayer == 'shoutcast') {
                                trackName.one('span').set('text', current_song);
                                trackName.removeClass('scroll-track').addClass('scroll-track');
                                checkTrackNameOverflow();
                                shoutcastPlayer.title = current_song;
                                MusicControls && MusicControls.destroy();
                                MusicControls && MusicControls.create({
                                    track: status_html.one('table[cellpadding=2] a[href*="currentsong"]').get('text'),
                                    artist: '20ft Radio',
                                    cover: 'https://www.20ftradio.com/assets/icon.png',
                                    isPlaying: true,							// optional, default : true
                                    dismissable: true,
                                    hasPrev: true,
                                    hasNext: false,
                                    hasClose: true,
                                    // iOS only, optional
                                    //album: 'Absolution',
                                    duration: 60,
                                    elapsed: 10,
                                    // Android only, optional
                                    // text displayed in the status bar when the notification (and the ticker) are updated
                                    ticker: current_song
                                });
                                //setLocalNotification(current_song)
                            } else {
                                getCurrentEvent(true);
                            }
                            shoutcastStatus = true;
                            console.log('SHOUTCAST STATUS TRUE');
                        } else {
                            console.log('SHOUTCAST STATUS FALSE');
                            shoutcastStatus = false;
                        }
                    }
                    shoutcastStatusFactor = false;
                },
                failure: function () {
                    shoutcastStatusFactor = false;
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