(function ($) {
    var defaults = {
        thumbSize: 72,
        thumbCrop: true,
        sizeX: 3,
        sizeY: 1,

        // Front options
        frontThumbSize: 60,
        frontMaxCount: 12,

        // Picasa options
        picasaUser: 'naspeh',
        picasaAlbum: 'Naspeh',
        picasaTags: [],
        picasaTagsIgnore: []
    };
    var templates = {
        thumbItems: (
            '<div class="napokaz-items">{{ items }}</div>'
        ),
        thumbItem: (
            '<div class="napokaz-item" id="{{ id }}">' +
                '<a class="napokaz-thumb" href="{{ orig.url }}" rel="{{ albumId }}" ' +
                    'data-size=\'{"width": {{ orig.width }},"height": {{ orig.height }}}\'' +
                '>' +
                    '<div class="napokaz-thumb-inner" ' +
                        'style="' +
                            'background-image: url({{ thumb.url }});' +
                            'width: {{ thumb.size }}px;' +
                            'height: {{ thumb.size }}px;' +
                        '"' +
                    '>&nbsp;</div>' +
                    '<div class="napokaz-thumb2-inner" ' +
                        'style="' +
                            'background-image: url({{ thumb2.url }});' +
                            'width: {{ thumb2.size }}px;' +
                            'height: {{ thumb2.size }}px;' +
                        '"' +
                    '><div class="napokaz-thumb2-overlay"></div></div>' +
                '</a>' +
                '<div class="napokaz-info">' +
                    '<a href="{{ picasa }}">Посмотерть в picasa</a>' +
                '</div>' +
            '</div>'
        ),
        controls: (
            '<div class="napokaz-controls">' +
                '<a class="napokaz-prev" href="#">&laquo;</a>' +
                '<a class="napokaz-next" href="#">&raquo;</a>' +
            '</div>'
        ),
        front: (
            '<div class="napokaz-front">' +
                '<div class="napokaz-front-overlay"></div>' +
                '<div class="napokaz-front-view">' +
                    '<div class="napokaz-front-inner"></div>' +
                '</div>' +
                '<div class="napokaz-front-items"></div>' +
            '</div>'
        ),
        frontOrig: (
            '<img class="napokaz-front-orig" src="{{ orig }}?imgmax={{ imgmax }}" />'
        )
    };

    var picasa = {
        getFeed: function(params) {
            var feed = 'https://picasaweb.google.com/data/feed/api/';
            $.each(params, function(key, value){
                feed += key + '/' + value + '/';
            });
            return feed;
        },
        parse: function(data, opts) {
            data = $(data);
            var tagReg = opts.picasaTags.length ? new RegExp(opts.picasaTags.join('|')) : undefined;
            var tagIgnoreReg = opts.picasaTagsIgnore.length ? new RegExp(opts.picasaTagsIgnore.join('|')) : undefined;
            var albumId = data.find('gphoto\\:albumid:first').text();
            var items = [];
            data.find('entry').each(function() {
                var $this = $(this);
                var orig = $this.find('media\\:group media\\:content');
                var item = {
                    'picasa': $this.find('link[rel="alternate"]').attr('href'),
                    'orig': {
                        url: orig.attr('url'),
                        width: orig.attr('width'),
                        height: orig.attr('height')
                    },
                    'thumb': {
                        url: $this.find('media\\:group media\\:thumbnail').first().attr('url'),
                        size: opts.thumbSize
                    },
                    'thumb2': {
                        url: $this.find('media\\:group media\\:thumbnail').last().attr('url'),
                        size: opts.frontThumbSize
                    },
                    'albumId': albumId,
                    'id': $this.find('gphoto\\:id').text(),
                    'tags': $this.find('media\\:keywords').text().split(', ')
                };
                var ignore = false;
                if (tagReg && !tagReg.test(item.tags)) {
                    ignore = true;
                }
                if (tagIgnoreReg && tagIgnoreReg.test(item.tags)) {
                    ignore = true;
                }
                if (!ignore) {
                    item = tmpl(templates.thumbItem, item);
                    items.push(item);
                }
            });
            return {
                items: items,
                albumId: albumId
            };
        }
    };

    var front = (function() {
        var perPage;
        var hashCache;

        var front = $(templates.front);
        pager(front, '.napokaz-item', 'napokaz-active', function(element) {
            element.find('.napokaz-thumb').click();
        });
        pager(front, '.napokaz-item', 'napokaz-front-page', function(element, items, marker) {
            markPage(element, items, marker, perPage);
        });

        $(document).ready(function() {
            $('body').append(front);
        });

        // Set Navigation Key Bindings
        $(document).bind('keydown.napokaz-front', function (e) {
            if (front.is(':hidden')) {
                return;
            }
            var handler = {
                27: function() {  // Esc
                    e.preventDefault();
                    front.fadeOut();
                    if (hashCache && $('.napokaz-item' + hashCache).length) {
                        hashCache = '';
                    }
                    window.location.hash = hashCache;
                },
                37: function() {  // <=
                    e.preventDefault();
                    front.trigger('napokaz-active.prev');
                },
                39: function() {  // =>
                    e.preventDefault();
                    front.trigger('napokaz-active.next');
                },
                33: function() {  // PageUp
                    e.preventDefault();
                    front.trigger('napokaz-front-page.prev');
                },
                34: function() {  // PageDown
                    e.preventDefault();
                    front.trigger('napokaz-front-page.next');
                }
            };
            if (handler.hasOwnProperty(e.keyCode)) {
                handler[e.keyCode]();
            }
        });

        return {
            show: function (thumb, opts) {
                var current = thumb.parents('.napokaz-item');
                var inner = front.find('.napokaz-front-inner');
                var controls = front.find('.napokaz-front-items');

                if (front.is(':hidden')) {
                    hashCache = window.location.hash;
                    front.show();
                }

                // Calculate front panels {{{
                var items = thumb.parents('.napokaz-items').find('.napokaz-item');
                if (items.length) {
                    controls.html(items.clone(true));
                    current = controls.find('#' + current.attr('id')).addClass('napokaz-front-page');
                    controls.css({
                        height: controls.height() + 'px',
                        marginTop: '-' + controls.outerHeight() + 'px'
                    });
                }
                inner.css('bottom', controls.outerHeight() + 'px');
                inner.html(tmpl(templates.frontOrig, {
                    orig: orig = thumb.attr('href'),
                    imgmax: getMaxSize(thumb.data('size'), {
                        width: inner.width(),
                        height: inner.height()
                    })
                }));
                inner.css('line-height', inner.height() + 'px');
                // }}}

                items = controls.find('.napokaz-item').removeClass('napokaz-active');
                current.addClass('napokaz-active');
                perPage = Math.min(
                    Math.floor(controls.width() / current.outerWidth()),
                    opts.frontMaxCount
                );
                markPage(current, items, 'napokaz-front-page', perPage);
                window.location.hash = thumb.parents('.napokaz-item').attr('id');
            },
            checkHash: function() {
                if (window.location.hash) {
                    var current = $('.napokaz-item#' + window.location.hash);
                    if (current.length) {
                        current.find('.napokaz-thumb').click();
                    }
                }
            }
        };
    })();

    // Public {{{
    $.fn.napokaz = function(options) {
        options = $.extend({}, $.fn.napokaz.defaults, options);
        return this.each(function() {
            var container = $(this);
            var opts = $.extend({}, options, container.data('options'));
            $.ajax({
                url: picasa.getFeed({user: opts.picasaUser, album: opts.picasaAlbum}),
                data: {
                    kind: 'photo',
                    thumbsize: (
                        opts.thumbSize + (opts.thumbCrop && 'c' || '') + ',' +
                        opts.frontThumbSize + 'c'
                    )
                },
                dataType: 'jsonp',
                success: function(data) {
                    data = picasa.parse(data, opts);
                    container.append(
                        tmpl(templates.thumbItems, {items: data.items.join('')})
                    );
                    addControls(container, opts);

                    container.find('a[rel="' + data.albumId + '"]').click(function() {
                        front.show($(this), opts);
                        return false;
                    });
                    front.checkHash();
                },
                error: function(data, textStatus) {
                    console.error('Don\'t retrieved data from picasaweb', textStatus, data);
                }
            });
        });
    };
    $.fn.napokaz.defaults = defaults;
    // }}}

    // Functions
    function addControls(container, opts) {
        var perPage = opts.sizeX * opts.sizeY;
        var wrap = container.find('.napokaz-items');
        var items = wrap.find('.napokaz-item');
        var item = items.first();
        markPage(item, items, 'napokaz-page', perPage);

        var count = Math.ceil(items.length / perPage);
        if (count > 1) {
            wrap.css({
                width: item.outerWidth() * opts.sizeX + 'px',
                height: item.outerHeight() * opts.sizeY + 'px'
            });
            pager(wrap, '.napokaz-item', 'napokaz-page', function(element, items, marker) {
                markPage(element, items, marker, perPage);
            });

            container.append(tmpl(templates.controls));
            pager(container, '.napokaz-page', 'napokaz-active');
            container.find('.napokaz-prev, .napokaz-next').click(function() {
                var $this = $(this);
                var container = $this.parents('.napokaz').find('.napokaz-items');
                if ($this.hasClass('napokaz-prev')) {
                    container.trigger('napokaz-page.prev');
                } else {
                    container.trigger('napokaz-page.next');
                }
                return false;
            });
        }
    }
    function markPage(current, items, marker, perPage) {
        perPage = perPage ? perPage : 1;
        var active = items.index(current);
        active = Math.floor(active / perPage) * perPage;
        $(items).removeClass(marker).slice(active, active + perPage).addClass(marker);
    }
    function pager(container, selector, marker, activateFunc) {
        function _pager(isNext) {
            var active = container.find(selector + '.' + marker).removeClass(marker);
            active = isNext ? active.last() : active.first();
            var element = isNext ? active.next() : active.prev();
            if (!element.length) {
                element = container.find(selector + (isNext ? ':first': ':last'));
            }
            element.addClass(marker);
            if ($.isFunction(activateFunc)) {
                activateFunc(element, container.find(selector), marker);
            }
        }
        container.bind(marker + '.prev', function() {
            _pager(false);
        });
        container.bind(marker + '.next', function() {
            _pager(true);
        });
    }
    function getMaxSize(img, win) {
        var proportion = img.width / img.height;
        proportion = proportion > 1 && proportion || 1;
        var result = Math.min(win.height * proportion, win.width);
        result = Math.round(result);
        return result;
    }
    // Taken from underscore.js with reformating.
    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    function tmpl(str, data) {
        var c = {
            evaluate    : /\{%([\s\S]+?)%\}/g,
            interpolate : /\{\{([\s\S]+?)\}\}/g
        };
        var fn = new Function('obj',
            "var __p=[];" +
            "var print = function() {" +
                "__p.push.apply(__p, arguments);" +
            "};" +
            "with(obj || {}) {" +
                "__p.push('" +
                    str
                    .replace(/\\/g, '\\\\')
                    .replace(/'/g, "\\'")
                    .replace(c.interpolate, function(match, code) {
                        return "'," + code.replace(/\\'/g, "'") + ",'";
                    })
                    .replace(c.evaluate || null, function(match, code) {
                        code = code.replace(/\\'/g, "'").replace(/[\r\n\t]/g, ' ');
                        return "');" + code + "__p.push('";
                    })
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n')
                    .replace(/\t/g, '\\t') +
                "');" +
            "}" +
            "return __p.join('');"
        );
        return data ? fn(data) : fn;
    }
}(jQuery));
