(function() {

    window.site = {
        routes: {},
        views: {},
        models: {}
    };

    var Router = Backbone.Router.extend({
        routes: {
            '': 'innitial',
            'image/:id': 'image',
            'upload': 'upload'
        },
        innitial: function() {
            new UsersView({
                model: new LoadModel,
                el: '#main'
            });
        },
        image: function(id) {
            new ImageView({
                model: new ImageModel({
                    id: id
                }),
                el: '#main'
            });
        },
        upload: function() {
            new UploadView({
                model: new UploadModel,
                el: '#main'
            });
        }
    });

    var LoadModel = Backbone.Model.extend({
        initialize: function() {
            this.fetch();
        },
        url: '/images',
    });

    var ImageModel = Backbone.Model.extend({
        baseUrl: '/image',
        url: function() {return this.baseUrl + '/' + this.id;},
        initialize: function() {
            this.fetch('id');
        }
    });

    var UploadModel = Backbone.Model.extend({
        upload: function(data) {
            var load = this;
            $.ajax({
                url: '/upload',
                method: 'POST',
                data: data.file,
                processData: false,
                contentType: false,
                success: function(path) {
                    data.url = path;
                    load.save(data,
                        {success: function(id) {
                            router.navigate('/image/'+id.id, true);
                        }
                    });
                }
            });
        },
        url: '/store',
        processData: false,
        contentType: false
    });


    var UsersView = Backbone.View.extend({
        initialize: function() {
            this.render();
            var view = this;
            this.model.on('change', function() {
                view.render();
            });
        },
        render: function() {
            var images = this.model.attributes.rows;
            if (!images) {
                this.$el.html('hiya!');
                return;
            }
            var html = '<div class="flexContainer">';
            for (var i = 0; i < images.length; i++) {
                html += '<div class="imageContainer">' + '<a href="/#image/'+images[i].id+'"><img class="image" id="'+images[i].id+'" src="' + images[i].url + '" />'+ '<div class="info"><h3 class="title">'+ images[i].title+ '</h3><br /><p class="description">' + images[i].description + '</p></div></a></div>';
            }
            html += '</div>';
            this.$el.html(html);
        },
        boxMouseOver: function(e) {
            var target = e.target.nextSibling;
            $(target).css('z-index', '5');
        },
        boxMouseOut: function(e) {
            var target = e.target.nextSibling;
            $(target).css('z-index', '-5');
        },
        events: {
            'mouseenter .imageContainer': 'boxMouseOver',
            'mouseleave .imageContainer': 'boxMouseOut',
        }
    });

    var ImageView = Backbone.View.extend({
        initialize: function() {
            this.render();
            var view = this;
            this.model.on('change', function() {
                view.render();
            });
        },
        render: function() {
            var image = this.model.attributes.rows;
            if (!image) {
                this.$el.html('Loading!');
                return;
            }
            var html = '<div class="singleImageFlex"><div class="singleImageContainer"><img class="singleImage" src="'+image[0].url+'" /><br /><h2 class="singleTitle">'+image[0].title+'</h2><p class="singleDescription">'+image[0].description+'</p></div></div>';
            this.$el.html(html);
        },
    });

    var UploadView = Backbone.View.extend({
        initialize: function() {
            this.render();
            var view = this;
            this.model.on('change', function(){
                view.render();
            });
        },
        render : function(){
            var html = '<form class="upload"><input type="text" placeholder="title" id="titleInput"><input type="text" placeholder="description" id="descriptionInput"><input type="file"><input type="button" name="submit" value="Submit" id="submit"></form>';
            this.$el.html(html);
        },
        events: {
            'click #submit': 'upload'
        },
        upload: function(){
            var file = $('input[type="file"]').get(0).files[0];
            var title = $('#titleInput').val();
            var description = $('#descriptionInput').val();
            var formData = new FormData();
            formData.append('file', file);
            this.model.upload({
                file: formData,
                title: title,
                description: description
            });
        }
    });

    var router = new Router();
    Backbone.history.start();
})();
