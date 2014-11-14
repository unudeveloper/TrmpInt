'use strict';
angular.module('gantt.tooltips').directive('ganttTooltip', ['$timeout', '$document', 'ganttDebounce', 'ganttSmartEvent', function($timeout, $document, debounce, smartEvent) {
    // This tooltip displays more information about a task

    return {
        restrict: 'E',
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'plugins/tooltips/tooltip.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        scope: true,
        replace: true,
        controller: ['$scope', '$element', 'ganttUtils', function($scope, $element, utils) {
            var bodyElement = angular.element($document[0].body);
            var parentElement = $element.parent();
            var showTooltipPromise;
            var mousePositionX;

            $scope.css = {};
            $scope.visible = false;

            $scope.getFromLabel = function() {
                var dateFormat = utils.firstProperty([$scope.task.model.tooltips, $scope.task.row.model.tooltips], 'dateFormat', $scope.dateFormat);
                return $scope.task.model.from.format(dateFormat);
            };

            $scope.getToLabel = function() {
                var dateFormat = utils.firstProperty([$scope.task.model.tooltips, $scope.task.row.model.tooltips], 'dateFormat', $scope.dateFormat);
                return $scope.task.model.to.format(dateFormat);
            };

            $scope.$watch('isTaskMouseOver', function(newValue) {
                if (showTooltipPromise) {
                    $timeout.cancel(showTooltipPromise);
                }
                var enabled = utils.firstProperty([$scope.task.model.tooltips, $scope.task.row.model.tooltips], 'enabled', $scope.enabled);
                if (enabled && newValue === true) {
                    showTooltipPromise = $timeout(function() {
                        showTooltip(mousePositionX);
                    }, 500, true);
                } else {
                    if (!$scope.task.active) {
                        hideTooltip();
                    }
                }
            });

            $scope.task.$element.bind('mousemove', function(evt) {
                mousePositionX = evt.clientX;
            });

            $scope.task.$element.bind('mouseenter', function(evt) {
                $scope.$apply(function() {
                    $scope.mouseEnterX = evt.clientX;
                    $scope.isTaskMouseOver = true;
                });
            });

            $scope.task.$element.bind('mouseleave', function() {
                $scope.$apply(function() {
                    $scope.mouseEnterX = undefined;
                    $scope.isTaskMouseOver = false;
                });
            });

            var mouseMoveHandler = smartEvent($scope, bodyElement, 'mousemove', debounce(function(e) {
                updateTooltip(e.clientX);
            }, 5, false));

            $scope.$watch('task.isMoving', function(newValue) {
                if (newValue === true) {
                    mouseMoveHandler.bind();
                } else if (newValue === false) {
                    mouseMoveHandler.unbind();
                    hideTooltip();
                }
            });

            var getViewPortWidth = function() {
                var d = $document[0];
                return d.documentElement.clientWidth || d.documentElement.getElementById('body')[0].clientWidth;
            };

            var showTooltip = function(x) {
                $scope.visible = true;

                $timeout(function() {
                    updateTooltip(x);

                    $scope.css.top = parentElement[0].getBoundingClientRect().top + 'px';
                    $scope.css.marginTop = -$element[0].offsetHeight - 8 + 'px';
                    $scope.css.opacity = 1;
                }, 0, true);
            };

            var updateTooltip = function(x) {
                // Check if info is overlapping with view port
                if (x + $element[0].offsetWidth > getViewPortWidth()) {
                    $scope.css.left = (x + 20 - $element[0].offsetWidth) + 'px';
                    $element.addClass('gantt-task-infoArrowR'); // Right aligned info
                    $element.removeClass('gantt-task-infoArrow');
                } else {
                    $scope.css.left = (x - 20) + 'px';
                    $element.addClass('gantt-task-infoArrow');
                    $element.removeClass('gantt-task-infoArrowR');
                }
            };

            var hideTooltip = function() {
                $scope.css.opacity = 0;
                $scope.visible = false;
            };

            $scope.gantt.api.directives.raise.new('ganttTooltip', $scope, $element);
            $scope.$on('$destroy', function() {
                $scope.gantt.api.directives.raise.destroy('ganttTooltip', $scope, $element);
            });
        }]
    };
}]);
