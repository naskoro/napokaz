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

    // Public {{{
    $.fn.napokaz = function(options) {
        options = $.extend({}, $.fn.napokaz.defaults, options);
        return this.each(function() {
            var container = $(this);
            var opts = preOptions($.extend({}, options, container.data()));
            picasa.fetch(opts, function(data) {
                console.log(data);
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
}(jQuery));
