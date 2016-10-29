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
            // new CommentsView({
            //     model: new CommentsModel({
            //         id: id
            //     }),
            //     el: '#comments'
            // });
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
            this.fetch('limit');
        },
        url: function(){return '/images?' + $.param({limit: this.limit || 12});},
    });

    var MoreLoadModel = Backbone.Model.extend({
        initialize: function() {
            this.fetch('limit');
        },
        url: function(){return '/images?' + $.param({limit: 24});},
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

    var CommentsModel = Backbone.Model.extend({
        baseUrl: '/comments',
        url: function() {return this.baseUrl + '/' + this.id;},
        initialize: function() {
            this.fetch('id');
        }
    });

    var AddCommentModel = Backbone.Model.extend({
        add: function(data){
            var view = this;
            this.save(data, {
                type: 'POST',
                success: function(data){
                    view.save(data.attributes.id, {
                        type: 'PUT'
                    });
                }
            });
        },
        url: '/addcomment'
    });

    var ReplyCommentModel = Backbone.Model.extend({
        reply: function(data) {
            this.save(data, {
                type: 'POST'
            });
        },
        url: '/replycomment'
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
            html += '<br /><button id="loadMore">Load More</button></div>';
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
        loadMore:  function() {
            new UsersView({
                model: new MoreLoadModel,
                el: '#main'
            });
        },
        events: {
            'mouseenter .imageContainer': 'boxMouseOver',
            'mouseleave .imageContainer': 'boxMouseOut',
            'click #loadMore' : 'loadMore'
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
            var html = '<div class="singleImageFlex"><div class="singleImageContainer" id="singleImageContainer"><img class="singleImage" src="'+image[0].url+'" /><br /><h2 class="singleTitle">'+image[0].title+'</h2><p class="singleDescription">'+image[0].description+'</p><div id="comments"></div></div></div>';
            this.$el.html(html);
            new CommentsView({
                model: new CommentsModel({
                    id: image[0].id
                }),
                commentModel: new AddCommentModel,
                replyModel: new ReplyCommentModel,
                id: image[0].id,
                el: '#comments'
            });
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

    var CommentsView = Backbone.View.extend({
        initialize: function(options) {
            this.commentModel = options.commentModel;
            this.replyModel = options.replyModel;

            this.render();
            var view = this;
            this.model.on('change', function() {
                view.render();
            });
        },
        render: function(){
            var comments = this.model.attributes.rows;
            if (!comments) {
                this.$el.html('Loading!');
                return;
            }
            console.log(comments);
            var html = '<form class="commentForm"><input type="text" required placeholder="Name" class="commentField" id="nameInput"/><input type="text" required placeholder="Comment" class="commentField" id="commentInput"/><input type="button" name="name" value="Submit Comment" id="submitButton"></form>';
            for (var i = 0; i < comments.length; i++) {
                html += '<div class="'+comments[i].type+'"><h3 class="title">'+ comments[i].name+ '</h3><br /><p class="description">' + comments[i].comment + '</p><div class="reply" id="'+comments[i].id+'"><button type="button" class="replyButton" >Reply</button></div></div>';
            }
            this.$el.html(html);
        },

        //add comments enter
        events: {
            'click #submitReplyButton':'reply',
            'click #submitButton': 'comment',
            'click .replyButton': 'replyField'
        },
        comment: function(){
            var name = $('#nameInput').val();
            var comment = $('#commentInput').val();
            this.commentModel.add({
                image_id: this.id,
                name: name,
                comment: comment,
                type: 'comment'
            });
            var view = this;
            this.commentModel.on('sync', function(response) {
                var html = view.$el.html();
                console.log(html);
                html += '<div class="'+response.attributes.type+'"><h3 class="title">'+ name + '</h3><br /><p class="description">' + comment + '</p><div class="reply" id="'+response.attributes.comment_id+'"><button type="button" class="replyButton" >Reply</button></div></div>';
                view.$el.html(html);
                html = '';
            });
        },
        reply: function(e){
            var parent = $(e.target).parents()[1];
            var name = $('#replyNameInput').val();
            var comment =  $('#replyCommentInput').val();
            this.replyModel.reply({
                comment_id: $(parent).attr('id'),
                image_id: this.id,
                name: name,
                comment: comment,
                type: 'replyComment'
            });
            // var view = this;
            this.replyModel.on('sync', function(response){
                $('#replyComment').remove();
                var html = $(parent).html();
                html += '<div class="replyComment"><h3 class="title">'+ name + '</h3><br /><p class="description">' + comment + '</p><div class="reply" id="'+response.attributes.comment_id+'"><button type="button" class="replyButton" >Reply</button></div></div>';
                $(parent).html(html);
                console.log(response);
            });
            console.log('clicked'); //add possibility to reply
        },
        replyField: function(e){

            var target = $(e.target).parent()[0];
            var html = $(target).html();
            html += '<form class="commentForm" id="replyComment"><input type="text" required placeholder="Name" class="commentField" id="replyNameInput"/><input type="text" required placeholder="Comment" class="commentField" id="replyCommentInput"/><input type="button" name="name" value="Submit Comment" id="submitReplyButton"></form>';
            $(target).html(html);
        }

    });

    var router = new Router();
    Backbone.history.start();
})();
