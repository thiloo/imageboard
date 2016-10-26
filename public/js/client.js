(function(){
    var Router = Backbone.Router.extend({
        routes: {
            'images': 'images'
        },
        images: function() {
            console.log('yoyo');
            new UsersView({
                model: usersModel,
                el: '#main'
            });
        }
    });

    var UsersModel = Backbone.Model.extend({
        initialize: function() {
            this.fetch();
        },
        url: '/images',
    });

    var usersModel = new UsersModel;


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
            for (var html = '', i = 0; i < images.length; i++) {
                html += '<div>' + images[i].title + ',' + images[i].description + '</div>';
            }
            this.$el.html(html);
        }


    });
    var router = new Router();
    Backbone.history.start();
})();
