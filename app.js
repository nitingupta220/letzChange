var app = angular.module('youtubePlayer', []);


//Loading the youtube Iframe to play the video
app.run(function () {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

app.config(function ($httpProvider) {
    delete $httpProvider.defaults.headers.common['X-Requested-With'];
});


//Controller for the application

app.controller('youtubePlayerController', function ($scope, $http, $window, $log, VideosService) {
    'use strict';

    init();

    function init() {
        $scope.youtube = VideosService.getYoutube();
        $scope.results = VideosService.getResults();
        $scope.videos = VideosService.getVideos();
        //        $scope.history = VideosService.getHistory();
        $scope.playlist = true;
    }


    //    $scope.addVideo = function (url) {
    //        $scope.videos.push({
    //            url: $scope.videoInput
    //        });
    //        $scope.videoInput = '';
    //    };


    //    making the AJAX request to the youtube api and get the data
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

    //    Play the clicked video
    $scope.launch = function (id, title) {
        VideosService.launchPlayer(id, title);
        VideosService.archiveVideo(id, title);
        VideosService.deleteVideo($scope.videos, id);
        $log.info('Launched id:' + id + ' and title:' + title);
    };

    //    adding the video to the queue
    $scope.queue = function (id, title) {
        VideosService.queueVideo(id, title);
        VideosService.deleteVideo($scope.videos[0], id);
        $log.info('Queued id:' + id + ' and title:' + title);
    };

    $scope.delete = function (list, id) {
        VideosService.deleteVideo(list, id);
    };

});


//Service which will provide the basic functionalities like getting the predefined playlist, adding a new video

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

    //    videos already in the playlist
    var videos = [{
            id: 'YykjpeuMNEk',
            title: 'Coldplay - Hymn For The Weekend (Official Video)'

        },
        {
            id: 'FM7MFYoylVs',
            title: 'The Chainsmokers & Coldplay - Something Just Like This (Lyric)'

        }
        ];


    var results = [];




    function onYoutubeStateChange(event) {
        if (event.data == YT.PlayerState.PLAYING) {
            youtube.state = 'playing';
        } else if (event.data == YT.PlayerState.PAUSED) {
            youtube.state = 'paused';
        } else if (event.data == YT.PlayerState.ENDED) {
            youtube.state = 'ended';
            service.launchPlayer(videos[1].id, videos[1].title);
            //            service.archiveVideo(videos[0].id, videos[0].title);
            service.deleteVideo(videos, videos[0].id);
        }
        $rootScope.$apply();
    }

    function onYoutubeReady(event) {
        $log.info('YouTube Player is ready');
        youtube.player.cueVideoById(videos[0].id);
        youtube.videoId = videos[0].id;
        youtube.videoTitle = videos[0].title;
    }

    //    Binding the player to the HTML element
    this.bindPlayer = function (elementId) {
        $log.info('Binding to ' + elementId);
        youtube.playerId = elementId;
    };


    //    Creating the actual youtube player using the youtube API
    this.createPlayer = function () {
        $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
        return new YT.Player(youtube.playerId, {
            height: youtube.playerHeight,
            width: youtube.playerWidth,
            playerVars: {
                rel: 0,
                showinfo: 0
            },
            events: {
                'onReady': onYoutubeReady,
                'onStateChange': onYoutubeStateChange
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

    //    Creating the onYouTubeIframeAPIReady function which will call the previous two functions
    $window.onYouTubeIframeAPIReady = function () {
        $log.info('Youtube API is ready');
        youtube.ready = true;
        service.bindPlayer('placeholder');
        service.loadPlayer();
        $rootScope.$apply();
    };

    //launch the video in the player when you click on the Play button
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

    //    this.archiveVideo = function (video) {
    //        history.unshift(video);
    //        return history;
    //    };

    this.getYoutube = function () {
        return youtube;
    };

    this.getResults = function () {
        return results;
    };


    //    return the videos object which we can use in our controller to display the videos in the HTML
    this.getVideos = function () {
        return videos;
    };


    //    adding the video to the playlist
    this.queueVideo = function (id, title) {
        videos.push({
            id: id,
            title: title
        });
        return videos;
    };

    this.deleteVideo = function (list, id) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) {
                list.splice(i, 1);
                break;
            }
        }
    };

}]);

//Creating an sce filter which will help to display the trusted content
app.filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        var video_id = url.split('v=')[1].split('&')[0];
        return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + video_id);
    };
}]);
