(() => {
    const templates = document.querySelectorAll('script[type="text/handlebars"]');
    Handlebars.templates = Handlebars.templates || {};
    Array.prototype.slice.call(templates).forEach((script) => {
        Handlebars.templates[script.id] = Handlebars.compile(script.innerHTML);
    });

    let loadCount = 12;

    const Router = Backbone.Router.extend({
        routes: {
            '': 'innitial',
            'image/:id': 'image',
            'upload': 'upload',
            'tags/:tagname': 'tags'
        },
        innitial() {
            new StartView({
                model: new LoadModel,
                el: '#main'
            });
        },
        image(id) {
            new ImageView({
                model: new ImageModel({id}),
                addLike : new AddLikeModel,
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
            new StartView({
                model: new TagModel({tagname}),
                el: '#main'
            });
        }
    });

    const LoadModel = Backbone.Model.extend({
        url() {return'/images?' + $.param({limit: loadCount, offset: loadCount-12});},
        initialize() {this.fetch();}
    });

    const ImageModel = Backbone.Model.extend({
        baseUrl: '/image',
        url() {return this.baseUrl + '/' + this.id;},
        initialize() {this.fetch('id');}
    });

    const TagModel = Backbone.Model.extend({
        baseUrl: '/tags',
        url() {return this.baseUrl + '/' + this.attributes.tagname;},
        initialize() {this.fetch('tagname');}
    });

    const UploadModel = Backbone.Model.extend({
        upload(data) {
            const load = this;
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

    const CommentsModel = Backbone.Model.extend({
        baseUrl: '/comments',
        url() {return this.baseUrl + '/' + this.id;},
        initialize() {this.fetch('id');}
    });

    const AddCommentModel = Backbone.Model.extend({
        add(data) {
            const view = this;
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

    const ReplyCommentModel = Backbone.Model.extend({
        reply(data) {
            this.save(data, {
                type: 'POST'
            });
        },
        url: '/replycomment'
    });

    const AddLikeModel = Backbone.Model.extend({
        add(id) {
            this.save(id, {
                type: 'PUT'
            });
        },
        url: '/addlike'
    });

    const StartView = Backbone.View.extend({
        events: {
            'mouseenter .imageContainer': 'infoBoxMouseEnter',
            'mouseleave .imageContainer': 'infoBoxMouseLeave',
            'mouseleave .info': 'textBoxMouseLeave',
            'click #loadMore' : 'loadMore'
        },
        initialize() {
            this.render();
            this.model.on('change', () => this.render());
            // this.listenTo(this.model, 'change', () => view.render());
        },
        render() {
            let images = this.model.attributes.rows;

            if (!images) return this.$el.html('loading!');

            console.log(images);
            this.$el.html(Handlebars.templates.images({
                images,
                button: images.length > 10
            }));
        },
        infoBoxMouseEnter(e) {
            const target = e.target.nextElementSibling;
            $(target).css('z-index', '5');
        },
        infoBoxMouseLeave(e) {
            const target = e.target.nextElementSibling;
            $(target).css('z-index', '-5');
        },
        textBoxMouseLeave(e) {
            const target = e.target;
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

    const MoreView = Backbone.View.extend({
        initialize() {
            this.render();
            this.model.on('change', () => this.render());
        },
        render() {
            const images = this.model.attributes.rows;

            if (!images) return;

            $('#loadMore').remove();
            $('#flexHolder').append(Handlebars.templates.images({
                images,
                button: images.length > loadCount - 1
            }));
        }
    });

    const ImageView = Backbone.View.extend({
        events: { 'click #likeButton' : 'addLike'},
        initialize(options) {
            this.addLike = options.addLike;
            this.render();
            this.model.on('change', () => this.render());
        },
        render() {
            const image = this.model.attributes.rows;

            if (!image) return this.$el.html('Loading!');

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
        addLike() {
            const id = this.model.attributes.rows[0].id;

            this.addLike.add({id});
            this.addLike.on('change', likes => {
                $('#likeButton').html(likes.attributes.likes + ' Likes');
            });
        }
    });

    const UploadView = Backbone.View.extend({
        initialize() {
            this.render();
            this.model.on('change', () => this.render());
        },
        render() {
            this.$el.html(Handlebars.templates.uploadForm());
        },
        events: {
            'click #submit': 'upload'
        },
        upload() {
            const file = $('input[type="file"]').get(0).files[0],
                title = $('#titleInput').val(),
                description = $('#descriptionInput').val(),
                tags = JSON.stringify($('#tagsInput').val().replace(/\, /g, ',').split(',')),
                formData = new FormData();

            if (!title || !description || !file) return alert('Please fill in all fields!');

            formData.append('file', file);
            this.model.upload({
                title, description,
                file: formData,
                tags: tags || []
            });
        }
    });

    const CommentsView = Backbone.View.extend({
        events: {
            'click #submitReplyButton':'reply',
            'click #submitButton': 'comment',
            'click .replyButton': 'replyField'
        },
        initialize(options) {
            this.commentModel = options.commentModel;
            this.replyModel = options.replyModel;
            this.render();
            this.model.on('change', () => this.render());
        },
        render() {
            const comments = this.model.attributes.rows;

            if (!comments) return this.$el.html('Loading!');

            this.$el.html(Handlebars.templates.commentsView(comments));
        },
        comment() {
            const name = $('#nameInput').val(),
                comment = $('#commentInput').val();

            if(!name || !comment) return alert('Please fill in all fields!');

            this.commentModel.add({
                name, comment,
                image_id: this.id,
                type: 'comment'
            });
            this.model.fetch();
            this.model.on('change', () => this.render());
        },
        reply(e) {
            const parent = $(e.target).parents()[3],
                name = $('#replyNameInput').val(),
                comment =  $('#replyCommentInput').val();
            this.replyModel.reply({
                name, comment,
                comment_id: $(parent).attr('id'),
                image_id: this.id,
                type: 'replyComment'
            });
            this.model.fetch();
            this.model.on('sync', () => this.render());
        },
        replyField(e) {
            const target = $(e.target.nextElementSibling);
            $(target).html(Handlebars.templates.replyBox());
        }
    });
    const router = new Router();
    Backbone.history.start();
})();
