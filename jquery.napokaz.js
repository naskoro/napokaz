(function ($) {
    var defaults = {
        thumbSize: 72,
        thumbFrontSize: 72,
        thumbCrop: true,
        picasaUser: 'naspeh',
        picasaAlbum: 'Naspeh',
        sizeX: 3,
        sizeY: 1
    };
    var templates = {
        thumbItems: (
            '<div class="napokaz-items">{{ items }}</div>'
        ),
        thumbPage : (
            '<div class="napokaz-page {% if (active) { %}napokaz-active{% } %}" ' +
                'style="height:{{ size.height }}px; width: {{ size.width }}px"' +
            '>{{ body }}</div>'
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
                '   <div class="napokaz-front-inner"></div>' +
                '</div>' +
                '<div class="napokaz-front-items"></div>' +
            '</div>'
        ),
        frontOrig: (
            '<img class="napokaz-front-orig" src="{{ orig }}?imgmax={{ imgmax }}" />'
        )
    };

    // Public
    $.fn.napokaz = function(options) {
        options = $.extend({}, $.fn.napokaz.defaults, options);

        var hashCache = '';
        var front = $(templates.front);
        $('body').append(front);
        pager(front, 'napokaz-item', function(element) {
            element.find('.napokaz-thumb').click();
        });

        // Set Navigation Key Bindings
        $(document).bind('keydown.napokaz', function (e) {
            if (front.is(':hidden')) {
                return;
            }
            var key = e.keyCode;
            if (key === 27) {
                e.preventDefault();
                front.fadeOut();
                var current = $('.napokaz-item#' + hashCache);
                if (current.length) {
                    hashCache = '';
                }
                window.location.hash = hashCache;
            }
            if (key === 37) {
                e.preventDefault();
                front.trigger('napokaz-item.prev');
            } else if (key === 39) {
                e.preventDefault();
                front.trigger('napokaz-item.next');
            }
        });

        return this.each(function() {
            var container = $(this);
            var opts = $.extend({}, options, container.data('options'));
            $.ajax({
                url: getPicasaFeed({user: opts.picasaUser, album: opts.picasaAlbum}),
                data: {
                    kind: 'photo',
                    thumbsize: opts.thumbSize + (opts.thumbCrop && 'c' || '') + ',' + opts.thumbFrontSize + 'c'
                },
                dataType: 'jsonp',
                success: function(data) {
                    var $data = $(data);
                    var albumId = $data.find('gphoto\\:albumid:first').text();
                    var items = [];
                    $data.find('entry').each(function() {
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
                                size: opts.thumbFrontSize
                            },
                            'albumId': albumId,
                            'id': $this.find('gphoto\\:id').text()
                        };
                        item = tmpl(templates.thumbItem, item);
                        items.push(item);
                    });
                    var count = items.length;

                    var perPage = opts.sizeX * opts.sizeY;
                    if (count > perPage) {
                        // Calculate size of page;
                        container.append(tmpl(templates.thumbItems, {items: ''}));
                        item = container.find('.napokaz-items');
                        item.append(items[0]);
                        var size = {
                            width: item.width() * opts.sizeX,
                            height: item.height() * opts.sizeY
                        };
                        item.remove();

                        // Decompose into pages
                        var pages = [];
                        for (var i=0; i<=(count / perPage); i++) {
                            item = items.slice(i*perPage, (i+1)*perPage);
                            item = tmpl(templates.thumbPage, {
                                body: item.join(''),
                                size: size,
                                active: !i
                            });
                            pages.push(item);
                        }
                        items = pages;
                        count = items.length;
                    } else {
                        count = 1;
                    }
                    items = tmpl(templates.thumbItems, {items: items.join('')});
                    container.append(items);
                    container.find('a[rel="' + albumId + '"]').click(function() {
                        var $this = $(this);

                        $this.parents('.napokaz-items').find('.napokaz-item').removeClass('napokaz-active');
                        $this.parents('.napokaz-front-items').find('.napokaz-item').removeClass('napokaz-active');
                        $this.parents('.napokaz-item').addClass('napokaz-active');

                        if (front.is(':hidden')) {
                            hashCache = window.location.hash;
                            front.show();
                        }
                        var inner = front.find('.napokaz-front-inner');
                        inner.html(tmpl(templates.frontOrig, {
                            orig: orig = $this.attr('href'),
                            imgmax: getMaxSize(
                                $this.data('size'),
                                {width: inner.width(), height: inner.height()}
                            )
                        }));
                        var items = $this.parents('.napokaz-items').find('.napokaz-item');
                        if (items.length) {
                            item = items.find('.napokaz-thumb2-inner');
                            var controls = front.find('.napokaz-front-items');
                            controls.html(items.clone(true));
                            controls.css({
                                //width: Math.floor(inner.width() / item.width()) * item.width(),
                                height: item.height() + 'px',
                                marginTop: '-' + controls.innerHeight() + 'px'
                            });
                        }

                        window.location.hash = $this.parents('.napokaz-item').attr('id');

                        // Fix CSS
                        inner.css('line-height', inner.height() + 'px');
                        return false;
                    });

                    if (count > 1) {
                        container.append(tmpl(templates.controls));
                        pager(container, 'napokaz-page');
                        container.find('.napokaz-prev, .napokaz-next').click(function() {
                            var $this = $(this);
                            var container = $this.parents('.napokaz');
                            if ($this.hasClass('napokaz-prev')) {
                                container.trigger('napokaz-page.prev');
                            } else {
                                container.trigger('napokaz-page.next');
                            }
                            return false;
                        });
                    }

                    if (!window.location.hash) {
                        return;
                    }
                    var current = $('.napokaz-item#' + window.location.hash);
                    if (current.length) {
                        current.find('.napokaz-thumb').click();
                    }
                },
                error: function(data, textStatus) {
                    console.error('Don\'t retrieved data from picasaweb', textStatus, data);
                }
            });
        });
    };
    $.fn.napokaz.defaults = defaults;

    // Functions
    function _pager(container, name, activateFunc, isNext) {
        var active = container.find('.' + name + '.napokaz-active').removeClass('napokaz-active');
        var element = isNext ? active.next() : active.prev();
        if (!element.length) {
            element = container.find('.' + name + (isNext ? ':first': ':last'));
        }
        element.addClass('napokaz-active');
        activateFunc(element);
    }
    function pager(container, name, activateFunc) {
        container.bind(name + '.prev', function() {
            _pager(container, name, activateFunc, false);
        });
        container.bind(name + '.next', function() {
            _pager(container, name, activateFunc, true);
        });
    }
    function getPicasaFeed(params) {
        var feed = 'https://picasaweb.google.com/data/feed/api/';
        $.each(params, function(key, value){
            feed += key + '/' + value + '/';
        });
        return feed;
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
