(function () {
  'use strict';

  angular
    .module('pogfapprovals')
    .controller('PogfapprovalsTaskDoneController', PogfapprovalsTaskDoneController);

  PogfapprovalsTaskDoneController.$inject = ['PogfapprovalsService', 'UserprocessesService', '$scope', 'Authentication', '$http', '$state', '$translate'];

  function PogfapprovalsTaskDoneController(PogfapprovalsService, UserprocessesService, $scope, Authentication, $http, $state, $translate) {
    var vm = this;
    vm.dismiss = dismiss;
    vm.urgentEmailApprover = urgentEmailApprover;
    
    function dismiss(processId) {
      $http.delete('/api/pogfapprovals/' + processId, {params: {deleteType: "dismiss"}}).then(function () {
        $state.reload();
      }); 
    }

    function urgentEmailApprover(processId) {
      $http.post('/api/pogfapprovals?processId=' + processId + '&submitType=urgentEmailApprover').then(function () {
        
      })
    }

    
    UserprocessesService.query({findBy: "userId"}).$promise.then(function (taskDoneProcesses) {
      
      if (taskDoneProcesses.length > 1 || taskDoneProcesses.length === 0) {
        
      } else {
        var userProcess = taskDoneProcesses[0];
        var taskDone = userProcess.taskDone;
        var processIds = []
        for(var i = 0; i < taskDone.length; i++) {
          if (taskDone[i].processName === "pogfapproval") {
            processIds.push(taskDone[i].processId);
          }
        }
        var processIdsRev = [];
        while (processIds.length) {
          processIdsRev.push(processIds.pop());
        }
        PogfapprovalsService.query({processIds: processIdsRev.toString()}).$promise.then(function(pogfapprovals){
          vm.pogfapprovals = pogfapprovals;
        });
      }
      
    });;

  }

  
}());
