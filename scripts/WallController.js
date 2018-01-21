window.Template.Controllers.WallController = function (element) {
    'use strict';
    var animOnScroll;
    var wallGrid = Y.one('#wallGrid');

    function simulateResize() {
        var evt = document.createEvent("HTMLEvents");
        evt.initEvent('resize', true, false);
        window.dispatchEvent(evt);
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
                    if (document.querySelector('html').className.indexOf('touch-styles') < 0) {
                        swiper.stopAutoplay();
                        Y.one(swiper.container[0]).ancestor('.grid-slide')._node.onmouseenter = function () {
                            swiper.startAutoplay();
                        };
                        Y.one(swiper.container[0]).ancestor('.grid-slide')._node.onmouseleave = function () {
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
        });
        var embed_videos = wallGrid.all('.sqs-video-wrapper');
        embed_videos.each(function (embed) {
            if (embed.getAttribute('data-html').indexOf('<iframe') > -1) {
                var videoloader = embed.videoloader;
                //videoloader && videoloader.showVideo();
                if (embed.one('.intrinsic-inner')) {
                    embed.one('.intrinsic-inner').addClass('aspect-16-9');
                }
            }
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
                    if (text !== '<p>&nbsp;</p>') {
                        buffer_text += text;
                    }
                }
            });
            var longest_text = readyTexts.sort(function (a, b) {
                return b.length - a.length;
            })[0];
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
                callback: function (t) {
                    t.backDelay = 5000;
                    t.startDelay = 0
                },
                onStringTyped: function (t) {
                    t.backDelay = 1000
                }
            });
        });
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
                        time: new Date().getTime(),
                        offset: offset || ''
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

    function initialize() {
        console.log('Wall init');
        wallGrid = Y.one('#wallGrid');
        var wallGrids = wallGrid.all('.wallGrid');
        if (wallGrid) {
            var mobileWall = wallGrid.one('.mobile-only');
            window.Template.Util.initShareButtons();
            if (animOnScroll) animOnScroll = null;
            var imagesReady = function () {
                console.log('activated wall');
                initGalleries();
                initVideos();
                initTexts();
                setTimeout(function () {
                    animOnScroll = new AnimOnScroll(document.getElementById("wallGrid"), {
                        minDuration: 1,
                        maxDuration: 2,
                        viewportFactor: 0.2
                    });
                    simulateResize();
                }, 100);
                var imgLoad = imagesLoaded(document.getElementById("wallGrid"));
                imgLoad.on( 'progress', function( instance, image ) {
                    wallGrids.each(function (grid) {
                        console.log(grid.masonry);
                      if(grid.masonry){
                          grid.masonry.layout();
                      }
                    })
                });
            };
            if (Y.one('.wall-item-link')) {
                Y.use(['node', 'squarespace-json-template'], function (Y) {
                    var template = Y.one(Y.one('.wall-item-link').getData('template')).getHTML().replace(/\^/g, '{');
                    wallGrid.all('.wall-item-link').each(function (link) {
                        var url = link.getAttribute('href'),
                            order = link.getAttribute('data-first-order');
                        getCollectionItems(url).then(function (items) {
                            console.log(items);
                            if (items && items.upcoming.length) {
                                wallGrid.removeClass('no-upcoming');
                                var compiled = Y.JSONTemplate.evaluateJsonTemplate(template, items); //compile template with received data
                                var compiledFragment = Y.Node.create(compiled);
                                if (compiledFragment.one('.wallEvents-Upcoming')) {
                                    var upcomingMob = compiledFragment.one('.wallEvents-Upcoming').cloneNode(!0);
                                    mobileWall.prepend(upcomingMob.get('children'));
                                }
                                if (compiledFragment.one('.wallEvents-Past')) {
                                    var pastMob = compiledFragment.one('.wallEvents-Past').cloneNode(!0);
                                    mobileWall.append(pastMob.get('children'));
                                }
                                var events = Y.Node.create('<ul class="wallGrid wallEvents"></ul>');
                                wallGrid.prepend(events.prepend(compiledFragment.all('li')));
                                link.remove();
                                imagesReady();
                                loadImages();
                                Y.fire('getCurrentEvent');
                                if (window.AjaxLoader) {
                                    Y.all('.wallGrid a').each(function (link) {
                                        if (link.getAttribute('href').indexOf('http') < 0) {
                                            link.setAttribute('data-ajax-loader', 'ajax-loader-binded');
                                        }
                                    })
                                }
                            } else {
                                wallGrid.addClass('no-upcoming');
                                link.remove();
                                imagesReady();
                                loadImages();
                            }
                        })
                    })
                })
            } else {
                wallGrid.addClass('no-upcoming');
                loadImages();
                imagesReady();
            }
        }
    }

    initialize();

    return {
        sync: function () {
            initialize();
        },
        destroy: function () {
            console.log('destroy wall');
        }
    };

};

