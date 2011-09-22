(function ($) {
    var defaults = {
        thumbSize: 72,
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
                    '<span class="napokaz-thumb-inner" ' +
                        'style="' +
                            'background-image: url({{ thumb.url }});' +
                            'width: {{ thumb.size }}px;' +
                            'height: {{ thumb.size }}px;' +
                        '"' +
                    '>&nbsp;</span>' +
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
        original: (
            '<img class="napokaz-front-orig" src="{{ orig }}?imgmax={{ imgmax }}" />'
        )
    };

    // Public
    $.fn.napokaz = function(options) {
        options = $.extend({}, $.fn.napokaz.defaults, options);

        var hashCache = '';
        var front = $(templates.front);
        $('body').append(front);

        // Set Navigation Key Bindings
        $(document).bind('keydown.napokaz', function (e) {
            var key = e.keyCode;
            if (front.not(':hidden') && key === 27) {
                e.preventDefault();
                front.fadeOut();
                window.location.hash = hashCache;
            }
        });
        return this.each(function() {
            var container = $(this);
            var opts = $.extend({}, options, container.data('options'));
            $.ajax({
                url: getPicasaFeed({user: opts.picasaUser, album: opts.picasaAlbum}),
                data: {
                    kind: 'photo',
                    thumbsize: opts.thumbSize + (opts.thumbCrop && 'c' || '') + ',100c'
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
                                url: $this.find('media\\:group media\\:thumbnail').attr('url'),
                                size: opts.thumbSize
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
                        item = $(items[0]);
                        container.append(item);
                        var sizeX = item.outerWidth() * opts.sizeX;
                        var sizeY = item.outerHeight() * opts.sizeY;
                        item.remove();

                        // Decompose into pages
                        var pages = [];
                        for (var i=0; i<=(count / perPage); i++) {
                            item = items.slice(i*perPage, (i+1)*perPage);
                            item = tmpl(templates.thumbPage, {
                                body: item.join(''),
                                size: {width: sizeX, height: sizeY},
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
                        if (front.is(':hidden')) {
                            hashCache = window.location.hash;
                            front.show();
                        }
                        var inner = front.find('.napokaz-front-inner');
                        inner.html(tmpl(templates.original, {
                            orig: orig = $this.attr('href'),
                            imgmax: getMaxSize(
                                $this.data('size'),
                                {width: inner.width(), height: inner.height()}
                            )
                        }));
                        inner.css('line-height', inner.height() + 'px');
                        window.location.hash = $this.parents('.napokaz-item').attr('id');
                        return false;
                    });

                    if (count > 1) {
                        container.append(tmpl(templates.controls));
                        container.find('.napokaz-prev, .napokaz-next').click(function() {
                            var $this = $(this);
                            var container = $this.parents('.napokaz');
                            var active = container.find('.napokaz-page.napokaz-active');
                            var element, selector;
                            if ($this.hasClass('napokaz-prev')) {
                                element = active.prev();
                                selector = 'last';
                            } else {
                                element = active.next();
                                selector = 'first';
                            }
                            if (!element.length) {
                                element = container.find('.napokaz-page:' + selector);
                            }
                            active.removeClass('napokaz-active');
                            element.addClass('napokaz-active');
                            return false;
                        });
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
