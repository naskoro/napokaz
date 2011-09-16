(function ($) {
    var defaults = {
        thumbSize: 72,
        thumbCrop: true,
        picasaUser: 'naspeh',
        picasaAlbum: 'Naspeh'
    };
    var templates = {
        'thumbItem': (
            '<div class="napokaz-item">' +
            '   <a class="napokaz-thumb" href="<%= orig %>"' +
            '       style="width: <%= thumbSize %>px;height: <%= thumbSize %>px; line-height: <%= thumbSize %>px;"' +
            '   >' +
            '       <img src="<%= thumb %>" />' +
            '   </a>' +
            '   <div class="napokaz-info">' +
            '       <a href="<%= picasa %>">Посмотерть в picasa</a>' +
            '   </div>' +
            '</div>'
        )
    };

    // Public
    $.fn.napokaz = function(options) {
        options = $.extend({}, $.fn.napokaz.defaults, options);
        return this.each(function() {
            var container = $(this);
            var opts = $.extend({}, options, container.data('options'));
            $.ajax({
                url: getPicasaFeed({user: opts.picasaUser, album: opts.picasaAlbum}),
                data: {
                    kind: 'photo',
                    thumbsize: opts.thumbSize + (opts.thumbCrop && 'c' || '')
                },
                dataType: 'jsonp',
                success: function(data) {
                    var items = [];
                    $(data).find('entry').each(function() {
                        var $this = $(this);
                        var item = {
                            'picasa': $this.find('link[rel="alternate"]').attr('href'),
                            'orig': $this.find('media\\:group media\\:content').attr('url'),
                            'thumb': $this.find('media\\:group media\\:thumbnail').attr('url'),
                            'thumbSize': opts.thumbSize
                        };
                        item = _.template(templates.thumbItem, item);
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

    // Functions
    function getPicasaFeed(params) {
        var feed = 'https://picasaweb.google.com/data/feed/api/';
        _.each(params, function(value, key){
            feed += key + '/' + value + '/';
        });
        return feed;
    }
}(jQuery));
