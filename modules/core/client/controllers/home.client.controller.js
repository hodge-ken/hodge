(function () {
  'use strict';

  angular
    .module('core')
    .controller('HomeController', HomeController);
  HomeController.$inject = ['$state', 'Authentication'];
  function HomeController($state, Authentication) {
    var vm = this;
    if (Authentication.user) {
      $state.go("pogfapprovals.list");
    }
    
  }
}());
