'use strict';
gantt.directive('ganttTaskContent', ['GanttDirectiveBuilder', function(Builder) {
    var builder = new Builder('ganttTaskContent');
    return builder.build();
}]);
