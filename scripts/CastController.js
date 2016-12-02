window.Template.Controllers.CastController = function (element) {
    'use strict';
    var castPlayer,
        sitePlayer = Y.one('.site-player'),
        videoId,
        shoutCastUrl,
        playerType = 'youtube',
        castContainer = Y.one('#castDiv');

    function initialize() {
        if (Y.one('#castDiv')) {
            initCast();
        }
        Y.one(window).on('resize', refreshImages);
    }
    function refreshImages() {
        castContainer.all('img').each(function (img) {
            console.log(img)
            img.removeAttribute('data-load');
            ImageLoader.load(img, {load: true});
        });
    }
    function initYoutubeStream() {
        console.log('init youtube')
        var tag = document.createElement('script');
        tag.src = "//www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = function () {
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
        };
    }
    function videoYoutubazing() {
        Object.defineProperty(HTMLMediaElement.prototype, 'playing', {
            get: function(){
                return !!(this.currentTime > 0 && !this.paused && !this.ended && this.readyState > 2);
            }
        });
        HTMLMediaElement.prototype.playVideo = function(){
            this.play();
        };
        HTMLMediaElement.prototype.pauseVideo = function(){
            this.pause();
        };
        HTMLMediaElement.prototype.setVolume = function(volume){
            this.volume = volume/100;
        };
        HTMLMediaElement.prototype.getPlayerState = function () {
            return this.paused;
        };
    }
    function initCast() {
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
            if (state === YT.PlayerState.PLAYING) {
                castPlayer.pauseVideo();
            } else if (state === YT.PlayerState.PAUSED) {
                castPlayer.playVideo();
            } else if (state){
                castPlayer.playVideo();
            } else {
                castPlayer.pauseVideo();
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
        if(videoId){
            initYoutubeStream();
        } else if (shoutCastUrl) {
            initShoutCast();
        }
    }
    function initShoutCast(){
        console.log('shoutcast');
        playerType = 'shoutcast';
        castPlayer.destroy();
        castPlayer = null;
        castPlayer = Y.Node.create('<video id="castPlayer" class="hidden" autoplay="1" name="media"><source src="' + shoutCastUrl + '" type="audio/mpeg"></video>');
        castContainer.append(castPlayer);
        castPlayer = castPlayer._node;
        castPlayer.addEventListener('canplaythrough', onPlayerReady);
        castPlayer.addEventListener('play', onPlayerStateChange);
        castPlayer.addEventListener('pause', onPlayerStateChange);
    }

    function onPlayerError(event) {

        console.log('loading shoutcast');
        initShoutCast()
    }

    function onPlayerReady(event) {
        console.log('playerReady');
        event.target.setVolume(50);
        event.target.playVideo();
    }

    function onPlayerStateChange(event) {
        if (event.data){
            if (event.data == YT.PlayerState.PLAYING) {
                sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
            } else if (event.data == YT.PlayerState.PAUSED) {
                sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
            }
        } else {
            if(event.target.playing){
                sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
                !castContainer.hasClass('stream-activated') && castContainer.addClass('stream-activated');
            } else {
                sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
            }
        }
    }

    initialize();

    return {
        sync: function () {
            initialize();
        },
        destroy: function () {

        }
    };
};