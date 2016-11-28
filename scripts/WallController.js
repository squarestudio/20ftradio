window.Template.Controllers.WallController = function (element) {
    'use strict';
    var animOnScroll,
        wallGrid,
        castPlayer,
        sitePlayer = Y.one('.site-player'),
        castContainer;
    
    function simulateResize() {
        window.top.innerWidth = window.top.innerWidth - 1;
        Y.one(window.top).simulate('resize');
        window.top.innerWidth = window.top.innerWidth + 1;
    }

    function loadImages() {
        var images = document.querySelectorAll('#wallGrid img[data-src]:not(.swiper-lazy)');
        for (var i = 0; i < images.length; i++) {
            images[i].removeAttribute('data-load');
            ImageLoader.load(images[i], {load: true});
        }
    }

    function initGalleries() {
        var swipers = document.querySelectorAll('#wallGrid .swiper-container');
        for (var i = 0; i < swipers.length; i++) {
            var swiper_el = $(swipers[i]);
            swiper_el.css('height', swiper_el.outerHeight(true));
            var swiper = new window.Swiper(swipers[i], {
                loop: true,
                speed: 500,
                autoplay: 300,
                effect: 'fade',
                simulateTouch: false,
                noSwiping: true,
                onInit: function (swiper) {
                    if(document.querySelector('html').className.indexOf('touch-styles') < 0){
                        swiper.stopAutoplay();
                        swiper.container[0].onmouseenter = function () {
                            swiper.startAutoplay();
                        };
                        swiper.container[0].onmouseleave = function () {
                            swiper.stopAutoplay();
                        };
                    }
                }
            });
        }
    }

    function initVideos() {
        if (Y.Squarespace.VideoLoader) Y.Squarespace.VideoLoader.prototype._showOverlayOnOthers = function () {
            return false
        };
        var videos = wallGrid.all('.grid-slide-video-autoplay');
        videos.each(function (video) {
                var videoloader = video.one('.sqs-video-wrapper').videoloader;
                video.on('hover', function () {
                    if (videoloader && videoloader.get('showingVideo')) {
                        videoloader.play();
                    } else {
                       videoloader && videoloader.showVideo();
                    }
                }, function () {
                    videoloader && videoloader.pause();
                })
        })
    }

    function initTexts() {
        $('.grid-gallery-text.animated').each(function () {
            var texts = $(this).find('.grid-slide-description-text .html-block .sqs-block-content').children().toArray();
            var readyTexts = [];
            var buffer_text = '';
            texts.forEach(function (text) {
                text = text.outerHTML;
                if (text == '<p>--animate--</p>') {
                    readyTexts.push(buffer_text);
                    buffer_text = '';
                } else if (text == '<p>--end--</p>') {
                    readyTexts.push(buffer_text);
                    buffer_text = '';
                }
                else {
                    if (text !== '<p>&nbsp;</p>'){
                        buffer_text += text;
                    }
                }
            });
            var longest_text = readyTexts.sort(function (a, b) { return b.length - a.length; })[0];
            $(this).find(".text-spacer-element").html(longest_text);
            var body_text = $(this).find(".grid-slide-description-body");
            body_text.typed({
                strings: readyTexts,
                typeSpeed: 40,
                backDelay: 1000,
                startDelay: 700,
                backSpeed: 10,
                loop: true,
                contentType: 'html',
                showCursor: false,
                callback: function(t) {t.backDelay = 5000;t.startDelay = 0},
                onStringTyped: function(t) {t.backDelay = 1000}
            });
        });
    }

    function getCollectionItems(collection_url) {
        return new Y.Promise(function (resolve) {
            var content_items = {past: [], upcoming: []};
            var offset = '';
            function getItems(collection_url, offset) {
                Y.Data.get({
                    url: collection_url+'?format=json',
                    data: {
                        offset: offset || ''
                    },
                    success: function (items) {
                        console.log(items);
                        content_items.upcoming = content_items.upcoming.concat(items.upcoming);
                        content_items.past = content_items.past.concat(items.past);
                        if (items.pagination) {

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
        wallGrid = Y.one('#wallGrid');
        window.Template.Util.initShareButtons();
        if (animOnScroll) animOnScroll = null;
        var imagesReady = function () {
            imagesLoaded(document.getElementById("wallGrid"), function() {
                console.log('activated');
                initGalleries();
                initVideos();
                initTexts();
                animOnScroll = new AnimOnScroll(document.getElementById("wallGrid"), {
                    minDuration: 1,
                    maxDuration: 2,
                    viewportFactor: 0.2
                });
                setTimeout(function () {
                    simulateResize();
                }, 100);
            });
        };
        if (Y.one('.wall-item-link')){
            Y.use(['node', 'squarespace-json-template'], function (Y) {
                var template = Y.one(Y.one('.wall-item-link').getData('template')).getHTML().replace(/\^/g, '{');
                Y.all('.wall-item-link').each(function (link) {
                    var url = link.getAttribute('href'),
                        order = link.getAttribute('data-first-order');
                    getCollectionItems(url).then(function (items) {
                        console.log(items);
                        if(items){
                            var compiled = Y.JSONTemplate.evaluateJsonTemplate(template, items); //compile template with received data
                            var compiledFragment = Y.Node.create(compiled);
/*                            if(order == 'true'){
                                var nodes = getNodesOrderedByAdded(wallGrid.all('li'));
                                wallGrid.append(nodes);
                                wallGrid.prepend(getNodesOrderedByDate(compiledFragment.all('li')));
                            } else {
                                link.insert(compiledFragment, 'before');
                                nodes = getNodesOrderedByAdded(wallGrid.all('li'));
                                wallGrid.append(nodes);
                            }*/
                            wallGrid.prepend(compiledFragment);
                            link.remove();
                            imagesReady();
                            loadImages();
                        } else {
                            link.remove();
                            imagesReady();
                            loadImages();
                        }
                    })
                })
            })
        } else {
            imagesReady();
            loadImages();
        }
        if(Y.one('#castDiv')){
            initCast()
        }
    }
    function initCast() {
        castContainer = Y.one('#castDiv');
        var videoId = castContainer.getAttribute('data-url').split('=')[1];
        var alternUrl = castContainer.getAttribute('data-alternative-url');
        var volumeIcon = sitePlayer.one('#volumeButton i');
        var volumeControl = sitePlayer.one('#volControl')
        castContainer.one('img') && castContainer.one('img').removeAttribute('data-load') && ImageLoader.load(castContainer.one('img'), {load: true, fill: true});
        sitePlayer.one('#playButton').on('click', function (e) {
            e.halt();
            var state = castPlayer.getPlayerState();
            if (state == YT.PlayerState.PLAYING) {
                castPlayer.pauseVideo();
            } else if (state == YT.PlayerState.PAUSED) {
                castPlayer.playVideo();
            }
        });
        volumeIcon.on('click', function (e) {
            e.halt();
            if(e.currentTarget.hasClass('icono-volumeMute')){
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
            if(volume > 55){
                volumeIcon._node.className = 'icono-volumeHigh';
            } else if(volume<55 && volume> 20){
                volumeIcon._node.className = 'icono-volumeMedium';
            } else if(volume<20 && volume>0){
                volumeIcon._node.className = 'icono-volumeLow';
            } else {
                volumeIcon._node.className = 'icono-volumeMute';
            }
            castPlayer.setVolume(volume);
        });
        var tag = document.createElement('script');
        tag.src = "//www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady =  function () {
            window.castPlayer = castPlayer = new YT.Player('castPlayer', {
                height: '720',
                width: '1280',
                videoId: videoId,
                playerVars: {
                    //'autoplay': 1,
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
        function onPlayerError(event){
            castPlayer.destroy();
            console.log('loading shoutcast');
            var shoutCast = Y.Node.create('<video class="hidden" autoplay="1" name="media"><source src="'+alternUrl+'" type="audio/mpeg"></video>');
            castContainer.append(shoutCast);
        }
        function onPlayerReady(event) {
            console.log('playerReady');
            event.target.setVolume(50);
            //event.target.playVideo();
        }
        function onPlayerStateChange(event) {
            if (event.data == YT.PlayerState.PLAYING) {
                sitePlayer.addClass('playing').removeClass('paused').removeClass('stopped');
            } else if (event.data == YT.PlayerState.PAUSED) {
                sitePlayer.removeClass('playing').removeClass('stopped').addClass('paused');
            }
        }
    }

    function getNodesOrderedByDate(nodes) {
        var now = (new Date()).getTime();
        nodes._nodes.sort(function(a, b) {
            var bigger = parseInt(b.getAttribute('data-start-date')) - parseInt(a.getAttribute('data-start-date'));
            console.log(bigger);
            return bigger - now;
        });
        return nodes;
    }

    function getNodesOrderedByAdded(nodes) {
        nodes._nodes.sort(function(a, b) {
            return +b.getAttribute('data-added-on') - +a.getAttribute('data-added-on');
        });
        return nodes;
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

