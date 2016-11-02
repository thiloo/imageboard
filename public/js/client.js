(() => {
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
                model: new ImageModel({id}),
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
                model: new TagModel({tagname}),
                el: '#main'
            });
        }
    });

    var LoadModel = Backbone.Model.extend({
        url() {return'/images?' + $.param({limit: loadCount, offset: loadCount-12});},
        initialize() {this.fetch();}
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
            this.$el.html(Handlebars.templates.images({
                images,
                button: images.length > 10
            }));
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
            $('#flexHolder').append(Handlebars.templates.images({
                images,
                button: images.length > loadCount - 1
            }));
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
            image[0].newTags = JSON.parse(image[0].tags);
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
            this.$el.html(Handlebars.templates.uploadForm());
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
            var parent = $(e.target).parents()[3],
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
            var target = $(e.target.nextElementSibling);
            $(target).html(Handlebars.templates.replyBox());
        }
    });
    var router = new Router();
    Backbone.history.start();
})();
