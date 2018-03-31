var app = angular.module('youtubePlayer', []);
app.controller('youtubePlayerController', function ($scope, $http) {
    'use strict';
    $scope.videos = [{
            'url': 'https://www.youtube.com/watch?v=MDFm7jl1WMk',
            'id': 1,

        },
        {
            'url': 'https://www.youtube.com/watch?v=8mweiZlvxsE',
            'id': 2,

        }
    ];
});

app.filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        var video_id = url.split('v=')[1].split('&')[0];
        return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + video_id);
    };
}]);







//$(document).ready(() => {
//    $('#searchForm').on('submit', (e) => {
//        var searchText = $('#searchText').val();
//        addVideo(searchText);
//        e.preventDefault();
//    });
//});
//

//$(document).ready(function () {
//    $('#searchForm').on('click', function (e) {
//        var searchText = $('#searchText').val();
//        console.log(searchText);
//        if ($('#searchText')) {
//            addVideo(searchText);
//
//        }
//        e.preventDefault();
//    })
//})
//
//function addVideo(searchText) {
//    var output = '';
//    output = `
//          <div class="col-4">
//            <div class="card">
//              <div class="card-body">
//                <iframe width="560" height="315" src="https://www.youtube.com/embed/${searchText}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
//              </div>
//            </div>
//          </div>
//`
//
//    //    console.log(output);
//    $('#videos').html(output);
//}
