window.Template.Controllers.MobileCastController = function (element) {
    'use strict';
    var dontCheck = false;
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
        streamCheckInterval = true,
        youtubePlayer = null,
        fbPlayer = null,
        shoutcastPlayer = null,
        soundCloudPlayer = null,
        soundCloudReady = false,
        mixCloudPlayer = null,
        mixCloudReady = false,
        firstRun = false,
        eventStatusInterval,
        currentEvents,
        liveIndicator,
        MUSContrl,
        currentTrack,
        castContainer = Y.one('#castDiv');
    var DEBUG = false;
    var youtubeStatusFactor = false, shoutcastStatusFactor = false;
    var mobileImage;

    function initialize() {
        window.CASTHERE = true;
        if (!firstRun) {
            Y.on('mixcloud:play', function () {
                console.log('MIXCLOUD PLAY');
                userPaused = true;
                pausePlayersExept('all');
                window.mixCloudFooterPlayer.play();
            });
            firstRun = true;
        }
        if (Y.one('#castDiv') && !Y.one('#castDiv').hasClass('initialized')) {
            mobile = Y.UA.mobile;
            //Site && Site._setupPositioning();
            setTimeout(function () {
                //Site && Site._setupPositioning();
            }, 50);
            initCast();
            Y.one(window).on('resize', refreshImages);
            if (window.self !== window.top) {
                window.top.Y.one('.sqs-preview-frame-content').addClass('content-loaded');
            }
        }
        currentEvents = null;
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
        DEBUG && console.log(youtubeUrl, channel);
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
            DEBUG && console.log('init youtube');
            if (!castContainer.one('#youtubePlayer')) {
                castContainer.prepend('<div id="youtubePlayer" class="stream-player"></div>');
            }
            if (!window.YT) {
                var tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                var firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            } else {
                initYoutubePlayer();
            }
            window.onYouTubeIframeAPIReady = function () {
                initYoutubePlayer();
            };
        } else {
            DEBUG && console.log("No data to init youtube");
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
            //console.log(this, 'PAUSED')
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
        DEBUG && console.log('init cast');
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
            e && e.halt && e.halt();
            console.log(activePlayer, youtubePlayer);
            if (!activePlayer) return;
            var state = null;
            if (activePlayer == 'youtube') {
                state = youtubePlayer.getPlayerState();
                DEBUG && console.log('youtube video', state, YT.PlayerState.PLAYING);
                if (mobile && !userClickPlay) {
                    youtubePlayer.unMute();
                    youtubePlayer.playVideo();
                    userPaused = false;
                    checkStreams();
                }
                else if (state === YT.PlayerState.PLAYING) {
                    youtubePlayer.pauseVideo();
                    userPaused = true;
                } else if (state === YT.PlayerState.PAUSED) {
                    youtubePlayer.playVideo();
                    youtubePlayer.unMute();
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
                console.log('SHOUTCAST State', state, castContainer.hasClass('paused'), shoutcastPlayer.currentTime);
                if (mobile && !userClickPlay) {
                    if (!shoutcastPlayer.currentTime) {
                        shoutcastPlayer.load();
                    }
                    shoutcastPlayer.setVolume(100);
                    shoutcastPlayer.muted = false;
                    shoutcastPlayer.autoplay = false;
                    shoutcastPlayer.playVideo();
                    userPaused = false;
                    userClickPlay = true;
                    checkStreams();
                }
                else if (state) {
                    console.log('Play');
                    if (!shoutcastPlayer.currentTime) {
                        shoutcastPlayer.load();
                    }
                    shoutcastPlayer.muted = false;
                    shoutcastPlayer.playVideo();
                    userPaused = false;
                } else {
                    console.log('Pause');
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
            checkStreams();
            userClickPlay = true;
        };
        if (youtubeUrl) {
            sitePlayer.addClass('youtube-here');
        }
        castContainer.one('img') && castContainer.one('img').removeAttribute('data-load') && ImageLoader.load(castContainer.one('img'), {
            load: true,
            fill: true
        });
        sitePlayer.one('#playButton').on('click', playButtonClick);
        mobilePlayButton.on('click', playButtonClick);
        var videoButtonClick = function (e) {
            e.halt();
            Y.one('html').toggleClass('stream-visible');
            if (!youtubePlayer) {
                initYoutubeStream();
            } else {
                pausePlayersExept('youtube');
            }
        };
        sitePlayer.one('#videoButton').on('click', videoButtonClick);
        videoYoutubazing();
        volumeIcon.on('click', function (e) {
            e.halt();
            if (castContainer.get('offsetWidth') < 430) {
                sitePlayer.toggleClass('volume-range-visible');
            } else {
                DEBUG && console.log('volume - ' + activePlayer);
                if (e.currentTarget.hasClass('icono-volumeMute')) {
                    if (activePlayer) {
                        if (activePlayer == 'soundcloud' || activePlayer == 'facebook' || activePlayer == 'mixcloud') {
                            players[activePlayer].setVolume(1);
                        } else {
                            players[activePlayer].setVolume(100);
                        }
                        volumeControl.set('value', 100);
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
        volumeControl && volumeControl.on(['change', 'input'], function (e) {
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
        youtubeReady = true;
        youtubeStatusLoad = true;
        retry = maxRetry - 1;
        getShoutcastStatus();
        initShoutCast();
        document.addEventListener("pause", handlePause);
        document.addEventListener("resume", handleResume);

        function initMusicControls() {
            function events(action) {
                action = JSON.parse(action).message;
                console.log(action);
                switch (action) {
                    case 'music-controls-pause':
                        userPaused = true;
                        //pausePlayersExept('all');
                        mobilePlayButton.simulate('click');
                        break;
                    case 'music-controls-play':
                        userPaused = false;
                        mobilePlayButton.simulate('click');
                        break;
                    case 'music-controls-destroy':
                        // Do something
                        break;
                    // External controls (iOS only)
                    case 'music-controls-toggle-play-pause' :
                        break;
                    case 'music-controls-media-button' :
                        break;
                    case 'music-controls-headset-unplugged':
                        // Do something
                        break;
                    case 'music-controls-headset-plugged':
                        // Do something
                        break;
                    default:
                        break;
                }
            }

            if (window.MusicControls) {
                MusicControls.subscribe(events);
                MusicControls.listen();
            }
        }

        initMusicControls();
        setMusicMeta(trackName.get('text'), false);
    }

    function handlePause() {
        console.log('APP paused', userPaused);
        if (activePlayer == 'youtube' && !userPaused) {
            youtubePlayer.playVideo();
        }
    }

    function handleResume() {
        console.log('APP continue');
    }

    function initFBPlayer() {
        window.fbAsyncInit = function () {
            DEBUG && console.log('FB init');
            FB.Event.subscribe('xfbml.ready', function (msg) {
                DEBUG && console.log(msg)
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
                DEBUG && console.log(player + ': Paused');
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
        var state;
        var now = new Date().getTime();
        retry++;
        DEBUG && console.log('Retries: ' + retry, now - lastCheckTime);
        if (now - lastCheckTime < checkingTime - 1000) {
            preventLoops++;
        }
        if (preventLoops > maxRetry * 3) {
            DEBUG && console.log('FFFFFF');
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
                    DEBUG && console.log('Shoutcast status reset');
                    shoutcastStatusCheckInterval = null;
                    trackName.one('span').set('text', '');
                    trackName.removeClass('scroll-track');
                }
                if (!eventStatusInterval) {
                    getCurrentEvent();
                    eventStatusInterval = setInterval(function () {
                        getCurrentEvent();
                    }, 10000);
                    Y.on('getCurrentEvent', getCurrentEvent);
                    DEBUG && console.log('Event status set');
                }
            }
            else if (activePlayer == 'shoutcast') {
                if (!shoutcastStatusCheckInterval) {
                    if (eventStatusInterval) {
                        clearInterval(eventStatusInterval);
                        DEBUG && console.log('Event status reset');
                        eventStatusInterval = null;
                        Y.detach('getCurrentEvent', getCurrentEvent);
                        trackName.one('span').set('text', '  ');
                        trackName.removeClass('scroll-track');
                    }
                    getShoutcastStatus();
                    shoutcastStatusCheckInterval = setInterval(function () {
                        if (!shoutcastStatusFactor) {
                            getShoutcastStatus();
                        }
                    }, 30000);
                    DEBUG && console.log('Shoutcast status interval set');
                }
            }
            else {
                if (eventStatusInterval) {
                    clearInterval(eventStatusInterval);
                    DEBUG && console.log('Event status reset');
                    eventStatusInterval = null;
                    Y.detach('getCurrentEvent', getCurrentEvent);
                }
                if (shoutcastStatusCheckInterval) {
                    clearInterval(shoutcastStatusCheckInterval);
                    DEBUG && console.log('Shoutcast status reset');
                    shoutcastStatusCheckInterval = null;
                }
                trackName.one('span').set('text', '  ');
                trackName.removeClass('scroll-track');
            }

            if (activePlayer) {
                sitePlayer.addClass('played');
                mobilePlayButton.addClass('visible');
                Y.one('#navigator').addClass('stream-found');
                var hideOverlay = function () {
                    Y.one('.loading-overlay .line') && Y.one('.loading-overlay .line').setStyles({transform: 'scaleY(1000)'});
                    setTimeout(function () {
                        !Y.one('.loading-overlay').hasClass('hided') && Y.one('.loading-overlay').hide(true).addClass('hided');
                    }, 600)
                };
                if (activePlayer == 'shoutcast') {
                    Site && Site._setupPositioning();
                    shoutcastPlayer.canPlay && hideOverlay();
                } else if (activePlayer == 'youtube') {
                    youtubePlayer.canPlay && hideOverlay();
                } else {
                    hideOverlay();
                }
            }
            lastCheckTime = new Date().getTime();
            DEBUG && console.log('ACTIVE PLAYER ==== ' + activePlayer);
        };
        if (!userPaused) {
            if (activePlayer === 'youtube') {

            } else {
                if (shoutcastPlayer) {
                    state = shoutcastPlayer.getPlayerState && shoutcastPlayer.getPlayerState();
                    DEBUG && console.log(state, shoutcastPlayer.duration, shoutcastPlayer.duration.toString() == 'NaN', shoutcastPlayer.networkState, shoutcastPlayer.readyState, shoutcastPlayer.error, shoutcastPlayer.someError, shoutcastStatus);
                    if (shoutcastPlayer.duration.toString() !== 'NaN' && shoutcastPlayer.networkState && shoutcastPlayer.networkState < 3 && shoutcastPlayer.networkState !== 1 || shoutcastStatus) {
                        !mobile && shoutcastPlayer.play();
                        activePlayer = 'shoutcast';
                        pausePlayersExept('shoutcast');
                        onPlayerStateChange('shoutcast');
                        status();
                        retry = maxRetry - 1;
                        return;
                    } else {
                        if (retry < maxRetry + 25) {
                            DEBUG && console.log('try to load shoutcast');
                            shoutcastPlayer.load();
                        } else {
                            DEBUG && console.log('wait to load shoutcast');
                            retry++;
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
            }
        }
    }

    function setActivePlayer(active) {
        castContainer.removeClass('shoutcast').removeClass('soundcloud').removeClass('youtube').removeClass('facebook').addClass(active);
        castContainer.all('.stream-player').removeClass('active-player');
        if (active == 'youtube') {
            castContainer.one('#youtubePlayer') && castContainer.one('#youtubePlayer').addClass('active-player');
        } else if (active == 'facebook') {
            castContainer.one('#fbPlayer') && castContainer.one('#fbPlayer').addClass('active-player');
        } else if (active == 'shoutcast') {
            castContainer.one('#shoutcastPlayer') && castContainer.one('#shoutcastPlayer').addClass('active-player');
        } else if (active == 'soundcloud') {
            castContainer.one('#soundCloudPlayer') && castContainer.one('#soundCloudPlayer').addClass('active-player');
        } else if (active == 'mixcloud') {
            castContainer.one('#mixCloudPlayer') && castContainer.one('#mixCloudPlayer').addClass('active-player');
        }
    }

    function initMixCloud() {
        DEBUG && console.log('MixCloud init');
        if (mixCloudPlayer) {
            !mobile && mixCloudPlayer.play();
        } else {
            mixCloudPlayer = Y.Node.create('<iframe id="mixCloudPlayer" src="https://www.mixcloud.com/widget/iframe/?feed=' + someCloudUrl + '&disable_unload_warning=1" class="stream-player mixcloud-stream"></iframe>');
            castContainer.append(mixCloudPlayer);
            mixCloudPlayer = mixCloudPlayer._node;
            mixCloudPlayer = Mixcloud.PlayerWidget(mixCloudPlayer, {
                disablePushstate: true,
                disableUnloadWarning: true
            });
            mixCloudPlayer.ready.then(function (widget, t) {
                console.log(t)
                mixCloudPlayer = widget;
                mixCloudPlayer.events.play.on(function () {
                    console.log('mx play')
                    onPlayerStateChange('mixcloud', 'play')
                });
                mixCloudPlayer.events.pause.on(function () {
                    console.log('mx pause')
                    onPlayerStateChange('mixcloud', 'pause')
                });
                mixCloudPlayer.events.error.on(function (e) {
                    DEBUG && console.log('MixCloud Error', e);
                });
                onPlayerReady('mixcloud');
            });
            players['mixcloud'] = mixCloudPlayer;
        }
    }

    function initSoundCloud() {
        if (soundCloudPlayer) {
            !mobile && soundCloudPlayer.play();
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
                        DEBUG && console.log('SKIPSCINDEX == ' + skipIndex);
                        soundCloudPlayer.skip(skipIndex);
                        soundCloudPlayer.setVolume(100);
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
            DEBUG && console.log('Some cloud loading');
        } else {
            DEBUG && console.log('no SoundCloud url')
        }
    }

    function initShoutCast() {
        if (shoutCastUrl) {
            DEBUG && console.log('shoutcast starting');
            shoutcastPlayer = Y.one('#shoutcastPlayer') || null;
            var YshoutcastPlayer;
            shoutcastStatus = true;
            activePlayer = 'shoutcast';
            if (window.firstPlayClick) {
                userClickPlay = true;
            }
            if (!shoutcastPlayer) {
                YshoutcastPlayer = Y.Node.create('<audio id="shoutcastPlayer" title="20FT Radio" class="stream-player" crossorigin="anonymous" autoplay poster="https://www.20ftradio.net/assets/icon.png" preload="auto" playsinline -webkit-playsinline name="media"><source src="' + shoutCastUrl + '" type="audio/mpeg"></audio>');
            } else {
                console.log('EXIST');
                YshoutcastPlayer = shoutcastPlayer;
                shoutcastPlayer = YshoutcastPlayer._node;
                if (!shoutcastPlayer.paused) {
                    userPaused = false;
                }
                onPlayerReady('shoutcast');
            }
            //castContainer.append(YshoutcastPlayer);
            shoutcastPlayer = YshoutcastPlayer._node;
            /*           shoutcastPlayer.addEventListener('loadstart', function () {
                           onPlayerReady('shoutcast');
                           console.log('LOADSTART')
                       });*/
            shoutcastPlayer.addEventListener('play', function () {
                onPlayerStateChange('shoutcast', 'play')
            });
            shoutcastPlayer.addEventListener('pause', function () {
                onPlayerStateChange('shoutcast', 'pause');
            });
            shoutcastPlayer.addEventListener('error', onShoutCastError);
            shoutcastPlayer.addEventListener('abort', onShoutCastError);
            shoutcastPlayer.addEventListener('stalled', onShoutCastError);
            shoutcastPlayer.addEventListener('suspend', onShoutCastError);
            shoutcastPlayer.addEventListener('emptied', onShoutCastError);
            var currPlayed = shoutcastPlayer.played.end(0) || 0;
            var currBuff = shoutcastPlayer.buffered.end(0) || 0;
            var loadingTimeout;
            var onprogress = function () {
                var buffered = shoutcastPlayer.buffered.end(0) || 0;
                var played = shoutcastPlayer.played.end(0) || 0;
                console.log(loadingTimeout, Y.one('html').hasClass('data-playing'))
                if (currPlayed < played && played < buffered && currBuff < buffered) {
                    if (loadingTimeout) {
                        window.clearTimeout(loadingTimeout);
                        loadingTimeout = null;
                    }
                } else {
                    if (!loadingTimeout) {
                        console.log('Set loading TIMEOUT');
                        loadingTimeout = setTimeout(function (e) {
                            var st = shoutcastPlayer.paused;
                            shoutcastPlayer.load();
                            if (!st && !userPaused) {
                                shoutcastPlayer.play();
                            }
                            window.clearTimeout(loadingTimeout);
                        }, 10000)
                    }
                }
                currPlayed = played;
                currBuff = buffered;
            }
            shoutcastPlayer.addEventListener('progress', onprogress, false);
            players['shoutcast'] = shoutcastPlayer;
            setMusicMeta(trackName.get('text'), Y.one('html').hasClass('data-playing'));
            console.log('SET MUSIC META');
        } else {
            DEBUG && console.log('no shoutcast url to start');
            notShoutcast = true;
        }
    }

    function onShoutCastError(e) {
        console.log('shoutcast failed', e);
        e.target.someError = e.type;
    }

    function onSoundCloudError(e) {
        DEBUG && console.log('soundcloud error', e);
    }

    function onYoutubeError(event) {
        DEBUG && console.log('youtube error');
        if (mobile) {
            retry = maxRetry;
            checkStreams();
        }
    }

    function onFBError(e) {
        DEBUG && console.log('FB failed - ', e);
    }

    function onPlayerReady(playerType, data) {
        if (playerType == 'youtube') {
            youtubePlayer.setVolume(100);
            !mobile && youtubePlayer.playVideo();
            youtubeReady = true;
            activePlayer = 'youtube';
            youtubePlayer.canPlay = true;
            pausePlayersExept('youtube');
            /*            if (!youtubeCheckInterval && !youtubeStatusLoad) {
                            youtubeCheckInterval = setInterval(function () {
                                if (!youtubeStatusFactor) {
                                    getYoutubeStatus();
                                }
                            }, 30000);
                            DEBUG && console.log('youtube check interval set');
                            getYoutubeStatus();
                        }*/
        }
        else if (playerType == 'facebook') {
            fbPlayer.setVolume(1);
            if (!mobile) {
                fbPlayer.play();
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
                shoutCastReady = true;
                setActivePlayer(playerType);
                //shoutcastPlayer.load();
            }
        }
        else if (playerType == 'soundcloud') {
            if (!soundCloudReady) {
                soundCloudPlayer.setVolume(1);
                soundCloudReady = true;
                setActivePlayer();
            }
        }
        else if (playerType == 'mixcloud') {
            if (!mixCloudReady) {
                mixCloudPlayer.setVolume(1);
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
                DEBUG && console.log('stream check interval set');
                window.addEventListener('offline', offlineMessage);
                window.addEventListener('online', onlineMessage);
            }
            DEBUG && console.log('check STREAMS');
            checkStreams();
        }
        sitePlayer && sitePlayer.addClass('initialized').removeClass('not-init').removeClass('no-events');
        DEBUG && console.log(playerType, 'playerReady');
    }

    function offlineMessage() {
        DEBUG && console.log('offline');
        pausePlayersExept('all');
        if (streamCheckInterval) {
            clearInterval(streamCheckInterval);
            streamCheckInterval = false;
            preventLoops = 0;
            lastCheckTime = 0;
        }
    }

    function onlineMessage() {
        DEBUG && console.log('online');
        shoutcastPlayer && shoutcastPlayer.load();
        if (streamCheckInterval == false) {
            streamCheckInterval = setInterval(function () {
                checkStreams();
            }, checkingTime);
            DEBUG && console.log('stream check interval set')
        }
    }

    function setPlaying(playerType) {
        if (userClickPlay) {
            DEBUG && console.log('SET PLAYING: ' + playerType);
            sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
            castContainer.addClass('playing').removeClass('paused').removeClass('stopped');
            !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
            setActivePlayer(playerType);
            pausePlayersExept(playerType);
            sitePlayer.addClass('played');
            mobilePlayButton.addClass('visible');
        }
        if (playerType === 'shoutcast') {
            Y.fire('play:shoutcast');
        }
        if (window.mixCloudEmbeds && window.mixCloudEmbeds.length && !userPaused) {
            window.mixCloudEmbeds.forEach(function (widget) {
                widget.pause && widget.pause();
            })
        }
        if (window.mixCloudFooterPlayer && !userPaused) {
            window.mixCloudFooterPlayer.pause && window.mixCloudFooterPlayer.pause();
            Y.one('html').removeClass('mixcloud-footer-playing').removeClass('mixcloud-footer-stopped');
            Y.all('.mixcloud-item.playing').removeClass('playing').removeClass('current');
        }
    }

    function setPaused() {
        sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
        castContainer.removeClass('playing').removeClass('stopped').addClass('paused');
    }

    function onPlayerStateChange(playerType, state) {
        if (playerType == 'youtube') {
            DEBUG && console.log('youtube player change', state);
            if (youtubePlayer && state) {
                if (state == YT.PlayerState.PLAYING) {
                    setPlaying(playerType);
                } else if (state == YT.PlayerState.PAUSED) {
                    setPaused();
                }
                setTimeout(function () {
                    if (userClickPlay) {
                        var track = trackName.get('text') || youtubePlayer.getVideoData().title;
                        setMusicMeta(track, state == YT.PlayerState.PLAYING);
                    }
                }, 40)
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
            if (state) {
                setMusicMeta(trackName.get('text'), state == 'play');
                setTimeout(function () {
                    if (userClickPlay) {

                    }
                }, 40)
            }
        }
        else if (playerType == 'soundcloud') {
            soundCloudPlayer.isPaused(function (paused) {
                if (!paused) {
                    setPlaying(playerType);
                } else {
                    setPaused();
                }
                setTimeout(function () {
                    if (userClickPlay) {
                        var track = trackName.get('text') || 'Soundcloud';
                        setMusicMeta(track, !paused);
                    }
                }, 40)
            });
        }
        else if (playerType == 'mixcloud') {
            mixCloudPlayer.getIsPaused().then(function (paused) {
                if (!paused) {
                    setPlaying(playerType);
                } else {
                    setPaused();
                }
                setTimeout(function () {
                    if (userClickPlay) {
                        var track = trackName.get('text') || 'Mixcloud';
                        setMusicMeta(track, !paused);
                    }
                }, 40)
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
            var currentTime = moment().valueOf();
            var eventOnAir = false;
            currentEvents.upcoming.forEach(function (event) {
                if (currentTime >= event.startDate && currentTime <= event.endDate && !eventOnAir) {
                    eventOnAir = event;
                    DEBUG && console.log(event.title);
                }
            });
            if (eventOnAir) {
                if (trackName.get('text') !== eventOnAir.title) {
                    trackName.one('span').set('text', eventOnAir.title);
                    trackName.removeClass('scroll-track').addClass('scroll-track');
                    //setLocalNotification(eventOnAir.title);
                    checkTrackNameOverflow();
                }
                if (Y.all('#mobile-events-upcoming .event-item').size()) {
                    Y.all('#mobile-events-upcoming .event-item').each(function (item) {
                        if (item.getAttribute('id') == eventOnAir.id) {
                            item.addClass('event-on-air');
                        } else {
                            if (item.hasClass('event-on-air')) {
                                item.removeClass('event-on-air');
                                item.hide(true);
                                setTimeout(function () {
                                    item.remove();
                                }, 400)
                            }
                        }
                    })
                }
            } else {
                if (!shoutcast) {
                    trackName.one('span').set('text', '');
                    //setLocalNotification();
                    trackName.removeClass('scroll-track');
                }
                DEBUG && console.log('no current event');
                if (Y.one('.event-on-air')) {
                    var curr_event = Y.one('.event-on-air');
                    curr_event.removeClass('event-on-air').hide(true);
                    setTimeout(function () {
                        curr_event.remove();
                    }, 400)
                }
            }
        };
        if (!currentEvents) {
            getCollectionItems('https://www.20ftradio.net/events').then(function (events) {
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
            Y.io('https://app.20ftradio.net/20ft-radio-youtube-status.php?time=' + new Date().getTime(), {//https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCN5cr3-T9kZu5pis0Du_dXw&type=video&eventType=live&key=AIzaSyCfBnsl2HqqpJZASmWcN6Y40iffswOvhzo
                on: {
                    success: function (i, data) {
                        if (data.status == 200 && data.readyState == 4) {
                            var live = data.responseText == 'online';
                            DEBUG && console.log('Youtube STREAM is:  --' + live);
                            youtubeStatus = live;
                            checkStreams();
                            youtubeStatusFactor = false;
                            resolve(live);
                        }
                    },
                    failure: function (e) {
                        youtubeStatusFactor = false;
                        DEBUG && DEBUG && console.log(e);
                        resolve(false);
                    }
                }
            });
        });
    }

    function isAndroid() {
        return Y.UA.mobile && Y.UA.mobile.indexOf('droid') > -1 || window.device && window.device.platform.indexOf('droid') > -1;
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
                        icon: "https://www.20ftradio.net/assets/icon.png"
                    });
                } else {
                    cordova.plugins.notification.local && cordova.plugins.notification.local.update({
                        id: 1,
                        title: '20FTRadio',
                        text: text,
                        sound: null,
                        icon: "https://www.20ftradio.net/assets/icon.png"
                    });
                }
            } else {
                cordova.plugins.notification.local && cordova.plugins.notification.local.cancel(1);
            }
        }
    }

    function setMusicMeta(track, play, img) {
        //MusicControls && MusicControls.destroy();
        //if(!isAndroid()) {return false}
        var cover = isAndroid() ? 'https://www.20ftradio.net/assets/x-icon.png' : 'https://www.20ftradio.net/assets/icon.png';
        if (window.MusicControls) {
            if (currentTrack !== track) {

            }
            window.MusicControls.create({
                track: track || '',
                artist: '20ft Radio',
                cover: cover,
                isPlaying: play,
                dismissable: false,
                hasPrev: false,
                hasNext: false,
                hasClose: false
                // iOS only, optional
                //album: 'Absolution',
                //duration: 60,
                //elapsed: 10,
            });
            currentTrack = track;
        }
    }

    function getShoutcastStatus() {
        shoutcastStatusFactor = true;
        Y.io('https://app.20ftradio.net/stream-status.php', {
            headers: {
                'Content-Type': 'application/json'
            },
            on: {
                success: function (i, data) {
                    if (data.status === 200 && data.readyState === 4 && data.response[0] !== '<') {
                        var resp = JSON.parse(data.response);
                        if (resp && resp.youtube) {
                            sitePlayer.addClass('video-stream');
                        } else {
                            sitePlayer.removeClass('video-stream');
                            Y.one('html').removeClass('stream-visible');
                        }
                        if (resp && resp.shoutcast && resp.shoutcast.live) {
                            var current_song = resp.shoutcast.track.trim();
                            current_song = 'Now playing: ' + current_song;
                            if (trackName.get('text') !== current_song && current_song !== 'Now playing: ' && activePlayer === 'shoutcast') {
                                trackName.one('span').set('text', current_song);
                                shoutcastPlayer.title = current_song;
                                trackName.removeClass('scroll-track').addClass('scroll-track');
                                getCurrentEvent(true);
                                checkTrackNameOverflow();
                            } else {
                                getCurrentEvent(true);
                            }
                            shoutcastStatus = true;
                            if (!shoutcastPlayer) {
                                initShoutCast()
                            }
                            DEBUG && console.log('SHOUTCAST STATUS TRUE');
                        } else {
                            DEBUG && console.log('SHOUTCAST STATUS FALSE');
                            shoutcastPlayer.pause();
                            shoutcastStatus = false;
                            if (data.responseText === 'Offline') {
                                trackName.one('span').set('text', 'Stream offline now');
                                shoutcastPlayer.title = 'Stream offline now';
                                trackName.removeClass('scroll-track').addClass('scroll-track');
                                checkTrackNameOverflow();
                            }
                        }
                    }
                    shoutcastStatusFactor = false;
                },
                failure: function () {
                    console.log('SHOUTCAST STATUS FALSE');
                    shoutcastStatus = false;
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
            DEBUG && console.log('destroy cast');
            Y.one(window).detach('resize', refreshImages);
            Y.detach('getCurrentEvent', getCurrentEvent);
        }
    };
};