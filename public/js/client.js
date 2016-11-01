(function() {
    var templates = document.querySelectorAll('script[type="text/handlebars"]');
    Handlebars.templates = Handlebars.templates || {};
    Array.prototype.slice.call(templates).forEach((script) => {
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
        innitial() {
            new UsersView({
                model: new LoadModel,
                el: '#main'
            });
        },
        image(id) {
            new ImageView({
                model: new ImageModel({
                    id: id
                }),
                el: '#main'
            });
        },
        upload() {
            new UploadView({
                model: new UploadModel,
                el: '#main'
            });
        },
        tags(tagname) {
            new UsersView({
                model: new TagModel({
                    tagname: tagname
                }),
                el: '#main'
            });
        }
    });

    var LoadModel = Backbone.Model.extend({
        initialize() {this.fetch();},
        url() {return'/images?' + $.param({limit: loadCount, offset: loadCount-12});}
    });

    var ImageModel = Backbone.Model.extend({
        baseUrl: '/image',
        url() {return this.baseUrl + '/' + this.id;},
        initialize() {this.fetch('id');}
    });

    var TagModel = Backbone.Model.extend({
        baseUrl: '/tags',
        url() {return this.baseUrl + '/' + this.attributes.tagname;},
        initialize() {this.fetch('tagname');}
    });

    var UploadModel = Backbone.Model.extend({
        upload(data) {
            var load = this;
            $.ajax({
                url: '/upload',
                method: 'POST',
                data: data.file,
                processData: false,
                contentType: false,
                success(path) {
                    data.url = path;
                    load.save(data, {
                        success(id) {return router.navigate('/image/' + id.id, true);}
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
        url() {return this.baseUrl + '/' + this.id;},
        initialize() {this.fetch('id');}
    });

    var AddCommentModel = Backbone.Model.extend({
        add(data) {
            var view = this;
            this.save(data, {
                type: 'POST',
                success(data) {
                    view.save(data.attributes.id, {
                        type: 'PUT'
                    });
                }
            });
        },
        url: '/addcomment'
    });

    var ReplyCommentModel = Backbone.Model.extend({
        reply(data) {
            this.save(data, {
                type: 'POST'
            });
        },
        url: '/replycomment'
    });

    var UsersView = Backbone.View.extend({
        events: {
            'mouseenter .imageContainer': 'boxMouseOver',
            'mouseleave .imageContainer': 'boxMouseOut',
            'click #loadMore' : 'loadMore'
        },
        initialize() {
            this.render();
            var view = this;
            this.model.on('change', () => view.render());
        },
        render() {
            var images = this.model.attributes.rows;
            if (!images) {
                return this.$el.html('loading!');
            }
            this.$el.html(Handlebars.templates.images(images));
        },
        boxMouseOver(e) {
            var target = e.target.nextElementSibling;
            $(target).css('z-index', '5');
        },
        boxMouseOut(e) {
            var target = e.target.nextElementSibling;
            $(target).css('z-index', '-5');
        },
        loadMore() {
            loadCount += 12;
            new MoreView({
                model: new LoadModel,
                el: '#main'
            });
        }
    });

    var MoreView = Backbone.View.extend({
        initialize() {
            var view = this;
            this.render();
            this.model.on('change', () => view.render());
        },
        render() {
            var images = this.model.attributes.rows;
            if (!images) {
                return;
            }
            $('#loadMore').remove();
            $('#flexHolder').append(Handlebars.templates.images(images));
        }
    });

    var ImageView = Backbone.View.extend({
        initialize() {
            var view = this;
            this.render();
            this.model.on('change', () => view.render());
        },
        render() {
            var image = this.model.attributes.rows;
            if (!image) {
                return this.$el.html('Loading!');
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
        initialize() {
            var view = this;
            this.render();
            this.model.on('change', () => view.render());
        },
        render() {
            var html = '<form class="upload"><input type="text" placeholder="title" id="titleInput"><input type="text" placeholder="description" id="descriptionInput"><input type="text" placeholder="tags" id="tagsInput"><input type="file"><input type="button" name="submit" value="Submit" id="submit"></form>';
            this.$el.html(html);

        },
        events: {
            'click #submit': 'upload'
        },
        upload() {
            var file = $('input[type="file"]').get(0).files[0],
                title = $('#titleInput').val(),
                description = $('#descriptionInput').val(),
                tags = JSON.stringify($('#tagsInput').val().replace(/\, /g, ',').split(',')),
                formData = new FormData();
            formData.append('file', file);
            this.model.upload({
                title, description,
                file: formData,
                tags: tags || []
            });
        }
    });

    var CommentsView = Backbone.View.extend({
        events: {
            'click #submitReplyButton':'reply',
            'click #submitButton': 'comment',
            'click .replyButton': 'replyField'
        },
        initialize(options) {
            var view = this;
            this.commentModel = options.commentModel;
            this.replyModel = options.replyModel;
            this.render();
            this.model.on('change', () => view.render());
        },
        render() {
            var comments = this.model.attributes.rows;
            if (!comments) {
                return this.$el.html('Loading!');
            }
            this.$el.html(Handlebars.templates.commentsView(comments));
        },
        comment() {
            var name = $('#nameInput').val(),
                comment = $('#commentInput').val(),
                view = this;
            this.commentModel.add({
                name, comment,
                image_id: this.id,
                type: 'comment'
            });
            this.model.fetch();
            this.model.on('change', () => view.render());
        },
        reply(e) {
            var parent = $(e.target).parents()[2],
                name = $('#replyNameInput').val(),
                comment =  $('#replyCommentInput').val(),
                view = this;
            this.replyModel.reply({
                name, comment,
                comment_id: $(parent).attr('id'),
                image_id: this.id,
                type: 'replyComment'
            });
            this.model.fetch();
            this.model.on('change', () => view.render());
        },
        replyField(e) {

            var target = $(e.target.nextElementSibling),
                html = $(target).html();
            html += '<div class="commentFormContainer"><form class="commentForm" id="replyComment"><input type="text" required placeholder="Name" class="commentField" id="replyNameInput"/><input type="text" required placeholder="Comment" class="commentField" id="replyCommentInput"/><input type="button" name="name" value="Submit Comment" id="submitReplyButton"></form></div>';
            $(target).html(html);
        }
    });
    var router = new Router();
    Backbone.history.start();
})();
