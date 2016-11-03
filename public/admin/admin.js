(()=>{
    var adminApp = angular.module('adminApp', []);
    var loadCount = 12;

    adminApp.controller('imageList', ($scope, $http) => {
        $scope.load = () => {
            $http.get('/images',{
                params: {
                    limit: loadCount,
                    offset: loadCount - 12
                }})
                .then(images => {
                    loadCount += 12;
                    if (!$scope.images) {
                        $scope.images = images.data.rows;
                    } else {
                        $scope.images = $scope.images.concat(images.data.rows);
                    }
                    $http.get('/admin/comments', {
                        // get the comments relating to the loaded images 
                        params: {
                            limit: images.data.rows[0].id,
                            offset: images.data.rows[11].id
                        }
                    })
                    .then(comments => {
                        if (!$scope.comments) {
                            $scope.comments = comments.data.rows;
                        } else {
                            $scope.comments = $scope.comments.concat(comments.data.rows);
                        }
                    });
                });
        };
        $scope.load();

        $scope.deleteImage = ($event) => {
            var parent = $event.path[2];
            $http.delete('/admin/image/'+parent.id.replace('image-', '')).then(() => parent.remove());
        };

        $scope.updateText = ($event) => {
            var parent = $event.target.parentElement,
                title = angular.element(angular.element(parent).children()[1]).val(),
                description = angular.element(angular.element(parent).children()[2]).val();

            $http.put('/admin/image/'+parent.id.replace('image-', ''), {title, description}).then((resp) => console.log(resp));
        };

        $scope.updateComment = ($event) => {
            var parent = $event.target.parentElement,
                comment = angular.element(angular.element(parent).children()[0]).val();
            $http.put('/admin/comment/'+parent.id.replace('comment-', ''), {comment}).then((resp) => console.log(resp));
        };

        $scope.deleteComment = ($event) => {
            var parent = $event.target.parentElement;
            $http.delete('/admin/comment/'+parent.id.replace('comment-', '')).then(() => parent.remove());
        };
    });

})();
