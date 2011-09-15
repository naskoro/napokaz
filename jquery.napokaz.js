(function ($) {
    var defaults = {
        thumbsize: 72,
        picasa: {
            user: 'naspeh',
            album: 'Naspeh'
        }
    };
    $.fn.napokaz = function(options) {
        options = $.extend({}, $.fn.napokaz.defaults, options);
        return this.each(function() {
            var container = $(this);
            var opts = $.extend({}, options, container.data('options'));
            $.ajax({
                url: getPicasaFeed(opts.picasa),
                data: {
                    kind: 'photo',
                    thumbsize: opts.thumbsize + 'c'
                },
                dataType: 'jsonp',
                success: function(data) {
                    var items = [];
                    $(data).find('media\\:group').each(function() {
                        var $this = $(this);
                        var item = {
                            'orig': $this.find('media\\:content').attr('url'),
                            'thumb': $this.find('media\\:thumbnail').attr('url'),
                            'thumbsize': opts.thumbsize
                        };
                        item = getThumbItem(item);
                        items.push(item);
                    });
                    container.append(items.join(''));
                },
                error: function(data, textStatus) {
                    console.error('Don\'t retrieved data from picasaweb', textStatus, data);
                }
            });
        });
    };
    $.fn.napokaz.defaults = defaults;

    function getThumbItem(params) {
        var str = (
            '<a class="napokaz-thumb" href="<%= orig %>">' +
            '   <span class="napokaz-thumb-inner"  style="' +
            '       background-image: url(<%= thumb %>);' +
            '       width: <%= thumbsize %>px; height: <%= thumbsize %>px;' +
            '   ">&nbsp;</span>' +
            '</a>'
        );
        return _.template(str, params);
    }
    function getPicasaFeed(params) {
        var feed = 'https://picasaweb.google.com/data/feed/api/';
        _.each(params, function(value, key){
            feed += key + '/' + value + '/';
        });
        return feed;
    }
}(jQuery));
