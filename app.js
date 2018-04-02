var app = angular.module('youtubePlayer', []);

app.run(function () {
    var tag = document.createElement('script');
    tag.src = "http://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

app.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

app.controller('youtubePlayerController', function ($scope, $http, $window, $log, VideosService) {
    'use strict';

    init();

    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = VideosService.getResults();
        $scope.history = VideosService.getHistory();
    }


    $scope.videos = [{
            'url': 'https://www.youtube.com/watch?v=MDFm7jl1WMk',
            'id': 1

    },
        {
            'url': 'https://www.youtube.com/watch?v=8mweiZlvxsE',
            'id': 2

        }
        ];

    $scope.addVideo = function (url) {
        $scope.videos.push({
            url: $scope.videoInput
        });
        $scope.videoInput = '';
    };
    $scope.search = function (isNewQuery) {
        $scope.loading = true;
        $http.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    key: 'AIzaSyBh5MnjkpY2a2Z6tgT4_jqauH7Za2w4Sc4',
                    type: 'video',
                    maxResults: '10',
                    pageToken: isNewQuery ? '' : $scope.nextPageToken,
                    part: 'id,snippet',
                    fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle,nextPageToken',
                    q: this.query
                }
            })
            .then(function (data) {
                //                console.log(data.data.items[0].snippet.title);
                var results = data.data.items[0].snippet.title;
                console.log(results);
                if (data.data.items.length) {
                    $scope.label = 'No results were found!';
                }
                VideosService.listResults(data, $scope.nextPageToken && !isNewQuery);
                $scope.nextPageToken = data.nextPageToken;
                $log.info(data);
            }), (function () {
                $log.info('Search error');
            }), (function () {
                $scope.loadMoreButton.stopSpin();
                $scope.loadMoreButton.setDisabled(false);
                $scope.loading = false;
            });
    };

    $scope.launch = function (video, archive) {
        VideosService.launchPlayer(video.id, video.title);
        if (archive) {
            VideosService.archiveVideo(video);
        }
        $log.info('Launched id:' + video.id + ' and title:' + video.title);
    };
});


app.service('VideosService', ['$window', '$rootScope', '$log', function ($window, $rootScope, $log) {

    var service = this;

    var youtube = {
        ready: false,
        player: null,
        playerId: null,
        videoId: null,
        videoTitle: null,
        playerHeight: '100%',
        playerWidth: '100%',
        state: 'stopped'
    };
    var results = [];
    var history = [];

    $window.onYouTubeIframeAPIReady = function () {
        $log.info('Youtube API is ready');
        youtube.ready = true;
        service.bindPlayer('placeholder');
        service.loadPlayer();
        $rootScope.$apply();
    };

    this.bindPlayer = function (elementId) {
        $log.info('Binding to ' + elementId);
        youtube.playerId = elementId;
    };

    this.createPlayer = function () {
        $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
        return new YT.Player(youtube.playerId, {
            height: youtube.playerHeight,
            width: youtube.playerWidth,
            playerVars: {
                rel: 0,
                showinfo: 0
            }
        });
    };

    this.loadPlayer = function () {
        if (youtube.ready && youtube.playerId) {
            if (youtube.player) {
                youtube.player.destroy();
            }
            youtube.player = service.createPlayer();
        }
    };

    this.launchPlayer = function (id, title) {
        youtube.player.loadVideoById(id);
        youtube.videoId = id;
        youtube.videoTitle = title;
        return youtube;
    }

    this.listResults = function (data, append) {
        if (!append) {
            results.length = 0;
        }
        for (var i = data.data.items.length - 1; i >= 0; i--) {
            results.push({
                id: data.data.items[i].id.videoId,
                title: data.data.items[i].snippet.title,
                description: data.data.items[i].snippet.description,
                thumbnail: data.data.items[i].snippet.thumbnails.default.url,
                author: data.data.items[i].snippet.channelTitle
            });
        }
        return results;
    }

    this.archiveVideo = function (video) {
        history.unshift(video);
        return history;
    };

    this.getYoutube = function () {
        return youtube;
    };

    this.getResults = function () {
        return results;
    };

    this.getHistory = function () {
        return history;
    };

}]);
app.filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        var video_id = url.split('v=')[1].split('&')[0];
        return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + video_id);
    };
}]);
