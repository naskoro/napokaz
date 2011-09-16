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
        'thumbItem': (
            '<div class="napokaz-item">' +
            '   <a class="napokaz-thumb" href="<%= orig %>">' +
            '       <span class="napokaz-thumb-inner"' +
            '           style="' +
            '               background-image: url(<%= thumb %>);' +
            '               width: <%= thumbSize %>px;' +
            '               height: <%= thumbSize %>px;' +
            '           "' +
            '       >&nbsp;</span>' +
            '   </a>' +
            '   <div class="napokaz-info">' +
            '       <a href="<%= picasa %>">Посмотерть в picasa</a>' +
            '   </div>' +
            '</div>'
        ),
        'thumbPage' : (
            '<div class="napokaz-page <% if (active) { %>napokaz-active<% } %>"' +
            '   style="height:<%= y %>px; width: <%= x %>px"' +
            '><%= page %></div>'
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

                    var perPage = opts.sizeX * opts.sizeY;
                    if (perPage > 1 && items.length > perPage) {
                        // Evaluate page size;
                        item = $(items[0]);
                        container.append(item);
                        var sizeX = item.outerWidth() * opts.sizeX;
                        var sizeY = item.outerHeight() * opts.sizeY;
                        item.remove();

                        // Lay out on pages
                        var pages = [];
                        for (var i=0; i<=(items.length / perPage + 1); i++) {
                            item = items.slice(i*perPage, (i+1)*perPage);
                            item = _.template(templates.thumbPage, {
                                page: item.join(''),
                                x: sizeX,
                                y: sizeY,
                                active: !i
                            });
                            pages.push(item);
                        }
                        items = pages;
                    }
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
        $.each(params, function(key, value){
            feed += key + '/' + value + '/';
        });
        return feed;
    }
}(jQuery));
