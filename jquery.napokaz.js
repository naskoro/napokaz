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
                    $(data).find('entry').each(function() {
                        var $this = $(this);
                        var item = {
                            'orig': $this.find('media\\:group media\\:content').attr('url'),
                            'thumb': $this.find('media\\:group media\\:thumbnail').attr('url'),
                            'picasa': $this.find('link[rel="alternate"]').attr('href'),
                            'thumbsize': opts.thumbsize
                        };
                        item = getThumbStr(item);
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

    function getThumbStr(params) {
        var str = (
            '<div class="napokaz-item">' +
            '   <a class="napokaz-thumb" href="<%= orig %>">' +
            '       <img src="<%= thumb %>" width="<%= thumbsize %>" height="<%= thumbsize %>" />' +
            '   </a>' +
            '   <div class="napokaz-info">' +
            '       <a href="<%= picasa %>">Посмотерть в picasa</a>' +
            '   </div>' +
            '</div>'
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
