window.Template.Controllers.TestCastController = function (element) {
    'use strict';
    //console.log = function () {};
    var sitePlayer = Y.one('.site-player'),
        trackName = sitePlayer.one('.track-name'),
        youtubeUrl,
        facebookUrl,
        shoutCastUrl,
        someCloudUrl,
        retry = 0,
        maxRetry = 3,
        youtubeStatus = false,
        youtubeStatusLoad = false,
        youtubeCheckInterval,
        notYoutube = false,
        youtubeReady = false,
        fbReady = false,
        shoutCastReady = false,
        shoutcastStatus = false,
        shoutcastStatusCheckInterval = null,
        notShoutcast = false,
        notSoundCloud = false,
        notMixCloud = false,
        preventLoops = 0,
        lastCheckTime,
        mobile,
        mobilePlayButton,
        userClickPlay = false,
        userPaused,
        players = {},
        activePlayer = false,
        checkingTime = 5000,
        streamCheckInterval,
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
        castContainer = Y.one('#castDiv');

    function initialize() {
        if (Y.one('#castDiv') && !Y.one('#castDiv').hasClass('initialized')) {
            mobile = Y.UA.mobile;
            setTimeout(function () {
                initCast();
            }, 2000);
            Y.one(window).on('resize', refreshImages);
            if (window.self !== window.top) {
                window.top.Y.one('.sqs-preview-frame-content').addClass('content-loaded');
            }
        }
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
    }

    function initYoutubePlayer() {
        if (youtubeUrl.indexOf('watch') > -1) {
            youtubeUrl = youtubeUrl.split('=')[1];
        } else if (youtubeUrl.indexOf('live_stream') > -1) {
            var channel = youtubeUrl.split('channel=')[1];
            youtubeUrl = 'live_stream';
            console.log(youtubeUrl, channel)
        }
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
        mobilePlayButton = castContainer.one('.mobile-play-button');
        castContainer = Y.one('#castDiv');
        sitePlayer = Y.one('.site-player');
        liveIndicator = castContainer.one('.live-indicator');
        youtubeUrl = castContainer.getAttribute('data-url');
        facebookUrl = castContainer.getAttribute('data-facebook-url');
        shoutCastUrl = castContainer.getAttribute('data-shoutcast-url');
        someCloudUrl = castContainer.getAttribute('data-soundcloud-url');
        var volumeIcon = sitePlayer.one('#volumeButton i');
        var volumeControl = sitePlayer.one('#volControl');
        castContainer.one('img') && castContainer.one('img').removeAttribute('data-load') && ImageLoader.load(castContainer.one('img'), {
            load: true,
            fill: true
        });
        sitePlayer.one('#playButton').on('click', function (e) {
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
                retry = maxRetry - 1;
            }
            if (!shoutCastUrl) {
                shoutCastReady = true;
                retry = maxRetry - 1;
            }
            if (!mobile) {
                if (youtubeUrl) {
                    initYoutubeStream();
                    getYoutubeStatus();
                } else if (shoutCastUrl) {
                    initShoutCast();
                } else if (someCloudUrl) {
                    initSomeCloud();
                } else {
                    console.log("No data to init");
                }
            }
            if (mobile) {
                if (youtubeUrl) {
                    getYoutubeStatus();
                    initYoutubeStream();
                }
                if (shoutCastUrl) {
                    initShoutCast();
                }
                if (someCloudUrl) {
                    initSomeCloud();
                }
            }
            if (youtubeUrl || shoutCastUrl || someCloudUrl) {
                if (!mobile) {
                    /*                streamCheckInterval = setInterval(function () {
                     checkStreams();
                     }, checkingTime);
                     console.log('stream check interval set')*/
                }
            }
        } else {
            initFBPlayer();
        }
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
                    eventStatusInterval = null;
                    trackName.one('span').set('text', '');
                    trackName.removeClass('scroll-track');
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
                    }
                    getShoutcastStatus();
                    shoutcastStatusCheckInterval = setInterval(function () {
                        getShoutcastStatus();
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
                    eventStatusInterval = null;
                }
                trackName.one('span').set('text', '');
                trackName.removeClass('scroll-track');
            }

            if (activePlayer) sitePlayer.addClass('played');
            lastCheckTime = new Date().getTime();
            console.log('ACTIVE PLAYER ==== ' + activePlayer);
        };
        if (!userPaused && activePlayer !== 'facebook') {
            console.log('CHECK Before Youtube');
            if (youtubePlayer && youtubeStatus) {
                var state = youtubePlayer.getPlayerState && youtubePlayer.getPlayerState();
                if (youtubeStatus) {
                    if (state > 1 && !mobile) youtubePlayer.playVideo();
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
                    console.log(state, shoutcastPlayer.duration, shoutcastPlayer.duration.toString() == 'NaN', shoutcastPlayer.networkState, shoutcastPlayer.readyState, shoutcastPlayer.error, shoutcastPlayer.someError);
                    if (shoutcastPlayer.duration.toString() !== 'NaN' && shoutcastPlayer.networkState && shoutcastPlayer.networkState < 3 && shoutcastPlayer.networkState !== 1) {
                        !mobile && shoutcastPlayer.play();
                        activePlayer = 'shoutcast';
                        pausePlayersExept('shoutcast');
                        onPlayerStateChange('shoutcast');
                        if (state == false) {
                            if (mobile) {
                                notSoundCloud = true;
                                notYoutube = true;
                            }
                        }
                        status();
                        retry = maxRetry - 1;
                        return;
                    } else {
                        if (retry > maxRetry + 3) {
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
                                !mobile && soundCloudPlayer.play();
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
                                !mobile && mixCloudPlayer.play();
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
        }
    }

    function initMixCloud() {
        console.log('MixCloud init');
        if (mixCloudPlayer) {
            mixCloudPlayer.play();
        } else {
            mixCloudPlayer = Y.Node.create('<iframe id="mixCloudPlayer" src="https://www.mixcloud.com/widget/iframe/?feed=' + someCloudUrl + '" class="stream-player mixcloud-stream"></iframe>');
            castContainer.append(mixCloudPlayer);
            mixCloudPlayer = mixCloudPlayer._node;
            mixCloudPlayer = Mixcloud.PlayerWidget(mixCloudPlayer, {
                disablePushstate: true,
                disableUnloadWarning: true
            });
            mixCloudPlayer.ready.then(function (e) {
                console.log(e)
                mixCloudPlayer.setOption('disableUnloadWarning', true).then(function (e) {
                    console.log(e)
                })
                mixCloudPlayer.events.play.on(function () {
                    onPlayerStateChange('mixcloud', 'play')
                });
                mixCloudPlayer.events.pause.on(function () {
                    onPlayerStateChange('mixcloud', 'pause')
                });
                mixCloudPlayer.events.error.on(function (e) {
                    console.log('MixCloud Error', e);
                });
                window.zz = mixCloudPlayer;
                onPlayerReady('mixcloud');
            });
            players['mixcloud'] = mixCloudPlayer;
        }
    }

    function initSoundCloud() {
        if (soundCloudPlayer) {
            soundCloudPlayer.play();
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
                shoutcastPlayer = Y.Node.create('<video id="shoutcastPlayer" class="stream-player" preload playsinline autoplay="0" name="media"><source src="' + shoutCastUrl + '" type="audio/mpeg"></video>');
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
            notYoutube = true;
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
            if (!youtubeCheckInterval) {
                youtubeCheckInterval = setInterval(function () {
                    getYoutubeStatus()
                }, 60000);
                console.log('youtube check interval set')
            }
        }
        else if (playerType == 'facebook') {
            fbPlayer.setVolume(0.5);
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
        else if (playerType == 'shoutcast' && youtubeReady) {
            if (!shoutCastReady) {
                shoutcastPlayer.play();
                shoutcastPlayer.setVolume(50);
                shoutCastReady = true;
                setActivePlayer();
            }
        } else if (playerType == 'soundcloud' && youtubeReady) {
            if (!soundCloudReady) {
                window.zz = soundCloudPlayer;
                if (!mobile) soundCloudPlayer.play();
                soundCloudPlayer.setVolume(0.5);
                soundCloudReady = true;
                setActivePlayer();
            }
        }
        if ((youtubeReady || shoutCastReady) && retry < maxRetry || (youtubeReady && notShoutcast) || notShoutcast && notYoutube && soundCloudReady) {
            !castContainer.hasClass && castContainer.addClass('initialized');//checkStreams
            if (!streamCheckInterval) {
                streamCheckInterval = setInterval(function () {
                    checkStreams();
                }, checkingTime);
                console.log('stream check interval set')
            }
            console.log('check STREAMS');
            checkStreams();
            window.addEventListener('offline', offlineMessage);
            window.addEventListener('online', onlineMessage);
        }
        sitePlayer && sitePlayer.addClass('initialized').removeClass('not-init').removeClass('no-events');
        console.log(playerType, 'playerReady');
    }

    function offlineMessage() {
        console.log('offline');
        if (streamCheckInterval) {
            clearInterval(streamCheckInterval);
            streamCheckInterval = null;
            preventLoops = 0;
            lastCheckTime = 0;
        }
    }

    function onlineMessage() {
        console.log('online');
        if (!streamCheckInterval) {
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
    }

    function setPaused() {
        sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
        castContainer.removeClass('playing').removeClass('stopped').addClass('paused');
    }

    function onPlayerStateChange(playerType, state) {
        if (mobile && !userClickPlay) return;
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

    function getYoutubeStatus() {
        return new Y.Promise(function (resolve) {
            if (!youtubeStatusLoad) {
                youtubeStatusLoad = true;
                Y.io('https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=UCN5cr3-T9kZu5pis0Du_dXw&type=video&eventType=live&key=AIzaSyCfBnsl2HqqpJZASmWcN6Y40iffswOvhzo', {
                    on: {
                        success: function (i, data) {
                            youtubeStatusLoad = false;
                            if (data.status == 200 && data.readyState == 4) {
                                data = JSON.parse(data.responseText);
                                var live = data.pageInfo.totalResults > 0;
                                console.log('Youtube STREAM is:  --' + live);
                                youtubeStatus = live;
                                checkStreams();
                                resolve(live);
                            }
                        },
                        failure: function (e) {
                            youtubeStatusLoad = false;
                            console.log(e);
                            resolve(false);
                        }
                    }
                });
            }
        });
    }

    function getShoutcastStatus() {
        Y.io('https://uploader.squarespacewebsites.com/20ft-radio-status.php', {
            on: {
                success: function (i, data) {
                    if (data.status == 200 && data.readyState == 4) {
                        var html = data.responseText.replace(/src=/g, 'data-href=');
                        var status_html = Y.Node.create(html);
                        var current_song = status_html.one('.newscontent table[cellpadding=4] tr:last-child td:last-child').get('text');
                        current_song = 'Now playing: ' + current_song;
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

!function () {
    var e = window.Mixcloud, t = {
        noConflict: function () {
            return window.Mixcloud = e, t
        }
    };
    window.Mixcloud = t
}(), window.Mixcloud.Callbacks = function () {
    var e = [];
    return {
        apply: function (t, n) {
            for (var o = 0; o < e.length; o++)e[o].apply(t, n)
        }, external: {
            on: function (t) {
                e.push(t)
            }, off: function (t) {
                for (var n = 0; n < e.length; n++)if (e[n] === t) {
                    e.splice(n, 1);
                    break
                }
            }
        }
    }
}, function () {
    function e(e, t) {
        return (typeof e)[0] === t
    }

    var t = 1, n = 2;
    window.Mixcloud.Deferred = function () {
        function o(e) {
            i(t, e)
        }

        function r(e) {
            i(n, e)
        }

        function i(n, i) {
            if (!s) {
                if (f.resolve = f.reject = function () {
                    }, n === t) {
                    if (i === f.promise)return void r(new TypeError);
                    if (i instanceof u)return void i.then(o, r);
                    if (e(i, "f") || e(i, "o")) {
                        var l;
                        try {
                            l = i.then
                        } catch (d) {
                            return void r(d)
                        }
                        if (e(l, "f")) {
                            try {
                                l.call(i, o, r)
                            } catch (d) {
                                s || r(d)
                            }
                            return
                        }
                    }
                }
                c = i, s = n, a()
            }
        }

        function a() {
            setTimeout(function () {
                for (var e = 0; e < d.length; e++)d[e][s - 1].call(void 0, c);
                d = []
            }, 0)
        }

        function l(t, n) {
            function o(e) {
                return function (t) {
                    try {
                        r.resolve(e.call(this, t))
                    } catch (n) {
                        r.reject(n)
                    }
                }
            }

            var r = window.Mixcloud.Deferred();
            return d.push([e(t, "f") ? o(t) : function (e) {
                r.resolve(e)
            }, e(n, "f") ? o(n) : function (e) {
                r.reject(e)
            }]), s && a(), r.promise
        }

        function u() {
            this.then = l
        }

        var c, d = [], s = 0, f = {resolve: o, reject: r, promise: new u};
        return f
    }
}(), function (e) {
    function t(t) {
        if (t.origin === o || t.origin === e.location.origin) {
            var n;
            try {
                n = JSON.parse(t.data)
            } catch (r) {
                return
            }
            if ("playerWidget" === n.mixcloud)for (var a = 0; a < i.length; a++)i[a].window === t.source && i[a].callback(n.type, n.data)
        }
    }

    function n(e, t) {
        e.postMessage(JSON.stringify(t), o)
    }

    var o = "https://www.mixcloud.com", r = 0, i = [];
    e.Mixcloud.PlayerWidget = function (t) {
        function o(e, t) {
            "ready" === e ? n(u, {type: "getApi"}) : "api" === e ? a(t) : "event" === e ? d[t.eventName].apply(f, t.args) : "methodResponse" === e && s[t.methodId] && (s[t.methodId].resolve(t.value), delete s[t.methodId])
        }

        function a(t) {
            var n;
            for (n = 0; n < t.methods.length; n++)f[t.methods[n]] = l(t.methods[n]);
            for (n = 0; n < t.events.length; n++)d[t.events[n]] = e.Mixcloud.Callbacks(), f.events[t.events[n]] = d[t.events[n]].external;
            c.resolve(f)
        }

        function l(t) {
            return function () {
                return r++, s[r] = e.Mixcloud.Deferred(), n(u, {
                    type: "method",
                    data: {methodId: r, methodName: t, args: Array.prototype.slice.call(arguments)}
                }), s[r].promise
            }
        }

        var u = t.contentWindow, c = e.Mixcloud.Deferred(), d = {}, s = {}, f = {ready: c.promise, events: {}};
        return i.push({window: u, callback: o}), n(u, {type: "getApi"}), f
    }, e.addEventListener ? e.addEventListener("message", t, !1) : e.attachEvent("onmessage", t)
}(window), function (e, t, n) {
    function o(e, t, n) {
        e.addEventListener ? e.addEventListener(t, n, !1) : e.attachEvent("on" + t, n)
    }

    function r(e, t, n) {
        e.removeEventListener ? e.removeEventListener(t, n, !1) : e.detachEvent("on" + t, n)
    }

    function i(t) {
        if (!(t.defaultPrevented || t.which > 1 || t.metaKey || t.ctrlKey || t.shiftKey || t.altKey)) {
            for (var o = t.target; o && o.parentNode && "A" !== o.nodeName;)o = o.parentNode;
            var r = o.href;
            if ("A" === o.nodeName && 0 !== r.length && 0 === o.target.length) {
                var i = r && r.match(k);
                if (i) {
                    var a = r.replace(i[0], "");
                    if ("" === a || a === n.location.href)return
                }
                if (!E)return void(C && o.setAttribute("target", "_blank"));
                if (f() !== f(o))return void o.setAttribute("target", "_blank");
                t.preventDefault(), e.navigate(o.pathname + o.search)
            }
        }
    }

    function a(e) {
        e.state && e.state.url && S.shouldPop(e.state) && c(e.state.url, !0, e.state.scrollPosition)
    }

    function l(e) {
        t.top.postMessage({
            MixcloudNavigation: !0,
            messageType: e,
            params: Array.prototype.slice.call(arguments, 1)
        }, f())
    }

    function u(e) {
        e.data && e.data.MixcloudNavigation && j[e.data.messageType].apply(null, e.data.params)
    }

    function c(e, t, n) {
        return D ? (T = null, t || S.updateScrollPosition(h()), L ? L.parentNode.removeChild(L) : d(), T = n, D.innerHTML = '<iframe width="100%" height="100%" frameborder="0"></iframe>', L = D.childNodes[0], p().location = f() + encodeURI(e), void(t || S.push(e))) : void P.then(function () {
            c(e, t, n)
        })
    }

    function d() {
        var e = n.createElement("style");
        e.innerHTML = "html,body{padding:0 !important;margin:0 !important;overflow:hidden !important}", n.head.appendChild(e), D.setAttribute("style", "position: absolute; top: 0; left: 0; right: 0; bottom: 60px")
    }

    function s() {
        return t.location.pathname + t.location.search
    }

    function f(e) {
        if (e = e || t.location, e.origin)return e.origin;
        var n = e.protocol + "//" + e.hostname;
        return !e.port || "http:" === e.protocol && "80" === e.port || "https:" === e.protocol && "443" === e.port ? n : n + ":" + e.port
    }

    function p() {
        return L && (L.contentDocument || L.contentWindow.document).defaultView
    }

    function h() {
        var e = p() || t, n = e.document;
        return e.pageYOffset || "CSS1Compat" === n.compatMode && n.documentElement.scrollTop || n.body.scrollTop || 0
    }

    function m() {
        try {
            if (t.top !== t.self)return !0
        } catch (e) {
            return !0
        }
        return !1
    }

    function v() {
        for (var e = n.getElementsByTagName("form"), t = 0; t < e.length; t++)e[t].setAttribute("target", "_blank")
    }

    function g(e) {
        if (e.metaKey || e.ctrlKey)return !1;
        var t = e.which || e.keyCode;
        return 32 !== t ? !1 : e.target.tagName.match(W) ? !1 : !0
    }

    function y(e, t) {
        var n = M + "/widget/iframe/?feed=" + encodeURIComponent(e) + "&footer_widget=1";
        return t.stylecolor && (n += "&stylecolor=" + encodeURIComponent(t.stylecolor)), t.hide_artwork && (n += "&hide_artwork=1"), t.autoplay && (n += "&autoplay=1"), t.light && (n += "&light=1"), t.html5audio && (n += "&html5audio=1"), n
    }

    function w(e) {
        I.events.play.on(b), I.events.pause.on(x), I.events.buffering.on(x), I.events.ended.on(x), I.events.error.on(x), e.disableHotkeys || (o(n, "keydown", function (e) {
            I && g(e) && I.togglePlay()
        }), I.enableHotkeys()), e.disableUnloadWarning || o(t, "beforeunload", function (e) {
            return O ? (e.returnValue = "Are you sure you want to stop listening and leave this page?", e.returnValue) : void 0
        })
    }

    function b() {
        C = !0, O = !0
    }

    function x() {
        O = !1
    }

    function A() {
        for (var t, o = n.getElementsByTagName("script"), r = null, i = 0; i < o.length; i++)if (t = o[i].getAttribute("src"), t && t.replace(/https?:/i, "") === N) {
            r = o[i];
            break
        }
        if (r)try {
            var a = JSON.parse(r.innerHTML), l = a.feed;
            l && (delete a.feed, e.FooterWidget(l, a))
        } catch (u) {
        }
    }

    var M = "https://www.mixcloud.com", N = "//widget.mixcloud.com/media/js/footerWidgetApi.js", E = function () {
        return -1 !== t.navigator.appVersion.indexOf("MSIE 10") ? !1 : !!(t.history && t.history.pushState && t.history.replaceState)
    }(), k = /#(.*)/, C = !1, P = function () {
        function i() {
            r(n, "DOMContentLoaded", i), r(t, "load", i), a.resolve()
        }

        var a = e.Deferred();
        return "complete" === n.readyState ? a.resolve() : (o(n, "DOMContentLoaded", i), o(t, "load", i)), a.promise
    }(), S = function () {
        function e(e) {
            return {url: e, id: o++}
        }

        var n = null, o = 1;
        return {
            replace: function (o) {
                n = e(o), t.history.replaceState(n, null, n.url)
            }, push: function (o) {
                n = e(o), t.history.pushState(n, null, n.url)
            }, shouldPop: function (e) {
                return n.id !== e.id
            }, updateScrollPosition: function (e) {
                n && (n.scrollPosition = e, t.history.replaceState(n, null, n.url))
            }
        }
    }(), T = null, L = null, D = null, W = /^(INPUT|TEXTAREA|A)$/i, I = null, O = !1;
    if (o(n, "click", function (e) {
            for (var t = e.target; t && t.parentNode && (!t.hasAttribute || !t.hasAttribute("data-mixcloud-play-button"));)t = t.parentNode;
            t && t.hasAttribute && t.hasAttribute("data-mixcloud-play-button") && l("play", t.getAttribute("data-mixcloud-play-button"))
        }), m())o(n, "click", i), e.navigate = function (e) {
        l("navigate", e)
    }, l("load", s(), n.title, t.location.hash), e.FooterWidget = function () {
        return e.Deferred().promise
    }, o(n, "keydown", function (e) {
        g(e) && l("togglePlay")
    }), P.then(v); else {
        var j = {
            load: function (e, o, r) {
                S.replace(e), n.title = o, r && (t.location.hash = r), T && (p().scrollTo(0, T > 20 ? T : 0), T = null)
            }, play: function (e) {
                I && I.load(e, !0)
            }, togglePlay: function () {
                I && I.togglePlay()
            }
        };
        j.navigate = function (e) {
            c(e)
        };
        var H = !1;
        e.FooterWidget = function (r, l) {
            if (H)throw Error("Mixcloud Widget API: You can only create one footer widget");
            H = !0;
            var c = e.Deferred();
            return l.disablePushstate || (o(n, "click", i), E && (e.navigate = j.navigate, o(t, "message", u), o(t, "popstate", a), S.replace(s()))), P.then(function () {
                if (E && !l.disablePushstate)for (D = n.createElement("div"), D.setAttribute("class", "mixcloud-footer-widget-body-wrapper"), n.body.appendChild(D); n.body.childNodes.length > 1;)D.appendChild(n.body.childNodes[0]);
                v();
                var o = n.createElement("div");
                o.setAttribute("style", "position: fixed; left: 0; bottom: 0; right: 0; height: 60px; z-index: 10"), o.setAttribute("class", "mixcloud-footer-widget-container"), n.body.appendChild(o);
                var i = 0;
                t.getComputedStyle && (i = parseFloat(t.getComputedStyle(n.body)["padding-bottom"].replace(/px$/, ""))), n.body.style.paddingBottom = i + 60 + "px", o.innerHTML = '<iframe width="100%" height="100%" frameborder="0" src="' + y(r, l) + '"></iframe>';
                var a = e.PlayerWidget(o.childNodes[0]);
                a.ready.then(function () {
                    I = a, w(l), c.resolve(a)
                })
            }), c.promise
        }, A()
    }
}(window.Mixcloud, window, document);