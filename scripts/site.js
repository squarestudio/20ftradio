/* jshint loopFunc:false */
Y.use('node', 'squarespace-gallery-ng', function (Y) {

    Y.on('domready', function () {
        Y.all('#mobile-navigation li.folder').each(function (elem) {
            elem.on('click', function () {
                toggleFolder(elem.siblings('li.folder.dropdown-open').item(0));
                toggleFolder(elem);
            });
        });

        // move cart pill below nav
        if (Y.one('#topBar')) {
            var topBarHeight = Y.one('#topBar').get('offsetHeight');
            Y.all('.sqs-cart-dropzone').setStyle('top', topBarHeight + 10);
        }


        //folder subnav
        var toggleFolder = function (elem) {
            if (elem) {
                elem.toggleClass('dropdown-open');
            }
        };
    });

    // folder click thru fix
    if (Modernizr && Modernizr.touch) {
        Y.all('nav .folder').each(function (f) {

            if (f.all('a').size() > 1) {

                f.one('a').on('click', function (e) {
                    e.preventDefault();
                });
            }
        });
    }

    Y.Node.prototype.tick = function (key, val) {

        // update
        if (!key) {
            for (var k in this.target) {
                if (!this.current[k]) {
                    this.current[k] = parseInt(this.getStyle(k), 10);
                    if (isNaN(this.current[k])) {
                        this.current[k] = 0;
                    }
                }

                var currentV = this.current[k];
                var targetV = this.target[k];

                if (typeof(targetV) != 'number') {
                    delete this.current[k];
                    delete this.target[k];

                    this.setStyle(k, targetV);
                    return;
                }

                currentV = this.current[k] + ((this.target[k] - this.current[k]) * 0.1);

                this.current[k] = currentV;
                this.setStyle(k, currentV);
            }

            return;
        }

        if (key instanceof Object) {
            for (var k in key) {
                this.tick(k, key[k]);
            }

            return;
        }

        // setup the target and current
        this.target = this.target || {};
        this.current = this.current || {};
        this.target[key] = val;
    };

    window.Site = Singleton.create({

        ready: function () {
            this.listeners = [];

            document.addEventListener('DOMContentLoaded', this.initialize.bind(this));

        },

        initialize: function () {
            this._setupNavigation();
            this._setupBottomBar();
            this._setupPositioning();

            this.gridEl = Y.one('#grid');

            if (this.gridEl) {
                this._setupGrid();
                this._setupTweakHandler();
            }

            if (window.location.hash.replace('#', '') !== '') {
                Y.once('lazyload:afterNav', function () {
                    Y.one('#navigator').addClass('loaded');
                });
            } else {
                Y.one('#navigator').addClass('loaded');
            }

            if (Y.one('body.page-index')) {
                Y.on('lazyload:afterNav', Y.bind(this._afterNav, this));
            } else if (Y.one('body.page-gallery')) {
                this._afterNav(window.location.pathname);
            }

        },

        _setupNavigation: function () {
            // Configure the links with transition
            /*      if(Y.one('#topBar')){
             Y.one('#topBar').delegate('click', Y.bind(function(e){
             e.halt();
             this.animate('#container', {
             from: {
             opacity: 1
             },
             to: {
             opacity: 0
             }
             }, function() {
             window.location = e.currentTarget.getAttribute('href');
             });
             }, this), '.transition-link');
             }*/


            if (Y.one('.projectPrev')) {
                Y.one('.projectPrev').on('click', Y.bind(this.prevProject, this));
            }

            if (Y.one('.projectNext')) {
                Y.one('.projectNext').on('click', Y.bind(this.nextProject, this));
            }

            if (Y.one('.projectHome')) {
                Y.one('.projectHome').on('click', function (e) {
                    window.location.hash = '/';
                });
            }

            if (Y.one('#nav li.active-link')) {
                if (this.gridEl && Y.one('#nav li.active-link a').getAttribute('rel') == 'index') {
                    Y.one('#nav li.active-link a').removeClass('transition-link').setAttribute('href', '#/');
                }
            }

            this._setHeaderValues();

            Y.one('.sqs-announcement-bar-close') && Y.one('.sqs-announcement-bar-close').on('click', function () {
                this._setHeaderValues();
            }, this);
        },

        _setHeaderValues: function () {
            if (Y.one('#topBar')) {
                var topBarHeight = Y.one('#topBar').get('offsetHeight');
                if (Y.one('#castDiv')) {
                    Y.one('#castDiv').setStyle('marginTop', topBarHeight);
                } else {
                    Y.one('#container').setStyle('marginTop', topBarHeight);
                }
                Y.all('#project .switcher').setStyle('top', topBarHeight + 35);
            }
        },

        _setupKeyHandlers: function () {
            if (!Modernizr.touch) {
                this.listeners.push(Y.after('key', Y.bind(this.prevProject, this), window, 'down:37', this));
                this.listeners.push(Y.after('key', Y.bind(this.nextProject, this), window, 'down:39', this));
                this.listeners.push(Y.after('key', Y.bind(this.jumpUp, this), window, 'down:38', this));
                this.listeners.push(Y.after('key', Y.bind(this.jumpDown, this), window, 'down:40', this));
            }
        },

        _destroyKeyHandlers: function () {
            if (this.listeners.length) {
                for (var i = 0; i < this.listeners.length; i++) {
                    this.listeners[i].detach();
                }
            }
            this.listeners = [];
        },

        _afterNav: function (url) {
            var _this = this,
                proj = Y.one('#project .project-item[data-dynamic-href="' + url + '"]'),
                grid = Y.one('#grid'),
                body = Y.one('body');

            _this._destroyKeyHandlers();
            if (url && proj) {
                body.addClass('index-detail');
                _this._checkSidebarHeight(proj);
                _this.currImg = 1;
                _this.currProj = proj;
                _this._setupKeyHandlers();
            } else if (grid) {
                body.removeClass('index-detail');
                _this.galleryGrid.refresh();
            } else if (Y.one('.collection-type-gallery') && Y.one('.meta')) {
                _this._checkSidebarHeight(Y.one('.project-item'));
            }

        },

        _setupBottomBar: function () {
            if (!Modernizr.touch && Y.Squarespace.Template.getTweakValue('autohide-footer') + "" === "true") {
                var bottomBar = Y.one('#bottomBar');
                var layoutNode = bottomBar.one('.sqs-layout');
                var hasSocialLinks = Y.Lang.isValue(bottomBar.one('.social-links'));
                Y.one(window).on('mousemove', function (e) {
                    if (bottomBar && (!layoutNode.hasClass('empty') || hasSocialLinks || Static.SQUARESPACE_CONTEXT.authenticatedAccount)) {
                        if (e.clientY > window.innerHeight - bottomBar.height()) {
                            bottomBar.addClass('viewable');
                        } else {
                            bottomBar.removeClass('viewable');
                        }
                    }
                });
                var body = Y.one('body');
                var scroll_funct = function () {
                    if (bottomBar && (!layoutNode.hasClass('empty') || hasSocialLinks || Static.SQUARESPACE_CONTEXT.authenticatedAccount)) {
                        if (window.pageYOffset > body.get('offsetHeight') - bottomBar.height() - window.innerHeight || window.innerHeight > body.get('offsetHeight') - bottomBar.height()) {
                            bottomBar.addClass('viewable-on-scroll');
                        } else {
                            bottomBar.removeClass('viewable-on-scroll');
                        }
                    }
                };
                scroll_funct();
                Y.one(window).on('scroll', scroll_funct);
            }
        },

        _setupGrid: function () {

            this.gridEl.all('.item img').each(function (img) {
                img.removeAttribute('alt');
            });

            this.galleryGrid = new Y.Squarespace.Gallery2({
                container: this.gridEl,
                design: 'autocolumns',
                designOptions: {
                    columnWidth: parseInt(Y.Squarespace.Template.getTweakValue('@projectCoverWidth')),
                    columnWidthBehavior: 'min',
                    squares: Y.Squarespace.Template.getTweakValue('project-squares') + "" === "true",
                    aspectRatio: Y.Squarespace.Template.getTweakValue('project-squares') + "" === "true" ? 1 : 0
                },
                loaderOptions: {load: false},
                lazyLoad: true,
                refreshOnResize: true,
                keys: false
            });

            this._setupGridHovers(this.gridEl);
        },

        _setupGridHovers: function (grid) {
            if (!Modernizr.touch) {
                if (Modernizr.csstransforms) {
                    grid.delegate('mouseenter', Y.bind(this._onMouseEnter, this), '.item');

                    grid.delegate('mousemove', Y.bind(this._onMouseMove, this), '.item');

                    grid.delegate('mouseleave', Y.bind(this._onMouseLeave, this), '.item');
                } else {
                    grid.delegate('mouseenter', function (e) {
                        e.currentTarget.addClass('hovering');
                        e.currentTarget.one('img').setStyles({
                            'opacity': .22,
                            'filter': 'alpha(opacity=22)'
                        });
                        e.currentTarget.one('div').setStyles({
                            'opacity': 1,
                            'filter': 'alpha(opacity=100)'
                        });
                    }, '.item');

                    grid.delegate('mouseleave', function (e) {
                        e.currentTarget.removeClass('hovering');
                        e.currentTarget.one('img').setStyles({
                            'opacity': 1,
                            'filter': 'alpha(opacity=100)'
                        });
                        e.currentTarget.one('div').setStyles({
                            'opacity': 0,
                            'filter': 'alpha(opacity=0)'
                        });
                    }, '.item');

                    grid.delegate('mousemove', function (e) {
                    });
                }
            }
        },

        _onMouseEnter: function (e) {
            var _this = this;

            clearTimeout(e.currentTarget.getAttribute('overlayDelay'));
            clearInterval(e.currentTarget.getAttribute('tickInterval'));

            e.currentTarget.setAttribute('overlayDelay', setTimeout(function () {
                e.currentTarget.addClass('hovering');
            }, 20));

            if (Y.Squarespace.Template.getTweakValue('project-hover-panning') + "" === "true") {
                e.currentTarget.setAttribute('tickInterval', setInterval(function () {
                    e.currentTarget.one('img').tick();
                }, 10));
                e.currentTarget.setAttribute('original-top', e.currentTarget.one('img').getStyle('top'));
                e.currentTarget.setAttribute('original-left', e.currentTarget.one('img').getStyle('left'));
            }
        },

        _onMouseMove: function (e) {
            if (Y.Squarespace.Template.getTweakValue('project-hover-panning') + "" === "false") return;

            var x, y;
            x = (e.currentTarget.getXY()[0] - e.pageX + (e.currentTarget.get('offsetWidth') / 2)) / 8;
            y = (e.currentTarget.getXY()[1] - e.pageY + (e.currentTarget.get('offsetHeight') / 2)) / 8;
            x = Math.round(x);
            y = Math.round(y);

            e.currentTarget.one('img').tick({
                top: y + parseInt(e.currentTarget.getAttribute('original-top')),
                left: x + parseInt(e.currentTarget.getAttribute('original-left'))
            });
        },

        _onMouseLeave: function (e) {
            clearTimeout(e.currentTarget.getAttribute('overlayDelay'));
            clearInterval(e.currentTarget.getAttribute('tickInterval'));

            e.currentTarget.removeClass('hovering');
            var img = e.currentTarget.one('img');

            if (e.currentTarget.getAttribute('original-top')) {
                img.setStyle('top', e.currentTarget.getAttribute('original-top'));
            }
            if (e.currentTarget.getAttribute('original-left')) {
                img.setStyle('left', e.currentTarget.getAttribute('original-left'));
            }
        },

        _checkSidebarHeight: function (proj) {
            // Make meta sidebar absolute if it's too long
            Y.all('#project .project-item .meta').setStyle('position', '');

            var metaHeight = proj.one('.meta').height();
            if (Y.config.win.innerWidth > 1000 && metaHeight + Y.one('#topBar').get('offsetHeight') > Y.config.win.innerHeight) {
                Y.one('body').addClass('meta-unfixed');
            } else {
                Y.one('body').removeClass('meta-unfixed');
            }

            if (proj.one('.meta').getStyle('position') !== 'relative' && metaHeight > proj.one('.gallery').height()) {
                proj.one('.gallery').setStyle('minHeight', metaHeight + 'px');
            }
        },

        // to avoid conflicting with lightbox key handlers or form inputs
        _validEvent: function (e) {
            return (Y.one('.yui3-lightbox2') || e.target.ancestor('form')) ? false : true;
        },

        nextProject: function (e) {
            if (!this._validEvent(e)) return;

            var proj = Y.one('.project-item:not(.visually-hidden)').next();
            if (!proj) {
                proj = Y.one('.project-item');
            }
            window.location.hash = '#' + proj.getAttribute('data-dynamic-href');
        },

        prevProject: function (e) {
            if (!this._validEvent(e)) return;

            var proj = Y.one('.project-item:not(.visually-hidden)').previous();
            if (!proj) {
                var projs = Y.all('.project-item');
                proj = projs.item(projs.size() - 1);
            }
            window.location.hash = '#' + proj.getAttribute('data-dynamic-href');
        },

        jumpDown: function (e) {
            if (!this._validEvent(e)) return;

            var newPos, proj = Y.one('.project-item:not(.visually-hidden)');

            if (!proj) return;

            if (!this.currImg) {
                this.currImg = 1;
            }
            if (Y.one('#topBar')) {
                if (this.currImg < proj.all("img").size()) {
                    newPos = proj.all('img').item(this.currImg).getXY()[1];
                    newPos = 5 + newPos - Y.one('#topBar').get('offsetHeight') - parseInt(proj.one('.gallery').getStyle('marginTop'));
                    this.animate('body', {
                        to: {
                            scroll: [0, newPos]
                        },
                        duration: 0.5
                    });
                } else {
                    newPos = Y.one('#grid').getXY()[1];
                    newPos = newPos - Y.one('#topBar').get('offsetHeight') - parseInt(proj.one('.gallery').getStyle('marginTop'));
                    this.animate('body', {
                        to: {
                            scroll: [0, newPos]
                        },
                        duration: 0.8
                    });
                }
            }

            this.currImg++;
        },

        jumpUp: function (e) {
            if (!this._validEvent(e)) return;

            var newPos, proj = Y.one('.project-item:not(.visually-hidden)'),
                maxPos = proj.all('img').size() + 1;
            if (!this.currImg) {
                this.currImg = 1;
            }

            if (!proj) return;
            if (Y.one('#topBar')) {
                if (this.currImg > 1) {
                    if (this.currImg > maxPos) this.currImg = maxPos;
                    newPos = proj.all('img').item(this.currImg - 2).getXY()[1];
                    newPos = 5 + newPos - Y.one('#topBar').get('offsetHeight') - parseInt(proj.one('.gallery').getStyle('marginTop'));
                    this.animate('body', {
                        to: {
                            scroll: [0, newPos]
                        },
                        duration: 0.5
                    });
                    this.currImg--;
                }
            }

        },

        _setupPositioning: function () {
            var adjustForHeaderFooter = function () {
                if (Y.one('#topBar')) {
                    var topBarHeight = Y.one('#topBar').get('offsetHeight');
                    if (Y.one('#castDiv')) {
                        Y.one('#castDiv').setStyle('marginTop', topBarHeight);
                    } else {
                        Y.one('#container').setStyle('marginTop', topBarHeight);
                    }
                }

                if (Y.Squarespace.Template.getTweakValue('autohide-footer') + "" === "true" && Y.one('#bottomBar')) {
                    Y.one('#container').setStyle('marginBottom', Y.one('#bottomBar').get('offsetHeight'));
                }
            };

            Y.on('resize', adjustForHeaderFooter);
            adjustForHeaderFooter();
        },

        // Convenience method for animating
        animate: function (node, config, callback) {
            config = Y.merge({
                duration: 0.3,
                easing: Y.Easing.easeOutStrong
            }, config);
            Y.one(node).anim({}, config).run().on('end', callback);
        },

        _setupTweakHandler: function () {
            var _this = this,
                bRefresh = false;

            // delayed setup... to make sure we have access to Y.Global
            setTimeout(Y.bind(function () {
                if (Y.Global) {
                    Y.Global.on('tweak:change', function (f) {
                        var tweakName = f.getName();
                        if (_this.galleryGrid) {
                            if (tweakName.match(/projectCoverWidth/i)) {
                                _this.galleryGrid.set('columnWidth', parseInt(f.getValue()));
                            } else if (tweakName.match(/project-squares/)) {
                                if (f.getValue() == 'true') {
                                    _this.galleryGrid.set('aspectRatio', 1);
                                } else {
                                    _this.galleryGrid.set('aspectRatio', 0);
                                }
                            }
                        }
                    });

                    // Hack to fix grid on tweak close
                    Y.Global.on('tweak:close', function () {
                        setTimeout(function () {
                            _this.galleryGrid.refresh();
                        }, 500);
                    });
                }
            }, this), 1000);
        }

    });
});

function donateWithLiqPay(val, name, surname, email) {
    var callbackArr = initLiqpayCall(val, name, surname, email);
    LiqPayCheckout.init({
        data: callbackArr['data'],
        signature: callbackArr['signature'],
        embedTo: "#liqpay_checkout",
        language: "ru",
        mode: "embed" // embed || popup
    }).on("liqpay.callback", function (data) {
        console.log(data.status);
        console.log(data);
    }).on("liqpay.ready", function (data) {
        // ready
    }).on("liqpay.close", function (data) {
        // close
    });
}

(function () {
    'use strict';
    window.aj = new AjaxLoader({
        sqsController: true,
        timeout: 6000,
        siteContainer: '#container-content',
        activeNavClass: 'active-link',
        pageTransition: {
            animLink: 'index-page-transition-link',
            animClass: 'tweak-page-transition-animation',
            fadeInDuration: 0.78,
            fadeOutDuration: 0.2
        },
        beforeRequestAnim: function () {
            var container = document.querySelector('#container-content');
            container.classList.add('slide-up');
        },
        afterRequestAnim: function () {
            var container = document.querySelector('#container-content');
            container.classList.remove('slide-up');
            container.classList.add('slide-into-view');
            window.setTimeout(function () {
                container.classList.remove('slide-into-view');
            }, 500);
        }
    });
    if (Y.one('.header-block-content')) {
        var header_content = Y.one('.header-block-content');
        if (header_content.one('.sqs-svg-icon--list')) {
            header_content.one('.socialaccountlinks-v2-block .sqs-svg-icon--list').append('<a href="https://www.mixcloud.com/20ftradio/" target="_blank" class="sqs-svg-icon--wrapper mixcloud"><div><svg class="sqs-svg-icon--social" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax" viewBox="0 0 16 16" fill="#eee"><g fill-rule="nonzero"><path d="M14.634 12.716c-.103 0-.206-.03-.297-.09-.246-.167-.31-.5-.15-.74.493-.73.75-1.588.75-2.48 0-.892-.257-1.75-.75-2.48-.165-.246-.096-.578.144-.738.247-.166.572-.097.738.143.612.91.932 1.973.932 3.076s-.32 2.167-.932 3.076c-.097.154-.263.234-.434.234z"/><path d="M13.108 11.853c-.103 0-.206-.03-.298-.092-.246-.164-.308-.496-.143-.736.326-.48.498-1.035.498-1.618 0-.577-.172-1.137-.498-1.618-.165-.245-.103-.57.143-.737.246-.165.572-.102.738.144.446.657.68 1.423.68 2.212 0 .795-.234 1.56-.68 2.212-.097.155-.27.235-.44.235zM10.62 7.085c-.21-2.132-2.01-3.8-4.2-3.8C4.606 3.284 3 4.45 2.423 6.14 1.058 6.342 0 7.52 0 8.942c0 1.562 1.275 2.836 2.84 2.836h7.272c1.31 0 2.378-1.063 2.378-2.372 0-1.137-.8-2.086-1.87-2.32zm-.508 3.63h-7.27c-.978 0-1.78-.794-1.78-1.772 0-.977.796-1.772 1.78-1.772.473 0 .92.184 1.257.52.204.207.542.207.753 0 .206-.204.206-.542 0-.753-.366-.366-.817-.618-1.31-.743.504-1.11 1.625-1.852 2.876-1.852 1.743 0 3.16 1.417 3.16 3.155 0 .337-.05.67-.16.99-.09.28.058.576.338.673.057.018.114.03.166.03.222 0 .428-.144.503-.367.068-.21.12-.423.154-.64.493.19.84.663.84 1.218.007.726-.588 1.315-1.308 1.315z"/></g></svg></div></a>');
            header_content.one('.socialaccountlinks-v2-block').get('parentNode').append('<a class="toggle-share-mobile" href="#"><div></div></a>')
        }
        if (header_content.one('.sqs-donate-button')) {
            var button = header_content.one('.sqs-donate-button');
            var a = Y.Node.create('<a href="/donate" data-ajax-loader="ajax-loader-binded">Donate</a>');
            a.addClass('ajax-binded').addClass(button.get('className'));
            var parent = button.get('parentNode');
            if (button.ancestor('.sqs-block-donation')) {
                button.ancestor('.sqs-block-donation').removeClass('sqs-block-donation');
            }
            button.remove();
            parent.append(a);
        }
        var cloned_content = header_content.cloneNode(true);
        Y.one('.footer-h-content').append(cloned_content);
        Y.one('body').delegate('click', function (e) {
            e.halt();
            Y.one('body').toggleClass('mobile-share-active');
        }, '.toggle-share-mobile');
    }

    function isToday(inputDate) {
        var today = new Date();
        if (today.setHours(0, 0, 0, 0) === new Date(inputDate).setHours(0, 0, 0, 0)) {
            return true;
        }
        else {
            return false;
        }
    }

    Y.use('squarespace-ui-base', function (Y) {
        Y.one(".project-item .meta h1") && Y.one(".project-item .meta h1") && Y.one(".project-item .meta h1").plug(Y.Squarespace.TextShrink);
        Y.one(".siteTitle h1") && Y.one(".siteTitle h1").plug(Y.Squarespace.TextShrink, {
            triggerWidth: 640
        });
    });
    var formSubmitEvent = null;
    Y.config.win.Squarespace.onInitialize(Y, function () {
        var body = Y.one('body');
        Y.use('node', function () {
            moment.locale(navigator.language);
            Y.all('[date-format]').each(function (time) {
                var format = time.getAttribute('date-format') || 'LLLL';
                var value = parseInt(time.getAttribute('datetime'));
                if (format === 'LT' && navigator.language === 'en') {
                    format = 'hA';
                }
                var textContent = moment(value).format(format);
                if (format === 'ddd' && isToday(value)) {
                    textContent = navigator.language.split('-')[0] === 'ru' ? 'Сегодня' : navigator.language.split('-')[0] === 'ua' ? 'Сьогоднi' : 'Today';
                }
                time.set('textContent', textContent);
            })
        });
        if (body.one('.new-events-schedule')) {
            var new_schedule = body.one('.new-events-schedule');
            var existing_dates = [];
            if (new_schedule.one('.date-container')) {
                new_schedule.all('.date-container').each(function (date_container) {
                    var date_attr = date_container.getAttribute('data-date-attr');
                    if (existing_dates.indexOf(date_attr) > -1) {
                        date_container.remove();
                    } else {
                        existing_dates.push(date_attr);
                        if (new_schedule.one('.' + date_attr)) {
                            date_container.one('.items-container').append(new_schedule.all('.' + date_attr))
                        }
                    }
                });
                var min_width_time = 0;
                new_schedule.all('.event-time-wrapper').each(function (item) {
                    if (item.width() > min_width_time) {
                        min_width_time = item.width();
                    }
                });
                new_schedule.all('.event-time-wrapper').setStyles({minWidth: min_width_time + 'px'})
            }
        }
        if (Y.one('#liqpay_checkout')) {
            var codeBlockLiq = Y.one('#liqpay_checkout').ancestor('.code-block');
            codeBlockLiq.addClass('hidden');
            if (!Y.one('#liqpayAPI')) {
                window.Y.Get.js('https://static.liqpay.ua/libjs/checkout.js', function (err, tx) {
                    if (err) {
                        Y.log('Error loading Lazy Summaries JS: ' + err[0].error, 'error');
                        return;
                    }
                    tx && tx.nodes[0].setAttribute('id', 'liqpayAPI');
                });
            }
            formSubmitEvent = Y.Global.on('form:submitSuccess', function (e) {
                var form = Y.one('#container form');
                var name = form.one('.first-name input').get('value');
                var surname = form.one('.last-name input').get('value');
                var val = parseInt(form.one('.field input[placeholder*="UAH"]').get('value'));
                var email = form.one('.email input').get('value');
                codeBlockLiq.removeClass('hidden');
                donateWithLiqPay(val, name, surname, email);
            });
        }
    });
    Y.config.win.Squarespace.onDestroy(Y, function () {
        formSubmitEvent && formSubmitEvent.detach();
    })
}());