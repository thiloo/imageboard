(function() {
    var templates = document.querySelectorAll('script[type="text/handlebars"]');
    Handlebars.templates = Handlebars.templates || {};
    Array.prototype.slice.call(templates).forEach(function(script) {
        Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
    });

    var loadCount = 12;

    var Router = Backbone.Router.extend({
        routes: {
            '': 'innitial',
            'image/:id': 'image',
            'upload': 'upload',
            'tags/:tagname': 'tags'
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
        },
        tags: function(tagname) {
            new UsersView({
                model: new TagModel({
                    tagname: tagname
                }),
                el: '#main'
            });
        }
    });

    var LoadModel = Backbone.Model.extend({
        initialize: function() {
            this.fetch();
        },
        url: function(){return '/images?' + $.param({limit: loadCount, offset: loadCount-12});},
    });

    var ImageModel = Backbone.Model.extend({
        baseUrl: '/image',
        url: function() {return this.baseUrl + '/' + this.id;},
        initialize: function() {
            this.fetch('id');
        }
    });

    var TagModel = Backbone.Model.extend({
        baseUrl: '/tags',
        url: function() {return this.baseUrl + '/' + this.attributes.tagname;},
        initialize: function() {
            this.fetch('tagname');
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
                this.$el.html('loading!');
                return;
            }
            this.$el.html(Handlebars.templates.images(images));
        },
        boxMouseOver: function(e) {
            var target = e.target.nextElementSibling;
            console.log(target);
            $(target).css('z-index', '5');
        },
        boxMouseOut: function(e) {
            var target = e.target.nextElementSibling;
            $(target).css('z-index', '-5');
        },
        loadMore:  function() {
            loadCount += 12;
            new MoreView({
                model: new LoadModel,
                el: '#main'
            });
        },
        events: {
            'mouseenter .imageContainer': 'boxMouseOver',
            'mouseleave .imageContainer': 'boxMouseOut',
            'click #loadMore' : 'loadMore'
        }
    });

    var MoreView = Backbone.View.extend({
        initialize: function() {
            this.render();
            var view = this;
            this.model.on('change', function(){
                view.render();
            });
        },
        render: function() {
            var images = this.model.attributes.rows;
            if (!images) {
                return;
            }
            $('#loadMore').remove();
            $('#flexHolder').append(Handlebars.templates.images(images));
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
            this.$el.html(Handlebars.templates.singleImageView(image));
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
            var html = '<form class="upload"><input type="text" placeholder="title" id="titleInput"><input type="text" placeholder="description" id="descriptionInput"><input type="text" placeholder="tags" id="tagsInput"><input type="file"><input type="button" name="submit" value="Submit" id="submit"></form>';
            this.$el.html(html);

        },
        events: {
            'click #submit': 'upload'
        },
        upload: function(){
            var file = $('input[type="file"]').get(0).files[0];
            var title = $('#titleInput').val();
            var description = $('#descriptionInput').val();
            var tags = JSON.stringify($('#tagsInput').val().replace(/\, /g, ',').split(','));
            console.log(tags);
            var formData = new FormData();
            formData.append('file', file);
            this.model.upload({
                file: formData,
                title: title,
                description: description,
                tags: tags || []
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
            this.$el.html(Handlebars.templates.commentsView(comments));
        },

        //add comments enter
        events: {
            'click #submitReplyButton':'reply',
            'click #submitButton': 'comment',
            'click .replyButton': 'replyField'
        },
        comment: function(){
            console.log('clicked');
            var name = $('#nameInput').val();
            var comment = $('#commentInput').val();
            this.commentModel.add({
                image_id: this.id,
                name: name,
                comment: comment,
                type: 'comment'
            });
            var view = this;
            this.model.fetch();
            this.model.on('change', function() {
                view.render();
            });
        },
        reply: function(e){
            var parent = $(e.target).parents()[2];
            var name = $('#replyNameInput').val();
            var comment =  $('#replyCommentInput').val();
            this.replyModel.reply({
                comment_id: $(parent).attr('id'),
                image_id: this.id,
                name: name,
                comment: comment,
                type: 'replyComment'
            });
            this.model.fetch();
            var view = this;
            this.model.on('change', () => view.render());
        },
        replyField: function(e){

            var target = $(e.target.nextElementSibling);
            console.log(target);
            var html = $(target).html();
            html += '<div class="commentFormContainer"><form class="commentForm" id="replyComment"><input type="text" required placeholder="Name" class="commentField" id="replyNameInput"/><input type="text" required placeholder="Comment" class="commentField" id="replyCommentInput"/><input type="button" name="name" value="Submit Comment" id="submitReplyButton"></form></div>';
            $(target).html(html);
        }
    });
    var router = new Router();
    Backbone.history.start();
})();
