window.Template.Controllers.WallController = function (element) {
    'use strict';
    var animOnScroll;
    
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
        var videos = Y.all('.grid-slide-video-autoplay');
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
        window.Template.Util.initShareButtons();
        if (animOnScroll) animOnScroll = null;
        imagesLoaded(document.getElementById("wallGrid"), function() {
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
        if (Y.one('.wall-item-link')){
            var template = Y.one(Y.one('.wall-item-link').getData('template')).getHTML().replace(/%/g, '{');
            Y.all('.wall-item-link').each(function (link) {
                var url = link.getAttribute('href'),
                    order = link.getAttribute('data-order');
                getCollectionItems(url).then(function (items) {
                    console.log(items);
                    var compiled = Y.JSONTemplate.evaluateJsonTemplate(template, items); //compile template with received data
                    link.insert(compiled, 'before').remove(); //insert compiled template and remove our empty link from  document
                })
            })
        } else {
            loadImages();
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

