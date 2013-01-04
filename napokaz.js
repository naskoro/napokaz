(function ($) {
    var defaults = {
        boxThumbsize: '72c',
        boxWidth: 3,
        boxHeight: 1,

        frontThumbsize: '60c',
        frontCount: 12,

        // Picasa options
        picasaUser: 'naspeh',
        picasaAlbum: 'Naspeh',
        picasaTags: '',
        picasaIgnore: ''
    };
    var picasa = {
        fetch: function(opts, success) {
            $.ajax({
                url:'https://picasaweb.google.com/data/feed/api/' +
                    ['user', opts.picasaUser, 'album', opts.picasaAlbum].join('/'),
                data: {
                    kind: 'photo',
                    thumbsize: [opts.boxThumbsize, opts.frontThumbsize].join(',')
                },
                dataType: 'jsonp',
                success: function(data) {
                    success(picasa.parse(opts, data));
                },
                error: function(data, textStatus) {
                    console.error(
                        'Don\'t fetch data from picasaweb, status:', textStatus, data
                    );
                }
            });
        },
        parse: function(opts, data) {
            data = $(data);
            var albumId = data.find('gphoto\\:albumid:first').text();
            var items = [];
            data.find('entry').each(function() {
                var $this = $(this);
                var media = $this.find('media\\:group');
                var orig = media.find('media\\:content');
                var thumb = media.find('media\\:thumbnail').first();
                var thumb2 = media.find('media\\:thumbnail').last();
                var item = {
                    'id': $this.find('gphoto\\:id').text(),
                    'albumId': albumId,
                    'picasa': $this.find('link[rel="alternate"]').attr('href'),
                    'orig': {
                        url: orig.attr('url'),
                        width: orig.attr('width'),
                        height: orig.attr('height')
                    },
                    'boxThumb': {
                        url: thumb.attr('url'),
                        size: opts.boxThumbsizeInt
                    },
                    'frontThumb': {
                        url: thumb2.attr('url'),
                        size: opts.frontThumbsizeInt
                    },
                    'title': media.find('media\\:title').text(),
                    'tags': media.find('media\\:keywords').text()
                };
                if (picasa.checkTags(opts, item.tags)) {
                    items.push(item);
                }
            });
            return {
                items: items,
                albumId: albumId
            };
        },
        checkTags: function(opts, tags) {
            tags = tags ? ',' + tags.split(', ').join(',') + ',' : '';
            var ignore = opts.picasaTags && !opts.picasaTags.test(tags);
            ignore = ignore || opts.picasaIgnore && opts.picasaIgnore.test(tags);
            return !ignore;
        },
        preTags: function(tags) {
            tags = tags ? tags.split(',') : [];
            if ($.isArray(tags) && tags.length) {
                tags = tags.join(',|,');
                tags = new RegExp(',' + tags + ',');
            } else {
                tags = undefined;
            }
            return tags;
        }
    };

    var template = (
        // Box on page
        '<div class="napokaz-b">' +
            '{% $.each(items, function(num, item) { %}' +
            '<a class="napokaz-b-thumb"' +
                'href="{{ item.orig.url }}"' +
                'style="' +
                    'background-image: url({{ item.boxThumb.url }});' +
                    'width: {{ item.boxThumb.size }}px;' +
                    'height: {{ item.boxThumb.size }}px"' +
            '>&nbsp;</a>' +
            '{% }); %}' +
        '</div>' +
        // Front
        '<div class="napokaz-f">' +
            '<div class="napokaz-f-overlay"></div>' +
            '<div class="napokaz-f-orig"></div>' +
            '<div class="napokaz-f-thumbs">' +
                '{% $.each(items, function(num, item) { %}' +
                '<div class="napokaz-f-thumb"' +
                    'style="' +
                        'background-image: url({{ item.frontThumb.url }});' +
                        'width: {{ item.frontThumb.size }}px;' +
                        'height: {{ item.frontThumb.size }}px"' +
                '>&nbsp;</div>' +
                '{% }); %}' +
            '</div>' +
        '</div>'
    );

    // Public {{{
    $.fn.napokaz = function(options) {
        options = $.extend({}, $.fn.napokaz.defaults, options);
        return this.each(function() {
            var container = $(this);
            var opts = preOptions($.extend({}, options, container.data()));
            picasa.fetch(opts, function(data) {
                console.log(data);
                container.html(tmpl(template, data));
            });
        });
    };
    $.fn.napokaz.defaults = defaults;
    // }}}

    // Functions
    function preOptions(o) {
        o.boxThumbsizeInt = parseInt(o.boxThumbsize, 10);
        o.frontThumbsizeInt = parseInt(o.frontThumbsize, 10);
        o.picasaTags = picasa.preTags(o.picasaTags);
        o.picasaIgnore = picasa.preTags(o.picasaIgnore);
        return o;
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
