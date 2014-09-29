/*
Project: angular-gantt for AngularJS
Author: Marco Schweighauser
Contributors: Rémi Alvergnat
License: MIT.
Github: https://github.com/angular-gantt/angular-gantt
*/
'use strict';


var gantt = angular.module('gantt', ['ganttTemplates', 'angularMoment']);
gantt.constant('GANTT_EVENTS',
    {
        'READY': 'event:gantt-ready',
        'SCROLL': 'event:gantt-scroll',

        'TASK_CHANGED': 'event:gantt-task-changed',
        'TASK_MOVE_BEGIN': 'event:gantt-task-move-begin',
        'TASK_MOVE': 'event:gantt-task-move',
        'TASK_MOVE_END': 'event:gantt-task-move-end',
        'TASK_RESIZE_BEGIN': 'event:gantt-task-resize-begin',
        'TASK_RESIZE': 'event:gantt-task-resize',
        'TASK_RESIZE_END': 'event:gantt-task-resize-end',
        'TASK_CLICKED': 'event:gantt-task-clicked',
        'TASK_DBL_CLICKED': 'event:gantt-task-dblclicked',
        'TASK_CONTEXTMENU': 'event:gantt-task-contextmenu',

        'COLUMN_CLICKED': 'event:gantt-column-clicked',
        'COLUMN_DBL_CLICKED': 'event:gantt-column-dblclicked',
        'COLUMN_CONTEXTMENU': 'event:gantt-column-contextmenu',

        'ROW_MOUSEDOWN': 'event:gantt-row-mousedown',
        'ROW_MOUSEUP': 'event:gantt-row-mouseup',
        'ROW_CLICKED': 'event:gantt-row-clicked',
        'ROW_DBL_CLICKED': 'event:gantt-row-dblclicked',
        'ROW_CONTEXTMENU': 'event:gantt-row-contextmenu',
        'ROW_CHANGED': 'event:gantt-row-changed',
        'ROW_ADDED': 'event:gantt-row-added',

        'ROW_LABEL_MOUSEDOWN': 'event:gantt-row-label-mousedown',
        'ROW_LABEL_MOUSEUP': 'event:gantt-row-label-mouseup',
        'ROW_LABEL_CLICKED': 'event:gantt-row-label-clicked',
        'ROW_LABEL_DBL_CLICKED': 'event:gantt-row-label-dblclicked',
        'ROW_LABEL_CONTEXTMENU': 'event:gantt-row-label-contextmenu',

        'ROW_HEADER_MOUSEDOWN': 'event:gantt-row-header-mousedown',
        'ROW_HEADER_MOUSEUP': 'event:gantt-row-header-mouseup',
        'ROW_HEADER_CLICKED': 'event:gantt-row-header-clicked',
        'ROW_HEADER_DBL_CLICKED': 'event:gantt-row-header-dblclicked',
        'ROW_HEADER_CONTEXTMENU': 'event:gantt-row-header-contextmenu',

        'ROW_LABELS_RESIZED': 'event:gantt-row-labels-resized',

        'TIMESPAN_ADDED': 'event:gantt-timespan-added',
        'TIMESPAN_CHANGED': 'event:gantt-timespan-changed'
    });

gantt.directive('gantt', ['Gantt', 'moment', 'mouseOffset', 'debounce', 'keepScrollPos', 'Events', 'GANTT_EVENTS', function(Gantt, moment, mouseOffset, debounce, keepScrollPos, Events, GANTT_EVENTS) {
    return {
        restrict: 'EA',
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.gantt.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        scope: {
            sortMode: '=?', // Possible modes: 'name', 'date', 'custom'
            filterTask: '=?', // Task filter as a angularJS expression
            filterTaskComparator: '=?', // Comparator to use for the task filter
            filterRow: '=?', // Row filter as a angularJS expression
            filterRowComparator: '=?', // Comparator to use for the row filter
            viewScale: '=?', // Possible scales: 'hour', 'day', 'week', 'month'
            width: '=?', // Defines the preferred width of gantt. If defined, columns will be resized accordingly.
            columnWidth: '=?', // Defines the size of a column, 1 being 1em per unit (hour or day, .. depending on scale),
            columnSubScale: '=?', // Defines how precise tasks should be positioned inside columns. 4 = in quarter steps, 2 = in half steps, ... Use values higher than 24 or 60 (hour view) to display them very accurate. Default (4)
            allowTaskMoving: '=?', // Set to true if tasks should be moveable by the user.
            allowTaskResizing: '=?', // Set to true if tasks should be resizable by the user.
            allowTaskRowSwitching: '=?', // If false then tasks can be moved inside their current row only. The user can not move it to another row.
            allowRowSorting: '=?', // Set to true if the user should be able to re-order rows.
            allowLabelsResizing: '=?', // Set to true if the user should be able to resize the label section.
            fromDate: '=?', // If not specified will use the earliest task date (note: as of now this can only expand not shrink)
            toDate: '=?', // If not specified will use the latest task date (note: as of now this can only expand not shrink)
            currentDateValue: '=?', // If specified, the current date will be displayed
            currentDate: '=?', // The display of currentDate ('none', 'line' or 'column').
            weekendDays: '=?', // Array of days: 0=Sunday, 1=Monday, ... Default ([0,6])
            showWeekends: '=?', // True if the weekends shall be displayed Default (true)
            workHours: '=?', // Array of valid work hours. Default ([8,9,..,16] equals a 8am - 17pm workday)
            showNonWorkHours: '=?', // True if the non work hours shall be displayed Default (true)
            autoExpand: '=?', // Set this both, left or right if the date range shall expand if the user scroll to the left or right end. Otherwise set to false or none.
            taskOutOfRange: '=?', // Set this to auto-expand or truncate to define the behavior of tasks going out of visible range.
            maxHeight: '=?', // Define the maximum height of the Gantt in PX. > 0 to activate max height behaviour.
            labelsWidth: '=?', // Define the width of the labels section. Changes when the user is resizing the labels width
            showTooltips: '=?', // True when tooltips shall be enabled. Default (true)
            headerShowMonth: '=?',
            headerShowWeek: '=?',
            headerShowDay: '=?',
            headerShowHour: '=?',
            headerFormatMonth: '=?',
            headerFormatWeek: '=?',
            headerFormatDay: '=?',
            headerFormatHour: '=?',
            tooltipDateFormat: '=?',
            timespans: '=?',
            data: '=?',
            loadTimespans: '&',
            loadData: '&',
            removeData: '&',
            clearData: '&',
            centerDate: '&'
        },
        controller: ['$scope', function($scope) {
            // Initialize defaults
            if ($scope.sortMode === undefined) {
                $scope.sortMode = 'name';
            }
            if ($scope.viewScale === undefined) {
                $scope.viewScale = 'day';
            }
            if ($scope.width === undefined) {
                $scope.width = 0;
            }
            if ($scope.columnWidth === undefined) {
                $scope.columnWidth = 2;
            }
            if ($scope.columnSubScale === undefined) {
                $scope.columnSubScale = 4;
            }
            if ($scope.allowTaskMoving === undefined) {
                $scope.allowTaskMoving = true;
            }
            if ($scope.allowTaskResizing === undefined) {
                $scope.allowTaskResizing = true;
            }
            if ($scope.allowTaskRowSwitching === undefined) {
                $scope.allowTaskRowSwitching = true;
            }
            if ($scope.allowRowSorting === undefined) {
                $scope.allowRowSorting = true;
            }
            if ($scope.allowLabelsResizing === undefined) {
                $scope.allowLabelsResizing = true;
            }
            if ($scope.currentDateValue === undefined) {
                $scope.currentDateValue = new Date();
            }
            if ($scope.currentDate === undefined) {
                $scope.currentDate = 'line';
            }
            if ($scope.weekendDays === undefined) {
                $scope.weekendDays = [0, 6];
            }
            if ($scope.showWeekends === undefined) {
                $scope.showWeekends = true;
            }
            if ($scope.workHours === undefined) {
                $scope.workHours = [8, 9, 10, 11, 12, 13, 14, 15, 16];
            }
            if ($scope.showNonWorkHours === undefined) {
                $scope.showNonWorkHours = true;
            }
            if ($scope.maxHeight === undefined) {
                $scope.maxHeight = 0;
            }
            if ($scope.autoExpand === undefined) {
                $scope.autoExpand = 'none';
            }
            if ($scope.taskOutOfRange === undefined) {
                $scope.taskOutOfRange = 'expand';
            }
            if ($scope.labelsWidth === undefined) {
                $scope.labelsWidth = 0;
            }
            if ($scope.showTooltips === undefined) {
                $scope.showTooltips = true;
            }
            if ($scope.headerShowMonth === undefined) {
                $scope.headerShowMonth = true;
            }
            if ($scope.headerShowWeek === undefined) {
                $scope.headerShowWeek = true;
            }
            if ($scope.headerShowDay === undefined) {
                $scope.headerShowDay = true;
            }
            if ($scope.headerShowHour === undefined) {
                $scope.headerShowHour = true;
            }

            // Gantt logic
            $scope.gantt = new Gantt($scope);

            $scope.$watch('sortMode', function(newValue, oldValue) {
                if (!angular.equals(newValue, oldValue)) {
                    $scope.sortRows();
                }
            });

            $scope.$watch('timespans', function(newValue, oldValue) {
                if (!angular.equals(newValue, oldValue)) {
                    $scope.removeAllTimespans();
                    $scope.setTimespans(newValue);
                }
            });

            $scope.$watch('data', function(newValue, oldValue) {
                if (!angular.equals(newValue, oldValue)) {
                    $scope.removeAllData();
                    $scope.setData(newValue);
                }
            });

            $scope.getPxToEmFactor = function() {
                return $scope.scrollable.$element.children()[0].offsetWidth / $scope.gantt.width;
            };

            // Swaps two rows and changes the sort order to custom to display the swapped rows
            $scope.swapRows = function(a, b) {
                $scope.gantt.swapRows(a, b);

                // Raise change events
                $scope.$emit(GANTT_EVENTS.ROW_CHANGED, {'row': a});
                $scope.$emit(GANTT_EVENTS.ROW_CHANGED, {'row': b});

                // Switch to custom sort mode and trigger sort
                if ($scope.sortMode !== 'custom') {
                    $scope.sortMode = 'custom'; // Sort will be triggered by the watcher
                } else {
                    $scope.sortRows();
                }
            };

            // Sort rows by the current sort mode
            $scope.sortRows = function() {
                $scope.gantt.sortRows($scope.sortMode);
            };

            // Scroll to the specified x
            $scope.scrollTo = function(x) {
                $scope.scrollable.$element[0].scrollLeft = x;
                $scope.scrollable.$element.triggerHandler('scroll');
            };

            // Scroll to the left side by specified x
            $scope.scrollLeft = function(x) {
                $scope.scrollable.$element[0].scrollLeft -= x;
                $scope.scrollable.$element.triggerHandler('scroll');
            };

            // Scroll to the right side by specified x
            $scope.scrollRight = function(x) {
                $scope.scrollable.$element[0].scrollLeft += x;
                $scope.scrollable.$element.triggerHandler('scroll');
            };

            // Tries to center the specified date
            $scope.scrollToDate = function(date) {
                var column = $scope.gantt.getColumnByDate(date);
                if (column !== undefined) {
                    var x = (column.left + column.width / 2) * $scope.getPxToEmFactor();
                    $scope.scrollable.$element[0].scrollLeft = x - $scope.scrollable.$element[0].offsetWidth / 2;
                }
            };

            $scope.autoExpandColumns = keepScrollPos($scope, function(el, date, direction) {
                if ($scope.autoExpand !== 'both' && $scope.autoExpand !== true && $scope.autoExpand !== direction) {
                    return;
                }

                var from, to;
                var expandHour = 1, expandDay = 31;

                if (direction === 'left') {
                    from = $scope.viewScale === 'hour' ? moment(date).add(-expandHour, 'day') : moment(date).add(-expandDay, 'day');
                    to = date;
                } else {
                    from = date;
                    to = $scope.viewScale === 'hour' ? moment(date).add(expandHour, 'day') : moment(date).add(expandDay, 'day');
                }

                $scope.gantt.requestDateRange(from, to);
            });

            // Add or update rows and tasks
            $scope.setData = keepScrollPos($scope, function(data) {
                $scope.gantt.addData(data,
                    function(row) {
                        $scope.$emit(GANTT_EVENTS.ROW_ADDED, {'row': row});
                    }, function(row) {
                        $scope.$emit(GANTT_EVENTS.ROW_CHANGED, {'row': row});
                    });

                $scope.sortRows();
            });

            // Remove specified rows and tasks.
            $scope.removeData({ fn: function(data) {
                $scope.gantt.removeData(data, function(row) {
                    $scope.$emit(GANTT_EVENTS.ROW_CHANGED, {'row': row});
                });

                $scope.sortRows();
            }});

            // Clear all existing rows and tasks
            $scope.removeAllData = function() {
                // Clears rows, task and columns
                $scope.gantt.removeAllRows();
                // Restore default columns
                $scope.gantt.requestDateRange($scope.fromDate, $scope.toDate);
            };

            // Clear all existing timespans
            $scope.removeAllTimespans = function() {
                // Clears rows, task and columns
                $scope.gantt.removeAllTimespans();
                // Restore default columns
                $scope.gantt.requestDateRange($scope.fromDate, $scope.toDate);
            };

            // Add or update timespans
            $scope.setTimespans = keepScrollPos($scope, function(timespans) {
                $scope.gantt.addTimespans(timespans,
                    function(timespan) {
                        $scope.$emit(GANTT_EVENTS.TIMESPAN_ADDED, {timespan: timespan});
                    }, function(timespan) {
                        $scope.$emit(GANTT_EVENTS.TIMESPAN_CHANGED, {timespan: timespan});
                    });
            });

            // Load data handler.
            // The Gantt chart will keep the current view position if this function is called during scrolling.
            $scope.loadData({ fn: $scope.setData});
            $scope.loadTimespans({ fn: $scope.setTimespans});

            // Clear data handler.
            $scope.clearData({ fn: $scope.removeAllData});

            // Scroll to specified date handler.
            $scope.centerDate({ fn: $scope.scrollToDate});

            // Gantt is initialized. Signal that the Gantt is ready.
            $scope.$emit(GANTT_EVENTS.READY);
        }
        ]};
}]);


gantt.factory('Body', [function() {
    var Body = function() {
    };
    return Body;
}]);


gantt.factory('Column', [ 'moment', function(moment) {
    // Used to display the Gantt grid and header.
    // The columns are generated by the column generator.

    var calcDbyP = function(column, maxDateValue, currentPosition) {
        return Math.round(maxDateValue / column.width * currentPosition / (maxDateValue / column.subScale)) * (maxDateValue / column.subScale);
    };

    var calcPbyD = function(column, date, maxDateValue, currentDateValue) {
        var factor;

        if (date - column.date > 0 && !column.containsDate(date)) {
            factor = 1;
        } else {
            factor = Math.round(currentDateValue / maxDateValue * column.subScale) / column.subScale;
        }

        return Math.round((column.left + column.width * factor) * 10) / 10;
    };

    var Column = function(date, left, width, subScale) {
        var self = this;
        self.date = date;
        self.left = left;
        self.width = width;
        self.subScale = subScale;

        self.getEndDate = function() {
            return self.getDateByPosition(self.width);
        };

        self.clone = function() {
            return new Column(self.date, self.left, self.width, self.subScale);
        };

        self.equals = function(other) {
            return self.date === other.date;
        };

    };

    var MonthColumn = function(date, left, width, subScale) {
        var column = new Column(moment(date), left, width, subScale);
        column.daysInMonth = column.date.daysInMonth();

        column.clone = function() {
            return new Column(moment(column.date), column.left, column.width, column.subScale);
        };

        column.containsDate = function(date) {
            return date.month() === column.date.month();
        };

        column.getDateByPosition = function(position) {
            if (position < 0) {
                position = 0;
            }
            if (position > column.width) {
                position = column.width;
            }

            var res = moment(column.date);
            res.date(1 + calcDbyP(column, column.daysInMonth, position));
            return res;
        };

        column.getPositionByDate = function(date) {
            return calcPbyD(column, date, column.daysInMonth, date.date());
        };

        return column;
    };

    var WeekColumn = function(date, left, width, subScale) {
        var column = new Column(moment(date), left, width, subScale);
        column.week = date.week();
        column.daysInWeek = 7;

        column.clone = function() {
            var copy = new Column(moment(column.date), column.left, column.width, column.subScale);
            copy.week = column.week;
            return copy;
        };

        column.containsDate = function(date) {
            return date.week() === column.date.week();
        };

        column.getDateByPosition = function(position) {
            if (position < 0) {
                position = 0;
            }
            if (position > column.width) {
                position = column.width;
            }

            var res = moment(column.date);
            var day = Math.round(calcDbyP(column, column.daysInWeek, position));

            res.day(day);
            return res;
        };

        column.getPositionByDate = function(date) {
            return calcPbyD(column, date, column.daysInWeek, date.day());
        };

        return column;
    };

    var DayColumn = function(date, left, width, subScale, isWeekend, daysToNextWorkingDay, daysToPrevWorkingDay, workHours, showNonWorkHours) {
        var column = new Column(moment(date), left, width, subScale);
        column.isWeekend = isWeekend;
        column.showNonWorkHours = showNonWorkHours;

        var startHour = 0;
        var endHour = 24;

        if (arguments.length === 9 && !showNonWorkHours && workHours.length > 1) {
            startHour = workHours[0];
            endHour = workHours[workHours.length - 1] + 1;
        }

        column.clone = function() {
            var copy = new Column(moment(column.date), column.left, column.width, column.subScale);
            copy.isWeekend = column.isWeekend;
            return copy;
        };

        column.containsDate = function(date) {
            return date.date() === column.date.date();
        };

        column.getDateByPosition = function(position, snapForward) {
            if (position < 0) {
                position = 0;
            }
            if (position > column.width) {
                position = column.width;
            }

            var res = moment(column.date);
            var hours = startHour + calcDbyP(column, (endHour - startHour), position);

            // Snap is done because a DAY can hide the non-work hours. If this is the case the start or end date of a task shall be the last work hour of the current day and not the next day.
            if (arguments.length === 2) {
                if (hours === endHour && snapForward) {
                    //We have snapped to the end of one day but this is a start of a task so it should snap to the start of the next displayed day
                    res.add(daysToNextWorkingDay, 'day');
                    hours = startHour;
                }
                else if (hours === startHour && !snapForward) {
                    //We have snapped to the start of one day but this is the end of a task so it should snap to the end of the previous displayed day
                    res.add(-daysToNextWorkingDay, 'day');
                    hours = endHour;
                }
            }

            res.hour(hours);
            return res;
        };

        column.getPositionByDate = function(date) {
            //first check that the date actually corresponds to this column
            //(it is possible that it might not if weekends are hidden, in which case this will be the nearest previous column)
            if (moment(date).startOf('day') > moment(column.date).startOf('day')) {
                return column.left + column.width;
            }
            if (moment(date).startOf('day') < moment(column.date).startOf('day')) {
                return column.left;
            }

            var maxDateValue = endHour - startHour;
            var currentDateValue = date.hour() - startHour;
            if (currentDateValue < 0) {
                return column.left;
            }
            else if (currentDateValue > maxDateValue) {
                return column.left + column.width;
            }
            else {
                return calcPbyD(column, date, maxDateValue, currentDateValue);
            }
        };

        return column;
    };

    var HourColumn = function(date, left, width, subScale, isWeekend, isWorkHour, hoursToNextWorkingDay, hoursToPrevWorkingDay) {
        var column = new Column(moment(date), left, width, subScale);
        column.isWeekend = isWeekend;
        column.isWorkHour = isWorkHour;

        column.clone = function() {
            var copy = new Column(moment(column.date), column.left, column.width, column.subScale);
            copy.isWeekend = column.isWeekend;
            copy.isWorkHour = column.isWorkHour;
            return copy;
        };

        column.containsDate = function(date) {
            return date.date() === column.date.date() && date.hour() === column.date.hour();
        };

        column.getDateByPosition = function(position, snapForward) {
            if (position < 0) {
                position = 0;
            }
            if (position > column.width) {
                position = column.width;
            }

            var res = moment(column.date);
            var minutes = calcDbyP(column, 60, position);

            // Snap is done because a HOUR can hide the non-work hours. If this is the case the start or end date of a task shall be the last work hour of the current day and not the next day.
            if (arguments.length === 2) {
                if (minutes === 60 && snapForward) {
                    //We have snapped to the end of one day but this is a start of a task so it should snap to the start of the next displayed day
                    res.add(hoursToNextWorkingDay, 'hours');
                    minutes = 0;
                }
                else if (minutes === 0 && !snapForward) {
                    //We have snapped to the start of one day but this is the end of a task so it should snap to the end of the previous displayed day
                    res.add(-hoursToPrevWorkingDay, 'hours');
                    minutes = 60;
                }
            }

            res.minutes(minutes);
            return res;
        };

        column.getPositionByDate = function(date) {
            if (moment(date).startOf('day') > moment(column.date).startOf('day')) {
                return column.left + column.width;
            }

            return calcPbyD(column, date, 60, date.minutes());
        };

        return column;
    };

    return {
        Hour: HourColumn,
        Day: DayColumn,
        Week: WeekColumn,
        Month: MonthColumn
    };
}]);


gantt.factory('ColumnGenerator', [ 'Column', 'moment', function(Column, moment) {

    // Returns a map to lookup if the current day is a weekend day
    var getWeekendDaysMap = function(weekendDays) {
        var weekendDaysMap = {};

        for (var i = 0, l = weekendDays.length; i < l; i++) {
            weekendDaysMap[weekendDays[i]] = true;
        }

        return weekendDaysMap;
    };

    // Returns true if the given day is a weekend day
    var checkIsWeekend = function(weekendDaysMap, day) {
        return weekendDaysMap[day] === true;
    };

    // Returns a map to lookup if the current hour is a work hour
    var getWorkHoursMap = function(workHours) {
        var workHoursMap = {};

        for (var i = 0, l = workHours.length; i < l; i++) {
            workHoursMap[workHours[i]] = true;
        }

        return workHoursMap;
    };

    // Returns true if the given hour is a work hour
    var checkIsWorkHour = function(workHoursMap, hour) {
        return workHoursMap[hour] === true;
    };

    var setWidth = function(width, originalWidth, columns) {
        if (width && originalWidth && columns) {

            var widthFactor = Math.abs(width / originalWidth);

            angular.forEach(columns, function(column) {
                column.left = widthFactor * column.left;
                column.width = widthFactor * column.width;
            });
        }
    };


    var HourColumnGenerator = function(width, columnWidth, columnSubScale, weekendDays, showWeekends, workHours, showNonWorkHours) {
        // Generates 24 columns for each day between the given from and to date. The task will later be places between the matching columns.
        this.generate = function(from, to, maximumWidth, leftOffset, reverse) {
            if (!to && !maximumWidth) {
                throw 'to or maximumWidth must be defined';
            }

            var excludeTo = false;
            from = moment(from).startOf('day');
            if (to) {
                excludeTo = isToDateToExclude(to);
                to = moment(to).startOf('day');
            }

            var date = moment(from);
            var generatedCols = [];
            var left = 0;
            var workHoursMap = getWorkHoursMap(workHours);
            var weekendDaysMap = getWeekendDaysMap(weekendDays);

            while (true) {
                if ((maximumWidth && Math.abs(left) > maximumWidth + columnWidth * 24)) {
                    break;
                }

                if (reverse) {
                    left -= columnWidth * 24;
                }

                var isWeekend = checkIsWeekend(weekendDaysMap, date.day());

                for (var i = 0; i < 24; i++) {
                    var cDate = new Date(date.year(), date.month(), date.date(), i, 0, 0);
                    var isWorkHour = checkIsWorkHour(workHoursMap, i);

                    if ((isWeekend && showWeekends || !isWeekend) && (!isWorkHour && showNonWorkHours || isWorkHour)) {
                        var hoursToNextWorkingDay = 1;
                        var hoursToPrevWorkingDay = 1;
                        if (!showNonWorkHours) { //hours to next/prev working day is only relevant if non-work hours are hidden
                            hoursToNextWorkingDay = getHoursToNextWorkingDay(workHoursMap, cDate.hour());
                            hoursToPrevWorkingDay = getHoursToPreviousWorkingDay(workHoursMap, cDate.hour());
                        }

                        generatedCols.push(new Column.Hour(cDate, leftOffset ? left + leftOffset : left, columnWidth, columnSubScale, isWeekend, isWorkHour, hoursToNextWorkingDay, hoursToPrevWorkingDay));
                        left += columnWidth;
                    }

                }

                if (reverse) {
                    left -= columnWidth * 24;
                }

                if (to) {
                    if (reverse) {
                        if (excludeTo && date < to || !excludeTo && date <= to) {
                            break;
                        }
                    } else {
                        if (excludeTo && date > to || !excludeTo && date >= to) {
                            break;
                        }
                    }
                }

                date.add(reverse ? -1 : 1, 'day');
            }

            setWidth(width, left, generatedCols);

            return generatedCols;
        };

        this.columnExpandNecessary = function(firstColDate, lastColDate, newFromDate, newToDate) {
            // If the To date was excluded from generating then go back one hour.
            if (isToDateToExclude(newToDate)) {
                newToDate = moment(newToDate).add(-1, 'hours');
            }

            // Set time of newToDate to zero before comparing as the hour columns are generated for the whole day
            // and the newToDate could be e.g. 23:35 while the last column for this date has time 23:00.
            // If we wouldn`t set the time to zero the comparison would trigger an expand in that case.
            return firstColDate > newFromDate || lastColDate < moment(newToDate).startOf('day');
        };

        // Columns are generated including or excluding the to date.
        // If the To date time is 00:00 then no new columns are generated for this day.
        var isToDateToExclude = function(to) {
            return moment(to).add(1, 'day').startOf('day') === to;
        };

        // Returns the count of hours until the next working day
        // For example with working hours from 8-16, Wed 9am would return 1, Thu 16pm would return 16
        // Should also be able to handle gaps like 8-12, 13-17
        var getHoursToNextWorkingDay = function(workHoursMap, hour) {
            for (var i = 1; i < 25; i++) {
                var nextHour = (hour + i) % 24;
                if (checkIsWorkHour(workHoursMap, nextHour)) {
                    return i;
                }
            }
            return 1; //default to 1, should only get here if the whole day is a work day
        };

        var getHoursToPreviousWorkingDay = function(workHours, hour) {
            for (var i = 1; i < 25; i++) {
                var prevHour = (((hour - i) % 24) + 24) % 24;
                if (checkIsWorkHour(workHours, prevHour)) {
                    return i;
                }
            }
            return 1; //default to 1, should only get here if the whole day is a work day
        };
    };

    var DayColumnGenerator = function(width, columnWidth, columnSubScale, weekendDays, showWeekends, workHours, showNonWorkHours) {
        // Generates one column for each day between the given from and to date.
        this.generate = function(from, to, maximumWidth, leftOffset, reverse) {
            if (!to && !maximumWidth) {
                throw 'to or maximumWidth must be defined';
            }

            var excludeTo = false;
            from = moment(from).startOf('day');
            if (to) {
                excludeTo = isToDateToExclude(to);
                to = moment(to).startOf('day');
            }

            var date = moment(from);
            var generatedCols = [];
            var left = 0;
            var weekendDaysMap = getWeekendDaysMap(weekendDays);

            while (true) {
                if (maximumWidth && Math.abs(left) > maximumWidth + columnWidth) {
                    break;
                }

                var isWeekend = checkIsWeekend(weekendDaysMap, date.day());
                if (isWeekend && showWeekends || !isWeekend) {
                    var daysToNextWorkingDay = 1;
                    var daysToPreviousWorkingDay = 1;
                    if (!showWeekends) { //days to next/prev working day is only relevant if weekends are hidden
                        daysToNextWorkingDay = getDaysToNextWorkingDay(weekendDaysMap, date.day());
                        daysToPreviousWorkingDay = getDaysToPrevWorkingDay(weekendDaysMap, date.day());
                    }

                    generatedCols.push(new Column.Day(moment(date), leftOffset ? left + leftOffset : left, columnWidth, columnSubScale, isWeekend, daysToNextWorkingDay, daysToPreviousWorkingDay, workHours, showNonWorkHours));
                    if (reverse) {
                        left -= columnWidth;
                    } else {
                        left += columnWidth;
                    }

                }

                if (to) {
                    if (reverse) {
                        if (excludeTo && date < to || !excludeTo && date <= to) {
                            break;
                        }
                    } else {
                        if (excludeTo && date > to || !excludeTo && date >= to) {
                            break;
                        }
                    }
                }

                date.add(reverse ? -1 : 1, 'day');
            }

            if (reverse) {
                if (isToDateToExclude(from)) {
                    generatedCols.shift();
                }
                generatedCols.reverse();
            }

            setWidth(width, left, generatedCols);

            return generatedCols;
        };

        this.columnExpandNecessary = function(firstColDate, lastColDate, newFromDate, newToDate) {
            // If the To date was excluded from generating then go back one day.
            if (isToDateToExclude(newToDate)) {
                newToDate = moment(newToDate).add(-1, 'day');
            }

            // Set time of newToDate to zero before comparing as the day columns generated have time 00:00
            // and the newToDate could be e.g. 16:23.
            // If we wouldn`t set the time to zero the comparison would trigger an expand in that case.
            return firstColDate > newFromDate || lastColDate < moment(newToDate).startOf('day');
        };

        // Columns are generated including or excluding the to date.
        // If the To date time is 00:00 then no new column is generated for this day.
        var isToDateToExclude = function(to) {
            return moment(to).add(1, 'day').startOf('day') === to;
        };

        // Returns the count of days until the next working day
        // For example with a Mon-Fri working week, Wed would return 1, Fri would return 3, Sat would return 2
        var getDaysToNextWorkingDay = function(weekendDays, day) {
            for (var i = 1; i < 8; i++) {
                var nextDay = (day + i) % 7;
                if (!checkIsWeekend(weekendDays, nextDay)) {
                    return i;
                }
            }
            return 1; //default to 1, should only get here if the whole week is the weekend
        };

        // Returns the count of days from the previous working day
        // For example with a Mon-Fri working week, Wed would return 1, Mon would return 3.
        var getDaysToPrevWorkingDay = function(weekendDays, day) {
            for (var i = 1; i < 8; i++) {
                var prevDay = (((day - i) % 7) + 7) % 7;
                if (!checkIsWeekend(weekendDays, prevDay)) {
                    return i;
                }
            }
            return 1; //default to 1, should only get here if the whole week is the weekend
        };
    };

    var WeekColumnGenerator = function(width, columnWidth, columnSubScale) {
        // Generates one column for each week between the given from and to date.
        this.generate = function(from, to, maximumWidth, leftOffset, reverse) {
            if (!to && !maximumWidth) {
                throw 'to or maximumWidth must be defined';
            }

            var excludeTo = false;
            from = moment(from).startOf('week');
            if (to) {
                excludeTo = isToDateToExclude(to);
                to = moment(to).startOf('week');
            }

            var date = moment(from);
            var generatedCols = [];
            var left = 0;

            while (true) {
                if (maximumWidth && Math.abs(left) > maximumWidth + columnWidth) {
                    break;
                }

                generatedCols.push(new Column.Week(moment(date), leftOffset ? left + leftOffset : left, columnWidth, columnSubScale));
                if (reverse) {
                    left -= columnWidth;
                } else {
                    left += columnWidth;
                }

                if (to) {
                    if (reverse) {
                        if (excludeTo && date < to || !excludeTo && date <= to) {
                            break;
                        }
                    } else {
                        if (excludeTo && date > to || !excludeTo && date >= to) {
                            break;
                        }
                    }
                }

                date.add(reverse ? -1 : 1, 'week');
            }

            if (reverse) {
                if (isToDateToExclude(from)) {
                    generatedCols.shift();
                }
                generatedCols.reverse();
            }

            setWidth(width, left, generatedCols);

            return generatedCols;
        };

        this.columnExpandNecessary = function(firstColDate, lastColDate, newFromDate, newToDate) {
            // If the To date was excluded from generating then go back one week.
            if (isToDateToExclude(newToDate)) {
                newToDate = moment(newToDate).add(-1, 'week');
            }

            // Set time of newToDate to zero before comparing as the week columns generated have day = firstDayOfWeek and time = 00:00
            // and the newToDate could be e.g. day 3 and time 16:23.
            // If we wouldn`t set the day to firstDayOfWeek and time to zero the comparison would trigger an expand in that case.
            return firstColDate > newFromDate || lastColDate < moment(newToDate).startOf('week');
        };

        // Columns are generated including or excluding the to date.
        // If the To date is the first day of week and the time is 00:00 then no new column is generated for this week.
        var isToDateToExclude = function(to) {
            return moment(to).add(1, 'week').startOf('week') === to;
        };
    };

    var MonthColumnGenerator = function(width, columnWidth, columnSubScale) {
        // Generates one column for each month between the given from and to date.
        this.generate = function(from, to, maximumWidth, leftOffset, reverse) {
            if (!to && !maximumWidth) {
                throw 'to or maximumWidth must be defined';
            }

            var excludeTo = false;
            from = moment(from).startOf('month');
            if (to) {
                excludeTo = isToDateToExclude(to);
                to = moment(to).startOf('month');
            }

            var date = moment(from);
            var generatedCols = [];
            var left = 0;

            while (true) {
                if (maximumWidth && Math.abs(left) > maximumWidth + columnWidth) {
                    break;
                }

                generatedCols.push(new Column.Month(moment(date), leftOffset ? left + leftOffset : left, columnWidth, columnSubScale));
                if (reverse) {
                    left -= columnWidth;
                } else {
                    left += columnWidth;
                }

                if (to) {
                    if (reverse) {
                        if (excludeTo && date < to || !excludeTo && date <= to) {
                            break;
                        }
                    } else {
                        if (excludeTo && date > to || !excludeTo && date >= to) {
                            break;
                        }
                    }
                }

                date.add(reverse ? -1 : 1, 'month');
            }

            if (reverse) {
                if (isToDateToExclude(from)) {
                    generatedCols.shift();
                }
                generatedCols.reverse();
            }

            setWidth(width, left, generatedCols);

            return generatedCols;
        };

        this.columnExpandNecessary = function(firstColDate, lastColDate, newFromDate, newToDate) {
            // If the To date was excluded from generating then go back one month.
            if (isToDateToExclude(newToDate)) {
                newToDate = moment(newToDate).add(-1, 'month');
            }

            // Set time of newToDate to zero before comparing as the month columns generated have day = 1 and time = 00:00
            // and the newToDate could be e.g. day 7 and time 16:23.
            // If we wouldn`t set the day to 1 and time to zero the comparison would trigger an expand in that case.
            return firstColDate > newFromDate || lastColDate < moment(newToDate).startOf('month');
        };

        // Columns are generated including or excluding the to date.
        // If the To date is the first day of month and the time is 00:00 then no new column is generated for this month.
        var isToDateToExclude = function(to) {
            return moment(to).add(1, 'month').startOf('month') === to;
        };
    };

    return {
        HourGenerator: HourColumnGenerator,
        DayGenerator: DayColumnGenerator,
        WeekGenerator: WeekColumnGenerator,
        MonthGenerator: MonthColumnGenerator
    };
}]);


gantt.service('Events', ['mouseOffset', function(mouseOffset) {
    return {
        buildTaskEventData: function(evt, element, task, gantt) {
            var data = {evt:evt, element:element, task:task};
            if (gantt !== undefined && evt !== undefined) {
                var x = mouseOffset.getOffset(evt).x;
                // TODO: https://github.com/angular-gantt/angular-gantt/issues/120
                // xInEm = x / $scope.getPxToEmFactor(),
                data.column = gantt.getColumnByPosition(x + task.left);
                data.date = gantt.getDateByPosition(x + task.left);
            }
            return data;
        },

        buildRowEventData: function(evt, element, row, gantt) {
            var data = {evt:evt, element:element, row:row};
            if (gantt !== undefined && evt !== undefined) {
                var x = mouseOffset.getOffset(evt).x;
                // TODO: https://github.com/angular-gantt/angular-gantt/issues/120
                // xInEm = x / $scope.getPxToEmFactor(),
                data.column = gantt.getColumnByPosition(x);
                data.date = gantt.getDateByPosition(x);
            }
            return data;
        },

        buildColumnEventData: function(evt, element, column) {
            var data = {evt:evt, element:element, column:column};
            return data;
        }
    };


}]);


gantt.factory('Gantt', ['$filter', 'Row', 'Timespan', 'ColumnGenerator', 'HeaderGenerator', 'moment', 'binarySearch', function($filter, Row, Timespan, ColumnGenerator, HeaderGenerator, moment, bs) {

    // Gantt logic. Manages the columns, rows and sorting functionality.
    var Gantt = function($scope) {
        var self = this;

        self.rowsMap = {};
        self.rows = [];
        self.visibleRows = [];
        self.timespansMap = {};
        self.timespans = [];
        self.columns = [];
        self.visibleColumns = [];
        self.headers = {};
        self.previousColumns = [];
        self.nextColumns = [];
        self.width = 0;
        var dateRange;

        // Add a watcher if a view related setting changed from outside of the Gantt. Update the gantt accordingly if so.
        // All those changes need a recalculation of the header columns
        $scope.$watch('viewScale+width+labelsWidth+columnWidth+columnSubScale+firstDayOfWeek+weekendDays+showWeekends+workHours+showNonWorkHours', function(newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                self.requestDateRange($scope.fromDate, $scope.toDate);
                self.buildGenerators();
                self.reGenerateColumns();
            }
        });

        $scope.$watch('fromDate+toDate+autoExpand+taskOutOfRange', function(newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                self.requestDateRange($scope.fromDate, $scope.toDate);
            }
        });

        $scope.$watch('currentDate+currentDateValue', function(newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                self.setCurrentDate($scope.currentDateValue);
            }
        });

        // Sets the Gantt view scale. Call reGenerateColumns to make changes visible after changing the view scale.
        // The headers are shown depending on the defined view scale.
        self.buildGenerators = function() {
            switch ($scope.viewScale) {
                case 'hour':
                    self.columnGenerator = new ColumnGenerator.HourGenerator($scope.width, $scope.columnWidth, $scope.columnSubScale, $scope.weekendDays, $scope.showWeekends, $scope.workHours, $scope.showNonWorkHours);
                    break;
                case 'day':
                    self.columnGenerator = new ColumnGenerator.DayGenerator($scope.width, $scope.columnWidth, $scope.columnSubScale, $scope.weekendDays, $scope.showWeekends, $scope.workHours, $scope.showNonWorkHours);
                    break;
                case 'week':
                    self.columnGenerator = new ColumnGenerator.WeekGenerator($scope.width, $scope.columnWidth, $scope.columnSubScale);
                    break;
                case 'month':
                    self.columnGenerator = new ColumnGenerator.MonthGenerator($scope.width, $scope.columnWidth, $scope.columnSubScale);
                    break;
                default:
                    throw 'Unsupported view scale: ' + $scope.viewScale;
            }

            self.headerGenerator = new HeaderGenerator.instance($scope);
        };
        self.buildGenerators();

        self.requestDateRange = function(from, to) {
            if (from && to) {
                if ($scope.taskOutOfRange === 'expand') {
                    setExpandedDateRange(from, to);
                    expandColumns();
                } else {
                    setDateRange(from, to);
                    generateColumns(dateRange.from, dateRange.to);
                }
            }
        };

        var setDateRange = function(from, to) {
            from = moment(from);
            to = moment(to);

            if (dateRange === undefined) {
                dateRange = {};
                dateRange.from = from;
                dateRange.to = to;
            } else {
                dateRange.from = from;
                dateRange.to = to;
            }
        };

        var setExpandedDateRange = function(from, to) {
            from = from ? moment(from) : from;
            to = to ? moment(to) : to;

            if (!dateRange && from && to) {
                dateRange = {};
                dateRange.from = from;
                dateRange.to = to;
            } else if (dateRange) {
                if (from && from < dateRange.from) {
                    dateRange.from = from;
                }
                var minTaskFrom = dateRange.from;
                angular.forEach(self.rows, function(row) {
                    angular.forEach(row.tasks, function(task) {
                        if (minTaskFrom === null || minTaskFrom > task.from) {
                            minTaskFrom = task.from;
                        }
                    });
                });
                if (minTaskFrom && minTaskFrom < dateRange.from) {
                    dateRange.from = minTaskFrom;
                }
                if (to && to > dateRange.to) {
                    dateRange.to = to;
                }
                var maxTaskTo = null;
                angular.forEach(self.rows, function(row) {
                    angular.forEach(row.tasks, function(task) {
                        if (maxTaskTo === null || maxTaskTo < task.to) {
                            maxTaskTo = task.to;
                        }
                    });
                });
                if (maxTaskTo && maxTaskTo > dateRange.to) {
                    dateRange.to = maxTaskTo;
                }
            }
        };

        // Generates the Gantt columns according to dateRange. The columns are generated if necessary only.
        var expandColumns = function() {
            if (dateRange === undefined) {
                return false;
            }

            // Only expand if expand is necessary
            if (self.columns.length === 0) {
                return generateColumns(dateRange.from, dateRange.to);
            } else if (self.columnGenerator.columnExpandNecessary(self.getFirstColumn().date, self.getLastColumn().date, dateRange.from, dateRange.to)) {
                var minFrom = self.getFirstColumn().date > dateRange.from ? dateRange.from : self.getFirstColumn().date;
                var maxTo = self.getLastColumn().date < dateRange.to ? dateRange.to : self.getLastColumn().date;

                return generateColumns(minFrom, maxTo);
            }
        };
        self.requestDateRange($scope.fromDate, $scope.toDate);

        self.setCurrentDate = function(currentDate) {
            self._currentDate = currentDate;
            angular.forEach(self.columns, function(column) {
                if (currentDate >= column.date && currentDate < column.getEndDate()) {
                    column.currentDate = currentDate;
                } else {
                    delete column.currentDate;
                }
            });
        };
        self.setCurrentDate($scope.currentDateValue);

        // Generates the Gantt columns according to the specified from - to date range. Uses the currently assigned column generator.
        var generateColumns = function(from, to) {
            self.columns = self.columnGenerator.generate(from, to);
            self.headers = self.headerGenerator.generate(self.columns);
            if (self._currentDate) {
                self.setCurrentDate(self._currentDate);
            }
            self.previousColumns = [];
            self.nextColumns = [];

            var lastColumn = self.getLastColumn();
            self.width = lastColumn !== undefined ? lastColumn.left + lastColumn.width : 0;

            self.updateTasksPosAndSize();
            self.updateTimespansPosAndSize();

            setDateRange(from, to);
            $scope.fromDate = from;
            $scope.toDate = to;

            return true;
        };

        var expandExtendedColumnsForPosition = function(x) {
            if (x < 0) {
                var firstColumn = self.getFirstColumn();
                var from = firstColumn.date;
                var firstExtendedColumn = self.getFirstColumn(true);
                if (!firstExtendedColumn || firstExtendedColumn.left > x) {
                    self.previousColumns = self.columnGenerator.generate(from, null, -x, 0, true);
                }
                return true;
            } else if (x > self.width) {
                var lastColumn = self.getLastColumn();
                var endDate = lastColumn.getDateByPosition(lastColumn.width);
                var lastExtendedColumn = self.getLastColumn(true);
                if (!lastExtendedColumn || lastExtendedColumn.left + lastExtendedColumn.width < x) {
                    self.nextColumns = self.columnGenerator.generate(endDate, null, x - self.width, self.width, false);
                }
                return true;
            }
            return false;
        };

        var expandExtendedColumnsForDate = function(date) {
            var firstColumn = self.getFirstColumn();
            var from = null;
            if (firstColumn) {
                from = firstColumn.date;
            }

            var lastColumn = self.getLastColumn();
            var endDate = null;
            if (lastColumn) {
                endDate = lastColumn.getDateByPosition(lastColumn.width);
            }

            if (from && date < from) {
                var firstExtendedColumn = self.getFirstColumn(true);
                if (!firstExtendedColumn || firstExtendedColumn.date > date) {
                    self.previousColumns = self.columnGenerator.generate(from, date, null, 0, true);
                }
                return true;
            } else if (endDate && date > endDate) {
                var lastExtendedColumn = self.getLastColumn(true);
                if (!lastExtendedColumn || endDate < lastExtendedColumn) {
                    self.nextColumns = self.columnGenerator.generate(endDate, date, null, self.width, false);
                }
                return true;
            }
            return false;
        };

        // Removes all existing columns and re-generates them. E.g. after e.g. the view scale changed.
        // Rows can be re-generated only if there is a data-range specified. If the re-generation failed the function returns false.
        self.reGenerateColumns = function() {
            self.columns = [];
            self.previousColumns = [];
            self.nextColumns = [];

            if (dateRange !== undefined) {
                expandColumns();
                return true;
            } else {
                return false;
            }
        };

        // Update the position/size of all tasks in the Gantt
        self.updateTasksPosAndSize = function() {
            for (var i = 0, l = self.rows.length; i < l; i++) {
                for (var j = 0, k = self.rows[i].tasks.length; j < k; j++) {
                    self.rows[i].tasks[j].updatePosAndSize();
                }
            }
        };

        // Update the position/size of all timespans in the Gantt
        self.updateTimespansPosAndSize = function() {
            for (var i = 0, l = self.timespans.length; i < l; i++) {
                self.timespans[i].updatePosAndSize();
            }
        };

        // Returns the first Gantt column or undefined
        self.getLastColumn = function(extended) {
            var columns = self.columns;
            if (extended) {
                columns = self.nextColumns;
            }
            if (columns && columns.length > 0) {
                return columns[columns.length - 1];
            } else {
                return undefined;
            }
        };

        // Returns the last Gantt column or undefined
        self.getFirstColumn = function(extended) {
            var columns = self.columns;
            if (extended) {
                columns = self.previousColumns;
            }

            if (columns && columns.length > 0) {
                return columns[0];
            } else {
                return undefined;
            }
        };

        // Returns the column at the given or next possible date
        self.getColumnByDate = function(date) {
            expandExtendedColumnsForDate(date);
            var extendedColumns = self.previousColumns.concat(self.columns, self.nextColumns);
            var columns = bs.get(extendedColumns, date, function(c) {
                return c.date;
            });
            return columns[0] !== undefined ? columns[0] : columns[1];
        };

        // Returns the column at the given position x (in em)
        self.getColumnByPosition = function(x) {
            expandExtendedColumnsForPosition(x);
            var extendedColumns = self.previousColumns.concat(self.columns, self.nextColumns);
            return bs.get(extendedColumns, x, function(c) {
                return c.left;
            })[0];
        };

        // Returns the exact column date at the given position x (in em)
        self.getDateByPosition = function(x, snapForward) {
            var column = self.getColumnByPosition(x);
            if (column !== undefined) {
                if (snapForward !== undefined) {
                    return column.getDateByPosition(x - column.left, snapForward);
                }
                else {
                    return column.getDateByPosition(x - column.left);
                }
            } else {
                return undefined;
            }
        };

        // Returns the position inside the Gantt calculated by the given date
        self.getPositionByDate = function(date) {
            if (!date) {
                return undefined;
            }
            var column = self.getColumnByDate(date);
            if (column !== undefined) {
                return column.getPositionByDate(date);
            } else {
                return undefined;
            }
        };

        // Returns the current Gantt date range or undefined if it has not been defined
        self.getDateRange = function() {
            if (dateRange === undefined) {
                return undefined;
            } else {
                return {
                    from: moment(dateRange.from),
                    to: moment(dateRange.to)
                };
            }
        };

        // Returns the min and max date of all loaded tasks or undefined if there are no tasks loaded
        self.getTasksDateRange = function() {
            if (self.rows.length === 0) {
                return undefined;
            } else {
                var minDate, maxDate;

                for (var i = 0, l = self.rows.length; i < l; i++) {
                    var row = self.rows[i];

                    if (minDate === undefined || row.from < minDate) {
                        minDate = row.from;
                    }

                    if (maxDate === undefined || row.to > maxDate) {
                        maxDate = row.to;
                    }
                }

                return {
                    from: minDate,
                    to: maxDate
                };
            }
        };

        // Returns the number of active headers
        self.getActiveHeadersCount = function() {
            var size = 0, key;
            for (key in self.headers) {
                if (self.headers.hasOwnProperty(key)) {
                    size++;
                }
            }
            return size;
        };

        // Adds or update rows and tasks.
        self.addData = function(data, addEventFn, updateEventFN) {
            for (var i = 0, l = data.length; i < l; i++) {
                var rowData = data[i];
                var isUpdate = addRow(rowData);
                var row = self.rowsMap[rowData.id];

                if (isUpdate === true && updateEventFN !== undefined) {
                    updateEventFN(row);
                } else if (addEventFn !== undefined) {
                    addEventFn(row);
                }
            }

            expandColumns();
        };

        // Adds a row or merges the row and its tasks if there is already one with the same id
        var addRow = function(rowData) {
            // Copy to new row (add) or merge with existing (update)
            var row, isUpdate = false;

            if (rowData.id in self.rowsMap) {
                row = self.rowsMap[rowData.id];
                row.copy(rowData);
                isUpdate = true;
            } else {
                var order = rowData.order;

                // Check if the row has a order predefined. If not assign one
                if (order === undefined) {
                    order = self.highestRowOrder;
                }

                if (order >= self.highestRowOrder) {
                    self.highestRowOrder = order + 1;
                }

                row = new Row(rowData.id, self, rowData.name, order, rowData.data);
                self.rowsMap[rowData.id] = row;
                self.rows.push(row);
            }

            if (rowData.tasks !== undefined && rowData.tasks.length > 0) {
                for (var i = 0, l = rowData.tasks.length; i < l; i++) {
                    var task = row.addTask(rowData.tasks[i]);

                    if ($scope.taskOutOfRange === 'expand') {
                        setExpandedDateRange(task.from, task.to);
                        expandColumns();
                    }

                    task.updatePosAndSize();
                }
            }

            return isUpdate;
        };

        // Removes specified rows or tasks.
        // If a row has no tasks inside the complete row will be deleted.
        self.removeData = function(data, updateEventFn) {
            for (var i = 0, l = data.length; i < l; i++) {
                var rowData = data[i];

                if (rowData.tasks !== undefined && rowData.tasks.length > 0) {
                    // Only delete the specified tasks but not the row and the other tasks

                    if (rowData.id in self.rowsMap) {
                        var row = self.rowsMap[rowData.id];

                        for (var j = 0, k = rowData.tasks.length; j < k; j++) {
                            row.removeTask(rowData.tasks[j].id);
                        }

                        if (updateEventFn !== undefined) {
                            updateEventFn(row);
                        }
                    }
                } else {
                    // Delete the complete row
                    removeRow(rowData.id);
                }
            }
        };

        // Removes the complete row including all tasks
        var removeRow = function(rowId) {
            if (rowId in self.rowsMap) {
                delete self.rowsMap[rowId]; // Remove from map

                for (var i = 0, l = self.rows.length; i < l; i++) {
                    var row = self.rows[i];
                    if (row.id === rowId) {
                        self.rows.splice(i, 1); // Remove from array
                        return row;
                    }
                }
            }

            return undefined;
        };

        // Removes all rows and tasks
        self.removeAllRows = function() {
            self.rowsMap = {};
            self.rows = [];
            self.highestRowOrder = 0;
            self.columns = [];
            dateRange = undefined;
        };

        // Removes all timespans
        self.removeAllTimespans = function() {
            self.timespansMap = {};
            self.timespans = [];
        };

        // Swaps two rows and changes the sort order to custom to display the swapped rows
        self.swapRows = function(a, b) {
            // Swap the two rows
            var order = a.order;
            a.order = b.order;
            b.order = order;
        };

        // Sort rows by the specified sort mode (name, order, custom)
        // and by Ascending or Descending
        self.sortRows = function(expression) {
            var reverse = false;
            expression = expression;
            if (expression.charAt(0) === '-') {
                reverse = true;
                expression = expression.substr(1);
            }

            var angularOrderBy = $filter('orderBy');
            if (expression === 'custom') {
                self.rows = angularOrderBy(self.rows, 'order', reverse);
            } else {
                self.rows = angularOrderBy(self.rows, expression, reverse);
            }
        };

        // Adds or updates timespans
        self.addTimespans = function(timespans, addEventFn, updateEventFN) {
            for (var i = 0, l = timespans.length; i < l; i++) {
                var timespanData = timespans[i];
                var isUpdate = addTimespan(timespanData);
                var timespan = self.timespansMap[timespanData.id];

                if (isUpdate === true && updateEventFN !== undefined) {
                    updateEventFN(timespan);
                } else if (addEventFn !== undefined) {
                    addEventFn(timespan);
                }

                setExpandedDateRange(timespan.from, timespan.to);
                timespan.updatePosAndSize();
            }

            expandColumns();
        };

        // Adds a timespan or merges the timespan if there is already one with the same id
        var addTimespan = function(timespanData) {
            // Copy to new timespan (add) or merge with existing (update)
            var timespan, isUpdate = false;

            if (timespanData.id in self.timespansMap) {
                timespan = self.timespansMap[timespanData.id];
                timespan.copy(timespanData);
                isUpdate = true;
            } else {
                timespan = new Timespan(timespanData.id, self, timespanData.name, timespanData.color,
                    timespanData.classes, timespanData.priority, timespanData.from, timespanData.to, timespanData.data);
                self.timespansMap[timespanData.id] = timespan;
                self.timespans.push(timespan);
            }

            return isUpdate;
        };
    };

    return Gantt;
}]);


gantt.factory('HeaderGenerator', [ 'Column', 'moment', function(Column, moment) {

    var generateHourHeader = function(columns) {
        var generatedHeaders = [];

        var header;
        for (var i = 0, l = columns.length; i < l; i++) {
            var col = columns[i];
            if (i === 0 || columns[i - 1].date.hour() !== col.date.hour()) {
                header = new Column.Hour(moment(col.date), col.left, col.width, col.isWeekend, col.isWorkHour);
                generatedHeaders.push(header);
            } else {
                header.width += col.width;
            }
        }

        return generatedHeaders;
    };

    var generateDayHeader = function(columns) {
        var generatedHeaders = [];

        var header;
        for (var i = 0, l = columns.length; i < l; i++) {
            var col = columns[i];
            if (i === 0 || columns[i - 1].date.day() !== col.date.day()) {
                header = new Column.Day(moment(col.date), col.left, col.width, col.isWeekend, col.daysToNextWorkingDay, col.daysToPrevWorkingDay);
                generatedHeaders.push(header);
            } else {
                header.width += col.width;
            }
        }

        return generatedHeaders;
    };

    var generateWeekHeader = function(columns) {
        var generatedHeaders = [];

        var header;
        for (var i = 0, l = columns.length; i < l; i++) {
            var col = columns[i];
            if (i === 0 || columns[i - 1].date.week() !== col.date.week()) {
                header = new Column.Week(moment(col.date), col.left, col.width, col.date.week());
                generatedHeaders.push(header);
            } else {
                header.width += col.width;
            }
        }

        return generatedHeaders;
    };

    var generateMonthHeader = function(columns) {
        var generatedHeaders = [];

        var header;
        for (var i = 0, l = columns.length; i < l; i++) {
            var col = columns[i];
            if (i === 0 || columns[i - 1].date.month() !== col.date.month()) {
                header = new Column.Month(moment(col.date), col.left, col.width);
                generatedHeaders.push(header);
            } else {
                header.width += col.width;
            }
        }

        return generatedHeaders;
    };

    return {
        instance: function($scope) {
            this.generate = function(columns) {
                var headers = {};
                if ($scope.headerShowHour && ['hour'].indexOf($scope.viewScale) > -1) {
                    headers.hour = generateHourHeader(columns);
                }
                if ($scope.headerShowDay && ['hour', 'day'].indexOf($scope.viewScale) > -1) {
                    headers.day = generateDayHeader(columns);
                }
                if ($scope.headerShowWeek && ['week'].indexOf($scope.viewScale) > -1) {
                    headers.week = generateWeekHeader(columns);
                }
                if ($scope.headerShowMonth && ['week', 'month'].indexOf($scope.viewScale) > -1) {
                    headers.month = generateMonthHeader(columns);
                }
                return headers;
            };
        }
    };
}]);


gantt.factory('Row', ['Task', 'moment', function(Task, moment) {
    var Row = function(id, gantt, name, order, data) {
        var self = this;

        self.id = id;
        self.gantt = gantt;
        self.name = name;
        self.order = order;
        self.from = undefined;
        self.to = undefined;
        self.tasksMap = {};
        self.tasks = [];
        self.visibleTasks = [];
        self.data = data;

        // Adds a task to a specific row. Merges the task if there is already one with the same id
        self.addTask = function(taskData) {
            // Copy to new task (add) or merge with existing (update)
            var task;

            if (taskData.id in self.tasksMap) {
                task = self.tasksMap[taskData.id];
                task.copy(taskData);
            } else {
                task = new Task(taskData.id, self, taskData.name, taskData.color, taskData.classes, taskData.priority, taskData.from, taskData.to, taskData.data, taskData.est, taskData.lct);
                self.tasksMap[taskData.id] = task;
                self.tasks.push(task);
            }

            self.sortTasks();
            self.setFromToByTask(task);
            return task;
        };

        // Removes the task from the existing row and adds it to he current one
        self.moveTaskToRow = function(task) {
            task.row.removeTask(task.id);
            self.tasksMap[task.id] = task;
            self.tasks.push(task);
            self.setFromTo();
            task.row = self;
            task.updatePosAndSize();
        };

        // Remove the specified task from the row
        self.removeTask = function(taskId) {
            if (taskId in self.tasksMap) {
                delete self.tasksMap[taskId]; // Remove from map

                for (var i = 0, l = self.tasks.length; i < l; i++) {
                    var task = self.tasks[i];
                    if (task.id === taskId) {
                        self.tasks.splice(i, 1); // Remove from array

                        // Update earliest or latest date info as this may change
                        if (self.from - task.from === 0 || self.to - task.to === 0) {
                            self.setFromTo();
                        }

                        return task;
                    }
                }
            }
        };

        // Calculate the earliest from and latest to date of all tasks in a row
        self.setFromTo = function() {
            self.from = undefined;
            self.to = undefined;
            for (var j = 0, k = self.tasks.length; j < k; j++) {
                self.setFromToByTask(self.tasks[j]);
            }
        };

        self.setFromToByTask = function(task) {
            if (self.from === undefined) {
                self.from = moment(task.from);
            } else if (task.from < self.from) {
                self.from = moment(task.from);
            }

            if (self.to === undefined) {
                self.to = moment(task.to);
            } else if (task.to > self.to) {
                self.to = moment(task.to);
            }
        };

        self.sortTasks = function() {
            self.tasks.sort(function(t1, t2) {
                return t1.left - t2.left;
            });
        };

        self.copy = function(row) {
            self.name = row.name;
            self.data = row.data;

            if (row.order !== undefined) {
                self.order = row.order;
            }
        };

        self.clone = function() {
            var clone = new Row(self.id, self.gantt, self.name, self.order, self.data);
            for (var i = 0, l = self.tasks.length; i < l; i++) {
                clone.addTask(self.tasks[i].clone());
            }

            return clone;
        };
    };

    return Row;
}]);


gantt.factory('Scrollable', [function() {
    var Scrollable = function() {
    };
    return Scrollable;
}]);


gantt.factory('Task', ['moment', function(moment) {
    var Task = function(id, row, name, color, classes, priority, from, to, data, est, lct) {
        var self = this;

        self.id = id;
        self.gantt = row.gantt;
        self.row = row;
        self.name = name;
        self.color = color;
        self.classes = classes;
        self.priority = priority;
        self.from = moment(from);
        self.to = moment(to);
        self.truncatedLeft = false;
        self.truncatedRight = false;
        self.data = data;

        if (est !== undefined && lct !== undefined) {
            self.est = moment(est);  //Earliest Start Time
            self.lct = moment(lct);  //Latest Completion Time
        }

        self.checkIfMilestone = function() {
            self.isMilestone = self.from - self.to === 0;
        };

        self.checkIfMilestone();

        self.hasBounds = function() {
            return self.bounds !== undefined;
        };

        // Updates the pos and size of the task according to the from - to date
        self.updatePosAndSize = function() {
            self.modelLeft = self.gantt.getPositionByDate(self.from);
            self.modelWidth = self.gantt.getPositionByDate(self.to) - self.modelLeft;

            self.outOfRange = self.modelLeft + self.modelWidth < 0 || self.modelLeft > self.gantt.width;

            self.left = Math.min(Math.max(self.modelLeft, 0), self.gantt.width);
            if (self.modelLeft < 0) {
                self.truncatedLeft = true;
                if (self.modelWidth + self.modelLeft > self.gantt.width) {
                    self.truncatedRight = true;
                    self.width = self.gantt.width;
                } else {
                    self.truncatedRight = false;
                    self.width = self.modelWidth + self.modelLeft;
                }
            } else if (self.modelWidth + self.modelLeft > self.gantt.width) {
                self.truncatedRight = true;
                self.truncatedLeft = false;
                self.width = self.gantt.width - self.modelLeft;
            } else {
                self.truncatedLeft = false;
                self.truncatedRight = false;
                self.width = self.modelWidth;
            }

            if (self.est !== undefined && self.lct !== undefined) {
                self.bounds = {};
                self.bounds.left = self.gantt.getPositionByDate(self.est);
                self.bounds.width = self.gantt.getPositionByDate(self.lct) - self.bounds.left;
            }
        };

        // Expands the start of the task to the specified position (in em)
        self.setFrom = function(x) {
            self.from = self.gantt.getDateByPosition(x, true);
            self.row.setFromToByTask(self);
            self.updatePosAndSize();
            self.checkIfMilestone();
        };

        // Expands the end of the task to the specified position (in em)
        self.setTo = function(x) {
            self.to = self.gantt.getDateByPosition(x, false);
            self.row.setFromToByTask(self);
            self.updatePosAndSize();
            self.checkIfMilestone();
        };

        // Moves the task to the specified position (in em)
        self.moveTo = function(x) {
            self.from = self.gantt.getDateByPosition(x, true);
            var newTaskLeft = self.gantt.getPositionByDate(self.from);
            self.to = self.gantt.getDateByPosition(newTaskLeft + self.modelWidth, false);
            self.row.setFromToByTask(self);
            self.updatePosAndSize();
        };

        self.copy = function(task) {
            self.name = task.name;
            self.color = task.color;
            self.classes = task.classes;
            self.priority = task.priority;
            self.from = moment(task.from);
            self.to = moment(task.to);
            self.est = task.est !== undefined ? moment(task.est) : undefined;
            self.lct = task.lct !== undefined ? moment(task.lct) : undefined;
            self.data = task.data;
            self.isMilestone = task.isMilestone;
        };

        self.clone = function() {
            return new Task(self.id, self.row, self.name, self.color, self.classes, self.priority, self.from, self.to, self.data, self.est, self.lct);
        };
    };

    return Task;
}]);


gantt.factory('Timespan', ['moment', function(moment) {
    var Timespan = function(id, gantt, name, color, classes, priority, from, to, data, est, lct) {
        var self = this;

        self.id = id;
        self.gantt = gantt;
        self.name = name;
        self.color = color;
        self.classes = classes;
        self.priority = priority;
        self.from = moment(from);
        self.to = moment(to);
        self.data = data;

        if (est !== undefined && lct !== undefined) {
            self.est = moment(est);  //Earliest Start Time
            self.lct = moment(lct);  //Latest Completion Time
        }

        self.hasBounds = function() {
            return self.bounds !== undefined;
        };

        // Updates the pos and size of the timespan according to the from - to date
        self.updatePosAndSize = function() {
            self.left = self.gantt.getPositionByDate(self.from);
            self.width = self.gantt.getPositionByDate(self.to) - self.left;

            if (self.est !== undefined && self.lct !== undefined) {
                self.bounds = {};
                self.bounds.left = self.gantt.getPositionByDate(self.est);
                self.bounds.width = self.gantt.getPositionByDate(self.lct) - self.bounds.left;
            }
        };

        // Expands the start of the timespan to the specified position (in em)
        self.setFrom = function(x) {
            self.from = self.gantt.getDateByPosition(x, true);
            self.updatePosAndSize();
        };

        // Expands the end of the timespan to the specified position (in em)
        self.setTo = function(x) {
            self.to = self.gantt.getDateByPosition(x, false);
            self.updatePosAndSize();
        };

        // Moves the timespan to the specified position (in em)
        self.moveTo = function(x) {
            self.from = self.gantt.getDateByPosition(x, true);
            self.to = self.gantt.getDateByPosition(x + self.width, false);
            self.updatePosAndSize();
        };

        self.copy = function(timespan) {
            self.name = timespan.name;
            self.color = timespan.color;
            self.classes = timespan.classes;
            self.priority = timespan.priority;
            self.from = moment(timespan.from);
            self.to = moment(timespan.to);
            self.est = timespan.est !== undefined ? moment(timespan.est) : undefined;
            self.lct = timespan.lct !== undefined ? moment(timespan.lct) : undefined;
            self.data = timespan.data;
        };

        self.clone = function() {
            return new Timespan(self.id, self.gantt, self.name, self.color, self.classes, self.priority, self.from, self.to, self.data, self.est, self.lct);
        };
    };

    return Timespan;
}]);


gantt.service('binarySearch', [ function() {
    // Returns the object on the left and right in an array using the given cmp function.
    // The compare function defined which property of the value to compare (e.g.: c => c.left)

    return {
        getIndicesOnly: function(input, value, comparer) {
            var lo = -1, hi = input.length;
            while (hi - lo > 1) {
                var mid = Math.floor((lo + hi) / 2);
                if (comparer(input[mid]) <= value) {
                    lo = mid;
                } else {
                    hi = mid;
                }
            }
            if (input[lo] !== undefined && comparer(input[lo]) === value) {
                hi = lo;
            }
            return [lo, hi];
        },
        get: function(input, value, comparer) {
            var res = this.getIndicesOnly(input, value, comparer);
            return [input[res[0]], input[res[1]]];
        }
    };
}]);

gantt.directive('ganttBody', [function() {
    return {
        restrict: 'E',
        require: '^gantt',
        transclude: true,
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.body.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        controller: ['$scope', '$element', 'Body', function($scope, $element, Body) {
            $scope.body = new Body();
            $scope.body.$element = $element;
        }]
    };
}]);


gantt.directive('ganttColumnHeader', ['Events', 'GANTT_EVENTS', function(Events, GANTT_EVENTS) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.columnHeader.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        controller: ['$scope', '$element', function($scope, $element) {
            $element.bind('click', function(evt) {
                $scope.$emit(GANTT_EVENTS.COLUMN_CLICKED, Events.buildColumnEventData(evt, $element, $scope.column));
            });

            $element.bind('dblclick', function(evt) {
                $scope.$emit(GANTT_EVENTS.COLUMN_DBL_CLICKED, Events.buildColumnEventData(evt, $element, $scope.column));
            });

            $element.bind('contextmenu', function(evt) {
                $scope.$emit(GANTT_EVENTS.COLUMN_CONTEXTMENU, Events.buildColumnEventData(evt, $element, $scope.column));
            });
        }]
    };
}]);


gantt.filter('ganttColumnLimit', [ 'binarySearch', function(bs) {
    // Returns only the columns which are visible on the screen

    return function(input, scrollLeft, scrollWidth) {
        var cmp = function(c) {
            return c.left;
        };
        var start = bs.getIndicesOnly(input, scrollLeft, cmp)[0];
        var end = bs.getIndicesOnly(input, scrollLeft + scrollWidth, cmp)[1];
        return input.slice(start, end);
    };
}]);

gantt.directive('ganttLimitUpdater', ['$timeout', function($timeout) {
    // Updates the limit filters if the user scrolls the gantt chart

    return {
        restrict: 'A',
        controller: ['$scope', '$element', function($scope, $element) {
            var el = $element[0];
            var scrollUpdate = function() {
                $scope.scrollStart = el.scrollLeft / $scope.getPxToEmFactor();
                $scope.scrollWidth = el.offsetWidth / $scope.getPxToEmFactor();
            };

            $element.bind('scroll', function() {
                $scope.$apply(function() {
                    scrollUpdate();
                });
            });

            $scope.$watch('gantt.width', function() {
                $timeout(function() {
                    scrollUpdate();
                }, 20, true);
            });
        }]
    };
}]);

gantt.filter('ganttRowLimit', ['$filter', function($filter) {
    // Returns only the rows which are visible on the screen
    // Use the rows height and position to decide if a row is still visible
    // TODO

    return function(input, $scope) {
        if ($scope.filterRow) {
            input = $filter('filter')(input, $scope.filterRow, $scope.filterRowComparator);
        }
        return input;
    };
}]);

gantt.filter('ganttTaskLimit', ['$filter', function($filter) {
    // Returns only the tasks which are visible on the screen
    // Use the task width and position to decide if a task is still visible

    return function(input, scrollLeft, scrollWidth, $scope) {
        var res = [];
        for (var i = 0, l = input.length; i < l; i++) {
            var task = input[i];

            if (task.isMoving) {
                // If the task is moving, be sure to keep it existing.
                res.push(task);
            } else {
                // If the task can be drawn with gantt columns only.
                if (task.to > $scope.$parent.gantt.getFirstColumn().date && task.from < $scope.$parent.gantt.getLastColumn().getEndDate()) {

                    // If task has a visible part on the screen
                    if (task.left >= scrollLeft && task.left <= scrollLeft + scrollWidth ||
                        task.left + task.width >= scrollLeft && task.left + task.width <= scrollLeft + scrollWidth ||
                        task.left < scrollLeft && task.left + task.width > scrollLeft + scrollWidth) {

                        res.push(task);
                    }
                }
            }

        }

        if ($scope.filterTask) {
            res = $filter('filter')(res, $scope.filterTask, $scope.filterTaskComparator);
        }

        return res;
    };
}]);

gantt.directive('ganttLabelsResize', ['$document', 'debounce', 'mouseOffset', 'GANTT_EVENTS', function($document, debounce, mouseOffset, GANTT_EVENTS) {

    return {
        restrict: 'A',
        scope: { enabled: '=ganttLabelsResize',
            width: '=ganttLabelsResizeWidth',
            minWidth: '=ganttLabelsResizeMinWidth'},
        controller: ['$scope', '$element', function($scope, $element) {
            var resizeAreaWidth = 5;
            var cursor = 'ew-resize';
            var originalPos;

            $element.bind('mousedown', function(e) {
                if ($scope.enabled && isInResizeArea(e)) {
                    enableResizeMode(e);
                    e.preventDefault();
                }
            });

            $element.bind('mousemove', function(e) {
                if ($scope.enabled) {
                    if (isInResizeArea(e)) {
                        $element.css('cursor', cursor);
                    } else {
                        $element.css('cursor', '');
                    }
                }
            });

            var resize = function(x) {
                $scope.$apply(function() {
                    if ($scope.width === 0) {
                        $scope.width = $element[0].offsetWidth;
                    }

                    $scope.width += x - originalPos;
                    if ($scope.width < $scope.minWidth) {
                        $scope.width = $scope.minWidth;
                    }
                });
                originalPos = x;
            };

            var isInResizeArea = function(e) {
                var x = mouseOffset.getOffset(e).x;

                return x > $element[0].offsetWidth - resizeAreaWidth;
            };

            var enableResizeMode = function(e) {
                originalPos = e.screenX;

                angular.element($document[0].body).css({
                    '-moz-user-select': '-moz-none',
                    '-webkit-user-select': 'none',
                    '-ms-user-select': 'none',
                    'user-select': 'none',
                    'cursor': cursor
                });

                var moveHandler = debounce(function(e) {
                    resize(e.screenX);
                }, 5);

                angular.element($document[0].body).bind('mousemove', moveHandler);

                angular.element($document[0].body).one('mouseup', function() {
                    angular.element($document[0].body).unbind('mousemove', moveHandler);
                    disableResizeMode();
                });
            };

            var disableResizeMode = function() {
                $element.css('cursor', '');

                angular.element($document[0].body).css({
                    '-moz-user-select': '',
                    '-webkit-user-select': '',
                    '-ms-user-select': '',
                    'user-select': '',
                    'cursor': ''
                });

                $scope.$emit(GANTT_EVENTS.ROW_LABELS_RESIZED, { width: $scope.width });
            };
        }]
    };
}]);


gantt.directive('ganttRightClick', ['$parse', function($parse) {

    return {
        restrict: 'A',
        compile: function($element, attr) {
            var fn = $parse(attr.ganttRightClick);

            return function(scope, element) {
                element.on('contextmenu', function(event) {
                    scope.$apply(function() {
                        fn(scope, {$event: event});
                    });
                });
            };
        }
    };
}]);

gantt.directive('ganttRow', ['Events', 'GANTT_EVENTS', function(Events, GANTT_EVENTS) {
    return {
        restrict: 'E',
        require: '^ganttBody',
        transclude: true,
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.row.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        controller: ['$scope', '$element', function($scope, $element) {
            $scope.row.$element = $element;

            $element.bind('mousedown', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_MOUSEDOWN, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });

            $element.bind('mouseup', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_MOUSEUP, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });

            $element.bind('click', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_CLICKED, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });

            $element.bind('dblclick', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_DBL_CLICKED, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });

            $element.bind('contextmenu', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_CONTEXTMENU, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });


        }]
    };
}]);


gantt.directive('ganttRowHeader', ['Events', 'GANTT_EVENTS', function(Events, GANTT_EVENTS) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.rowHeader.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        controller: ['$scope', '$element', function($scope, $element) {
            $element.bind('mousedown', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_HEADER_MOUSEDOWN, {evt: evt});
            });

            $element.bind('mouseup', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_HEADER_MOUSEUP, {evt: evt});
            });

            $element.bind('click', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_HEADER_CLICKED, {evt: evt});
            });

            $element.bind('dblclick', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_HEADER_DBL_CLICKED, {evt: evt});
            });

            $element.bind('contextmenu', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_HEADER_CONTEXTMENU, {evt: evt});
            });


        }]
    };
}]);


gantt.directive('ganttRowLabel', ['Events', 'GANTT_EVENTS', function(Events, GANTT_EVENTS) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.rowLabel.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        controller: ['$scope', '$element', function($scope, $element) {
            $element.bind('mousedown', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_LABEL_MOUSEDOWN, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });

            $element.bind('mouseup', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_LABEL_MOUSEUP, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });

            $element.bind('click', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_LABEL_CLICKED, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });

            $element.bind('dblclick', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_LABEL_DBL_CLICKED, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });

            $element.bind('contextmenu', function(evt) {
                $scope.$emit(GANTT_EVENTS.ROW_LABEL_CONTEXTMENU, Events.buildRowEventData(evt, $element, $scope.row, $scope.gantt));
            });


        }]
    };
}]);


gantt.directive('ganttHorizontalScrollReceiver', function() {
    // The element with this attribute will scroll at the same time as the scrollSender element

    return {
        restrict: 'A',
        require: '^ganttScrollManager',
        controller: ['$scope', '$element', function($scope, $element) {
            $scope.scrollManager.horizontal.push($element[0]);
        }]
    };
});

gantt.directive('ganttScrollManager', function() {
    // The element with this attribute will scroll at the same time as the scrollSender element

    return {
        restrict: 'A',
        require: '^gantt',
        controller: ['$scope', function($scope) {
            $scope.scrollManager = {
                horizontal: [],
                vertical: []
            };
        }]
    };
});


gantt.directive('ganttScrollSender', ['$timeout', 'debounce', function($timeout) {
    // Updates the element which are registered for the horizontal or vertical scroll event

    return {
        restrict: 'A',
        require: '^ganttScrollManager',
        controller: ['$scope', '$element', function($scope, $element) {
            var el = $element[0];
            var updateListeners = function() {
                var i, l;

                for (i = 0, l = $scope.scrollManager.vertical.length; i < l; i++) {
                    var vElement = $scope.scrollManager.vertical[i];
                    if (vElement.style.top !== -el.scrollTop) {
                        vElement.style.top = -el.scrollTop + 'px';
                    }
                }

                for (i = 0, l = $scope.scrollManager.horizontal.length; i < l; i++) {
                    var hElement = $scope.scrollManager.horizontal[i];
                    if (hElement.style.left !== -el.scrollLeft) {
                        hElement.style.left = -el.scrollLeft + 'px';
                    }
                }
            };

            $element.bind('scroll', updateListeners);

            $scope.$watch('gantt.width', function(newValue) {
                if (newValue === 0) {
                    $timeout(function() {
                        updateListeners();
                    }, 0, true);
                }
            });
        }]
    };
}]);


gantt.directive('ganttScrollable', ['Scrollable', 'debounce', 'GANTT_EVENTS', function(Scrollable, debounce, GANTT_EVENTS) {
    return {
        restrict: 'E',
        transclude: true,
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.scrollable.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        controller: ['$scope', '$element', function($scope, $element) {
            $scope.scrollable = new Scrollable();
            $scope.scrollable.$element = $element;

            // Bind scroll event
            $element.bind('scroll', debounce(function() {
                if ($scope.gantt.getDateRange() === undefined) {
                    return;
                }

                var el = $element[0];
                var direction;
                var date;

                if (el.scrollLeft === 0) {
                    direction = 'left';
                    date = $scope.gantt.getDateRange().from;
                } else if (el.offsetWidth + el.scrollLeft >= el.scrollWidth) {
                    direction = 'right';
                    date = $scope.gantt.getDateRange().to;
                }

                if (date !== undefined) {
                    $scope.autoExpandColumns(el, date, direction);
                    $scope.$emit(GANTT_EVENTS.SCROLL, {left: el.scrollLeft, date: date, direction: direction});
                } else {
                    $scope.$emit(GANTT_EVENTS.SCROLL, {left: el.scrollLeft});
                }
            }, 5));
        }]
    };
}]);


gantt.directive('ganttVerticalScrollReceiver', function() {
    // The element with this attribute will scroll at the same time as the scrollSender element

    return {
        restrict: 'A',
        require: '^ganttScrollManager',
        controller: ['$scope', '$element', function($scope, $element) {
            $scope.scrollManager.vertical.push($element[0]);
        }]
    };
});

gantt.service('sortManager', [ function() {
    // Contains the row which the user wants to sort (the one he started to drag)

    return { startRow: undefined };
}]);

gantt.directive('ganttSortable', ['$document', 'sortManager', function($document, sortManager) {
    // Provides the row sort functionality to any Gantt row
    // Uses the sortableState to share the current row

    return {
        restrict: 'E',
        template: '<div ng-transclude></div>',
        replace: true,
        transclude: true,
        scope: { row: '=ngModel', swap: '&', active: '=?' },
        controller: ['$scope', '$element', function($scope, $element) {
            $element.bind('mousedown', function() {
                if ($scope.active !== true) {
                    return;
                }

                enableDragMode();

                var disableHandler = function() {
                    $scope.$apply(function() {
                        angular.element($document[0].body).unbind('mouseup', disableHandler);
                        disableDragMode();
                    });
                };
                angular.element($document[0].body).bind('mouseup', disableHandler);
            });

            $element.bind('mousemove', function(e) {
                if (isInDragMode()) {
                    var elementBelowMouse = angular.element($document[0].elementFromPoint(e.clientX, e.clientY));
                    var targetRow = elementBelowMouse.controller('ngModel').$modelValue;

                    $scope.$apply(function() {
                        $scope.swap({a: targetRow, b: sortManager.startRow});
                    });
                }
            });

            var isInDragMode = function() {
                return sortManager.startRow !== undefined && !angular.equals($scope.row, sortManager.startRow);
            };

            var enableDragMode = function() {
                sortManager.startRow = $scope.row;
                $element.css('cursor', 'move');
                angular.element($document[0].body).css({
                    '-moz-user-select': '-moz-none',
                    '-webkit-user-select': 'none',
                    '-ms-user-select': 'none',
                    'user-select': 'none',
                    'cursor': 'no-drop'
                });
            };

            var disableDragMode = function() {
                sortManager.startRow = undefined;
                $element.css('cursor', 'pointer');
                angular.element($document[0].body).css({
                    '-moz-user-select': '',
                    '-webkit-user-select': '',
                    '-ms-user-select': '',
                    'user-select': '',
                    'cursor': 'auto'
                });
            };
        }]
    };
}]);

gantt.directive('ganttBounds', [function() {
    // Displays a box representing the earliest allowable start time and latest completion time for a job

    return {
        restrict: 'E',
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.bounds.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        replace: true,
        scope: { task: '=ngModel' },
        controller: ['$scope', function($scope) {
            var css = {};

            if (!$scope.task.hasBounds()) {
                $scope.visible = false;
            }

            $scope.getCss = function() {
                if ($scope.task.hasBounds()) {
                    css.width = $scope.task.bounds.width + 'em';

                    if ($scope.task.isMilestone === true || $scope.task.width === 0) {
                        css.left = ($scope.task.bounds.left - ($scope.task.left - 0.3)) + 'em';
                    } else {
                        css.left = ($scope.task.bounds.left - $scope.task.left) + 'em';
                    }
                }

                return css;
            };

            $scope.getClass = function() {
                if ($scope.task.est === undefined || $scope.task.lct === undefined) {
                    return 'gantt-task-bounds-in';
                } else if ($scope.task.est > $scope.task.from) {
                    return 'gantt-task-bounds-out';
                }
                else if ($scope.task.lct < $scope.task.to) {
                    return 'gantt-task-bounds-out';
                }
                else {
                    return 'gantt-task-bounds-in';
                }
            };

            $scope.$watch('task.isMouseOver', function() {
                if ($scope.task.hasBounds() && !$scope.task.isMoving) {
                    $scope.visible = !($scope.task.isMouseOver === undefined || $scope.task.isMouseOver === false);
                }
            });

            $scope.$watch('task.isMoving', function(newValue) {
                if ($scope.task.hasBounds()) {
                    $scope.visible = newValue === true;
                }
            });
        }]
    };
}]);


gantt.directive('ganttTask', ['$window', '$document', '$timeout', 'smartEvent', 'debounce', 'mouseOffset', 'mouseButton', 'Events', 'GANTT_EVENTS', function($window, $document, $timeout, smartEvent, debounce, mouseOffset, mouseButton, Events, GANTT_EVENTS) {

    return {
        restrict: 'E',
        require: '^ganttRow',
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.task.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        replace: true,
        controller: ['$scope', '$element', function($scope, $element) {
            var resizeAreaWidthBig = 5;
            var resizeAreaWidthSmall = 3;
            var scrollSpeed = 15;
            var scrollTriggerDistance = 5;

            var windowElement = angular.element($window);
            var ganttRowElement = $scope.row.$element;
            var ganttBodyElement = $scope.body.$element;
            var ganttScrollElement = $scope.scrollable.$element;

            var taskHasBeenChanged = false;
            var mouseOffsetInEm;
            var moveStartX;
            var scrollInterval;

            $element.bind('mousedown', function(evt) {
                $scope.$apply(function() {
                    var mode = getMoveMode(evt);
                    if (mode !== '' && mouseButton.getButton(evt) === 1) {
                        var offsetX = mouseOffset.getOffsetForElement(ganttBodyElement[0], evt).x;
                        enableMoveMode(mode, offsetX, evt);
                    }
                });
            });

            $element.bind('click', function(evt) {
                $scope.$apply(function() {
                    // Only raise click event if there was no task update event
                    if (!taskHasBeenChanged) {
                        $scope.$emit(GANTT_EVENTS.TASK_CLICKED, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                    }

                    evt.stopPropagation();
                });
            });

            $element.bind('dblclick', function(evt) {
                $scope.$apply(function() {
                    // Only raise dbl click event if there was no task update event
                    if (!taskHasBeenChanged) {
                        $scope.$emit(GANTT_EVENTS.TASK_DBL_CLICKED, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                    }

                    evt.stopPropagation();
                });
            });

            $element.bind('contextmenu', function(evt) {
                $scope.$apply(function() {
                    // Only raise click event if there was no task update event
                    if (!taskHasBeenChanged) {
                        $scope.$emit(GANTT_EVENTS.TASK_CONTEXTMENU, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                    }

                    evt.stopPropagation();
                });
            });

            $element.bind('mousemove', debounce(function(e) {
                var mode = getMoveMode(e);
                if (mode !== '' && ($scope.task.isMoving || mode !== 'M')) {
                    $element.css('cursor', getCursor(mode));
                } else {
                    $element.css('cursor', '');
                }

                $scope.task.mouseX = e.clientX;
            }, 5));

            $element.bind('mouseenter', function(e) {
                $scope.$apply(function() {
                    $scope.task.mouseX = e.clientX;
                    $scope.task.isMouseOver = true;
                });
            });

            $element.bind('mouseleave', function() {
                $scope.$apply(function() {
                    $scope.task.isMouseOver = false;
                });
            });

            var handleMove = function(mode, evt) {
                if ($scope.task.isMoving === false) {
                    return;
                }

                moveTask(mode, evt);
                scrollScreen(mode, evt);
            };

            var moveTask = function(mode, evt) {
                var mousePos = mouseOffset.getOffsetForElement(ganttBodyElement[0], evt);
                $scope.task.mouseOffsetX = mousePos.x;
                var xInEm = mousePos.x / $scope.getPxToEmFactor();
                if (mode === 'M') {
                    if ($scope.allowTaskRowSwitching) {
                        var targetRow = getRowByY(mousePos.y);
                        if (targetRow !== undefined && $scope.task.row.id !== targetRow.id) {
                            targetRow.moveTaskToRow($scope.task);
                        }
                    }

                    if ($scope.allowTaskMoving) {
                        var x = xInEm - mouseOffsetInEm;
                        if ($scope.taskOutOfRange !== 'truncate') {
                            if (x < 0) {
                                x = 0;
                            } else if (x + $scope.task.width >= $scope.gantt.width) {
                                x = $scope.gantt.width - $scope.task.width;
                            }
                        }
                        $scope.task.moveTo(x);
                        $scope.$emit(GANTT_EVENTS.TASK_MOVE, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                    }
                } else if (mode === 'E') {
                    if ($scope.taskOutOfRange !== 'truncate') {
                        if (xInEm < $scope.task.left) {
                            xInEm = $scope.task.left;
                        } else if (xInEm > $scope.gantt.width) {
                            xInEm = $scope.gantt.width;
                        }
                    }
                    $scope.task.setTo(xInEm);
                    $scope.$emit(GANTT_EVENTS.TASK_RESIZE, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                } else {
                    if ($scope.taskOutOfRange !== 'truncate') {
                        if (xInEm > $scope.task.left + $scope.task.width) {
                            xInEm = $scope.task.left + $scope.task.width;
                        } else if (xInEm < 0) {
                            xInEm = 0;
                        }
                    }
                    $scope.task.setFrom(xInEm);
                    $scope.$emit(GANTT_EVENTS.TASK_RESIZE, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                }

                taskHasBeenChanged = true;
            };

            var scrollScreen = function(mode, evt) {
                var mousePos = mouseOffset.getOffsetForElement(ganttBodyElement[0], evt);
                var leftScreenBorder = ganttScrollElement[0].scrollLeft;
                var keepOnScrolling = false;

                if (mousePos.x < moveStartX) {
                    // Scroll to the left
                    if (mousePos.x <= leftScreenBorder + scrollTriggerDistance) {
                        mousePos.x -= scrollSpeed;
                        keepOnScrolling = true;
                        $scope.scrollLeft(scrollSpeed);
                    }
                } else {
                    // Scroll to the right
                    var screenWidth = ganttScrollElement[0].offsetWidth;
                    var rightScreenBorder = leftScreenBorder + screenWidth;

                    if (mousePos.x >= rightScreenBorder - scrollTriggerDistance) {
                        mousePos.x += scrollSpeed;
                        keepOnScrolling = true;
                        $scope.scrollRight(scrollSpeed);
                    }
                }

                if (keepOnScrolling) {
                    scrollInterval = $timeout(function() {
                        handleMove(mode, evt);
                    }, 100, true);
                }
            };

            var clearScrollInterval = function() {
                if (scrollInterval !== undefined) {
                    $timeout.cancel(scrollInterval);
                    scrollInterval = undefined;
                }
            };

            var getRowByY = function(y) {
                if (y >= ganttRowElement[0].offsetTop && y <= ganttRowElement[0].offsetTop + ganttRowElement[0].offsetHeight) {
                    return $scope.task.row;
                } else {
                    var rowHeight = ganttBodyElement[0].offsetHeight / $scope.task.row.gantt.visibleRows.length;
                    var pos = Math.floor(y / rowHeight);
                    return $scope.task.row.gantt.visibleRows[pos];
                }
            };

            var getMoveMode = function(e) {
                var x = mouseOffset.getOffset(e).x;

                var distance = 0;

                // Define resize&move area. Make sure the move area does not get too small.
                if ($scope.allowTaskResizing) {
                    distance = $element[0].offsetWidth < 10 ? resizeAreaWidthSmall : resizeAreaWidthBig;
                }

                if ($scope.allowTaskResizing && x > $element[0].offsetWidth - distance) {
                    return 'E';
                } else if ($scope.allowTaskResizing && x < distance) {
                    return 'W';
                } else if (($scope.allowTaskMoving || $scope.allowTaskRowSwitching) && x >= distance && x <= $element[0].offsetWidth - distance) {
                    return 'M';
                } else {
                    return '';
                }
            };

            var getCursor = function(mode) {
                switch (mode) {
                    case 'E':
                        return 'e-resize';
                    case 'W':
                        return 'w-resize';
                    case 'M':
                        return 'move';
                }
            };

            var enableMoveMode = function(mode, x, evt) {
                // Raise task move start event
                if (!$scope.task.isMoving) {
                    if (mode === 'M') {
                        $scope.$emit(GANTT_EVENTS.TASK_MOVE_BEGIN, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                    } else {
                        $scope.$emit(GANTT_EVENTS.TASK_RESIZE_BEGIN, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                    }
                }

                // Init task move
                taskHasBeenChanged = false;
                $scope.task.moveMode = mode;
                $scope.task.isMoving = true;
                moveStartX = x;
                var xInEm = moveStartX / $scope.getPxToEmFactor();
                mouseOffsetInEm = xInEm - $scope.task.modelLeft;

                // Add move event handlers
                var taskMoveHandler = debounce(function(evt) {
                    $timeout(function() {
                        clearScrollInterval();
                        handleMove(mode, evt);
                    });
                }, 5);
                smartEvent($scope, windowElement, 'mousemove', taskMoveHandler).bind();

                smartEvent($scope, windowElement, 'mouseup', function(evt) {
                    $scope.$apply(function() {
                        windowElement.unbind('mousemove', taskMoveHandler);
                        disableMoveMode(evt);
                    });
                }).bindOnce();

                // Show mouse move/resize cursor
                $element.css('cursor', getCursor(mode));
                angular.element($document[0].body).css({
                    '-moz-user-select': '-moz-none',
                    '-webkit-user-select': 'none',
                    '-ms-user-select': 'none',
                    'user-select': 'none',
                    'cursor': getCursor(mode)
                });
            };

            var disableMoveMode = function(evt) {
                $scope.task.isMoving = false;

                // Stop any active auto scroll
                clearScrollInterval();

                // Set mouse cursor back to default
                $element.css('cursor', '');
                angular.element($document[0].body).css({
                    '-moz-user-select': '',
                    '-webkit-user-select': '',
                    '-ms-user-select': '',
                    'user-select': '',
                    'cursor': ''
                });

                // Raise move end event
                if ($scope.task.moveMode === 'M') {
                    $scope.$emit(GANTT_EVENTS.TASK_MOVE_END, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                } else {
                    $scope.$emit(GANTT_EVENTS.TASK_RESIZE_END, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                }

                $scope.task.modeMode = null;

                // Raise task changed event
                if (taskHasBeenChanged === true) {
                    $scope.task.row.sortTasks(); // Sort tasks so they have the right z-order
                    $scope.$emit(GANTT_EVENTS.TASK_CHANGED, Events.buildTaskEventData(evt, $element, $scope.task, $scope.gantt));
                }
            };

            if ($scope.task.isCreating) {
                delete $scope.task.isCreating;
                enableMoveMode('E', $scope.task.mouseOffsetX);
            } else if ($scope.task.isMoving) {
                // In case the task has been moved to another row a new controller is is created by angular.
                // Enable the move mode again if this was the case.
                enableMoveMode('M', $scope.task.mouseOffsetX);
            }
        }]
    };
}]);


gantt.directive('ganttTooltip', ['$timeout', '$document', 'debounce', 'smartEvent', function($timeout, $document, debounce, smartEvent) {
    // This tooltip displays more information about a task

    return {
        restrict: 'E',
        templateUrl: function(tElement, tAttrs) {
            if (tAttrs.templateUrl === undefined) {
                return 'template/default.tooltip.tmpl.html';
            } else {
                return tAttrs.templateUrl;
            }
        },
        replace: true,
        controller: ['$scope', '$element', function($scope, $element) {
            var bodyElement = angular.element($document[0].body);
            var parentElement = $element.parent();
            $scope.visible = false;
            $scope.css = {};

            $scope.$watch('task.isMouseOver', function(newValue) {
                if (newValue === true) {
                    showTooltip($scope.task.mouseX);
                } else if (newValue === false && $scope.task.isMoving === false) {
                    hideTooltip();
                }
            });

            var mouseMoveHandler = smartEvent($scope, bodyElement, 'mousemove', debounce(function(e) {
                if ($scope.visible === true) {
                    updateTooltip(e.clientX);
                } else {
                    showTooltip(e.clientX);
                }
            }, 1));

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
                }, 1, true);
            };

            var updateTooltip = function(x) {
                $element.removeClass('gantt-task-infoArrow');
                $element.removeClass('gantt-task-infoArrowR');

                // Check if info is overlapping with view port
                if (x + $element[0].offsetWidth > getViewPortWidth()) {
                    $scope.css.left = (x + 20 - $element[0].offsetWidth) + 'px';
                    $element.addClass('gantt-task-infoArrowR'); // Right aligned info
                } else {
                    $scope.css.left = (x - 20) + 'px';
                    $element.addClass('gantt-task-infoArrow');
                }
            };

            var hideTooltip = function() {
                $scope.css.opacity = 0;
                $scope.visible = false;
            };
        }]
    };
}]);


gantt.factory('debounce', ['$timeout', function($timeout) {
    function debounce(fn, timeout) {
        var nthCall = 0;
        return function() {
            var self = this;
            var argz = arguments;
            nthCall++;
            var later = (function(version) {
                return function() {
                    if (version === nthCall) {
                        return fn.apply(self, argz);
                    }
                };
            })(nthCall);
            return $timeout(later, timeout, true);
        };
    }

    return debounce;
}]);

gantt.factory('keepScrollPos', ['$timeout', function($timeout) {
    // Make sure the scroll position will be at the same place after the tasks or columns changed

    function keepScrollPos($scope, fn) {
        return function() {
            if ($scope.scrollable) {
                var el = $scope.scrollable.$element[0];

                // Save scroll position
                var oldScrollLeft = el.scrollLeft;
                var left = $scope.gantt.getFirstColumn();
                var pxToEmFactor = $scope.getPxToEmFactor();

                // Execute Gantt changes
                fn.apply(this, arguments);

                // Re-apply scroll position
                left = left === undefined ? 0 : $scope.gantt.getColumnByDate(left.date).left * pxToEmFactor;
                el.scrollLeft = left + oldScrollLeft;

                // Workaround: Set scrollLeft again after the DOM has changed as the assignment of scrollLeft before may not have worked when the scroll area was too tiny.
                if (el.scrollLeft !== left + oldScrollLeft) {
                    $timeout(function() {
                        el.scrollLeft = left + oldScrollLeft;
                    }, 0, false);
                }
            } else {
                // Execute Gantt changes
                fn.apply(this, arguments);
            }
        };
    }

    return keepScrollPos;
}]);


gantt.service('mouseButton', [ function() {
    // Mouse button cross browser normalization

    return {
        getButton: function(e) {
            e = e || window.event;

            if (!e.which) {
                return e.button < 2 ? 1 : e.button === 4 ? 2 : 3;
            } else {
                return e.which;
            }
        }
    };
}]);

gantt.service('mouseOffset', [ function() {
    // Mouse offset support for lesser browsers (read IE 8)

    return {
        getOffset: function(evt) {
            if (evt.offsetX && evt.offsetY) {
                return { x: evt.offsetX, y: evt.offsetY };
            }
            if (evt.layerX && evt.layerY) {
                return { x: evt.layerX, y: evt.layerY };
            } else {
                return this.getOffsetForElement(evt.target, evt);
            }
        },
        getOffsetForElement: function(el, evt) {
            var bb = el.getBoundingClientRect();
            return { x: evt.clientX - bb.left, y: evt.clientY - bb.top };
        }
    };
}]);

gantt.factory('smartEvent', [function() {
    // Auto released the binding when the scope is destroyed. Use if an event is registered on another element than the scope.

    function smartEvent($scope, $element, event, fn) {
        $scope.$on('$destroy', function() {
            $element.unbind(event, fn);
        });

        return {
            bindOnce: function() {
                $element.one(event, fn);
            },
            bind: function() {
                $element.bind(event, fn);
            },
            unbind: function() {
                $element.unbind(event, fn);
            }
        };
    }

    return smartEvent;
}]);

gantt.filter('sprintf', function() {
    function parse(str) {
        var args = [].slice.call(arguments, 1),
            i = 0;

        return str.replace(/%s/g, function() {
            return args[i++];
        });
    }

    return function(str) {
        return parse(str, arguments[1], arguments[2], arguments[3], arguments[4], arguments[5]);
    };
});
angular.module('ganttTemplates', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('template/default.gantt.tmpl.html',
        '<div class="gantt unselectable" gantt-scroll-manager>\n' +
        '    <div class="gantt-labels"\n' +
        '         ng-style="(labelsWidth > 0 && {\'width\': labelsWidth+\'px\'} || {})"\n' +
        '         gantt-labels-resize="allowLabelsResizing" gantt-labels-resize-width="labelsWidth" gantt-labels-resize-min-width="50">\n' +
        '        <div class="gantt-labels-head">\n' +
        '            <gantt-row-header ng-show="gantt.columns.length > 0 && gantt.getActiveHeadersCount() > 0"></gantt-row-header>\n' +
        '        </div>\n' +
        '        <div class="gantt-labels-body"\n' +
        '             ng-style="(maxHeight > 0 && {\'max-height\': (maxHeight-ganttHeader.offsetHeight)+\'px\'} || {})"\n' +
        '             ng-show="gantt.columns.length > 0">\n' +
        '            <div gantt-vertical-scroll-receiver\n' +
        '                 ng-style="{\'position\': \'relative\'}">\n' +
        '                <gantt-row-label ng-repeat="row in gantt.visibleRows = (gantt.rows | ganttRowLimit:this) track by $index">\n' +
        '                    <gantt-sortable swap="swapRows(a,b)" active="allowRowSorting" ng-model="row">\n' +
        '                        <span>{{ row.name }}</span>\n' +
        '                    </gantt-sortable>\n' +
        '                </gantt-row-label>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '    <div class="gantt-head"\n' +
        '         ng-show="gantt.columns.length > 0 && gantt.getActiveHeadersCount() > 0">\n' +
        '        <div gantt-horizontal-scroll-receiver\n' +
        '             ng-style="{\'position\': \'relative\', \'width\': gantt.width+\'em\'}">\n' +
        '            <div class="gantt-head-row"\n' +
        '                 ng-class="(gantt.headers.month !== undefined && \'gantt-head-row-bottom\' || \'\')"\n' +
        '                 ng-if="gantt.headers.month !== undefined">\n' +
        '                <gantt-column-header ng-repeat="column in gantt.headers.month | ganttColumnLimit:scrollStart:scrollWidth track by $index">\n' +
        '                    {{ headerFormatMonth && (column.date | amDateFormat:headerFormatMonth)  || (column.date | amDateFormat:\'MMMM YYYY\') }}\n' +
        '                </gantt-column-header>\n' +
        '            </div>\n' +
        '            <div class="gantt-head-row" ng-if="gantt.headers.week !== undefined">\n' +
        '                <gantt-column-header ng-repeat="column in gantt.headers.week | ganttColumnLimit:scrollStart:scrollWidth track by $index">\n' +
        '                    {{headerFormatWeek && (headerFormatWeek | sprintf:column.week) || column.week }}\n' +
        '                </gantt-column-header>\n' +
        '            </div>\n' +
        '            <div class="gantt-head-row" ng-if="gantt.headers.day !== undefined">\n' +
        '                <gantt-column-header ng-repeat="column in gantt.headers.day | ganttColumnLimit:scrollStart:scrollWidth track by $index">\n' +
        '                    {{ headerFormatDay && (column.date | amDateFormat:headerFormatDay) || (viewScale === \'hour\' && (column.date | amDateFormat: \'DD dddd\') || (column.date | amDateFormat:\'DD\')) }}\n' +
        '                </gantt-column-header>\n' +
        '            </div>\n' +
        '            <div class="gantt-head-row" ng-if="gantt.headers.hour !== undefined">\n' +
        '                <gantt-column-header ng-repeat="column in gantt.headers.hour | ganttColumnLimit:scrollStart:scrollWidth track by $index">\n' +
        '                    {{ headerFormatHour && (column.date | amDateFormat:headerFormatHour) || (column.date | amDateFormat:\'HH\') }}\n' +
        '                </gantt-column-header>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '    <gantt-scrollable>\n' +
        '        <gantt-body>\n' +
        '            <div class="gantt-body-background">\n' +
        '                <div class="gantt-row-height"\n' +
        '                     ng-class-odd="\'gantt-background-row\'"\n' +
        '                     ng-class-even="\'gantt-background-row-alt\'"\n' +
        '                     ng-repeat="row in gantt.visibleRows = (gantt.rows | ganttRowLimit:this) track by $index">\n' +
        '                </div>\n' +
        '            </div>\n' +
        '            <div class="gantt-body-foreground">\n' +
        '                <div class="gantt-current-date-line" ng-if="currentDate === \'line\'" ng-style="{left: (gantt.getPositionByDate(moment(currentDateValue)))+\'em\' }"></div>\n' +
        '                <div ng-class="(viewScale === \'hour\' && !column.isWorkHour && \'gantt-foreground-col-nonworkhour\' || (column.isWeekend && \'gantt-foreground-col-weekend\' || ((column.currentDate && currentDate === \'column\') && \'gantt-foreground-col-current-date\' || \'gantt-foreground-col\')))"\n' +
        '                     ng-style="{\'width\': column.width+\'em\', \'left\': column.left+\'em\'}"\n' +
        '                     ng-repeat="column in gantt.visibleColumns = (gantt.columns | ganttColumnLimit:scrollStart:scrollWidth) track by $index">\n' +
        '                </div>\n' +
        '            </div>\n' +
        '            <div class="gantt-body-content">\n' +
        '                <div class="gantt-timespan"\n' +
        '                     ng-style="{\'left\': ((timespan.left-0.3) || timespan.left)+\'em\', \'width\': timespan.width +\'em\', \'z-index\': (timespan.priority || 0)}"\n' +
        '                     ng-class="timespan.classes"\n' +
        '                     ng-repeat="timespan in gantt.timespans">\n' +
        '                    <gantt-tooltip ng-model="timespan" date-format="\'MMM d\'">\n' +
        '                        <div class="gantt-task-content"><span>{{ timespan.name }}</span></div>\n' +
        '                    </gantt-tooltip>\n' +
        '                </div>\n' +
        '                <gantt-row ng-repeat="row in gantt.visibleRows = (gantt.rows | ganttRowLimit:this) track by row.id">\n' +
        '                    <gantt-task ng-repeat="task in row.visibleTasks = (row.tasks | ganttTaskLimit:scrollStart:scrollWidth:this) track by task.id"></gantt-task>\n' +
        '                </gantt-row>\n' +
        '            </div>\n' +
        '        </gantt-body>\n' +
        '    </gantt-scrollable>\n' +
        '\n' +
        '\n' +
        '    <!--\n' +
        '    ******* Inline templates *******\n' +
        '    You can specify your own templates by either changing the default ones below or by\n' +
        '    adding an attribute template-url="<url to your template>" on the specific element.\n' +
        '    -->\n' +
        '\n' +
        '    <!-- Body template -->\n' +
        '    <script type="text/ng-template" id="template/default.body.tmpl.html">\n' +
        '        <div ng-transclude class="gantt-body" ng-style="{\'width\': gantt.width+\'em\'}"></div>\n' +
        '    </script>\n' +
        '\n' +
        '\n' +
        '    <!-- Scrollable template -->\n' +
        '    <script type="text/ng-template" id="template/default.scrollable.tmpl.html">\n' +
        '        <div ng-transclude class="gantt-scrollable" gantt-scroll-sender gantt-limit-updater\n' +
        '             ng-style="(maxHeight > 0 && {\'max-height\': (maxHeight - ganttHeader.offsetHeight)+\'px\',\n' +
        '        \'overflow-y\': \'auto\', \'overflow-x\': (gantt.rows.length == 0 && \'hidden\' || \'auto\')} ||\n' +
        '        {\'overflow-y\': \'hidden\', \'overflow-x\': (gantt.rows.length == 0 && \'hidden\' || \'auto\')})"></div>\n' +
        '    </script>\n' +
        '\n' +
        '    <!-- Task template -->\n' +
        '    <script type="text/ng-template" id="template/default.task.tmpl.html">\n' +
        '        <div ng-class="(task.isMilestone === true && [\'gantt-task-milestone\'] || [\'gantt-task\']).concat(task.classes)"\n' +
        '             ng-style="{\'left\': ((task.isMilestone === true || task.width === 0) && (task.left-0.3) || task.left)+\'em\', \'width\': task.width +\'em\', \'z-index\': (task.isMoving === true && 1  || task.priority || \'\'), \'background-color\': task.color}">\n' +
        '            <gantt-bounds ng-if="task.bounds !== undefined" ng-model="task"></gantt-bounds>\n' +
        '            <gantt-tooltip ng-if="showTooltips && (task.isMouseOver || task.isMoving)" ng-model="task"></gantt-tooltip>\n' +
        '            <div ng-if="task.truncatedLeft" class="gantt-task-truncated-left"><span>&lt;</span></div>\n' +
        '            <div class="gantt-task-content"><span>{{ (task.isMilestone === true && \'&nbsp;\' || task.name) }}</span></div>\n' +
        '            <div ng-if="task.truncatedRight" class="gantt-task-truncated-right"><span>&gt;</span></div>\n' +
        '        </div>\n' +
        '    </script>\n' +
        '\n' +
        '    <!-- Task tooltip template -->\n' +
        '    <!-- Move ng-if from parent to tooltip directive when https://github.com/angular/angular.js/issues/7183 is fixed -->\n' +
        '    <script type="text/ng-template" id="template/default.tooltip.tmpl.html">\n' +
        '        <div class="gantt-task-info" ng-style="css">\n' +
        '            <div class="gantt-task-info-content">\n' +
        '                {{ task.name }}</br>\n' +
        '                <small>\n' +
        '                    {{\n' +
        '                    tooltipDateFormat = $parent.tooltipDateFormat && $parent.tooltipDateFormat || \'MMM DD, HH:mm\';\n' +
        '                    task.isMilestone === true && (task.from | amDateFormat:tooltipDateFormat) || (task.from | amDateFormat:tooltipDateFormat) + \' - \' + (task.to | amDateFormat:tooltipDateFormat)\n' +
        '                    }}\n' +
        '                </small>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </script>\n' +
        '\n' +
        '    <!-- Task bounds template -->\n' +
        '    <!-- Replace ng-show with ng-if when https://github.com/angular/angular.js/issues/7183 is fixed -->\n' +
        '    <script type="text/ng-template" id="template/default.bounds.tmpl.html">\n' +
        '        <div ng-show=\'visible\' class=\'gantt-task-bounds\' ng-style=\'getCss()\' ng-class=\'getClass()\'></div>\n' +
        '    </script>\n' +
        '\n' +
        '    <!-- Column header template -->\n' +
        '    <script type="text/ng-template" id="template/default.columnHeader.tmpl.html">\n' +
        '        <span ng-transclude class="gantt-column-header" ng-style="{\'width\': column.width+\'em\', \'left\': column.left+\'em\'}"></span>\n' +
        '    </script>\n' +
        '\n' +
        '    <!-- Row template -->\n' +
        '    <script type="text/ng-template" id="template/default.row.tmpl.html">\n' +
        '        <div ng-transclude class="gantt-row gantt-row-height"></div>\n' +
        '    </script>\n' +
        '\n' +
        '    <!-- Row label template -->\n' +
        '    <script type="text/ng-template" id="template/default.rowLabel.tmpl.html">\n' +
        '        <div ng-transclude class="gantt-labels-row gantt-row-height"\n' +
        '             ng-class-odd="\'gantt-background-row\'"\n' +
        '             ng-class-even="\'gantt-background-row-alt\'">\n' +
        '        </div>\n' +
        '    </script>\n' +
        '\n' +
        '    <!-- Row header template -->\n' +
        '    <script type="text/ng-template" id="template/default.rowHeader.tmpl.html">\n' +
        '        <div class="gantt-labels-head-row"\n' +
        '             ng-style="{\'margin-top\': ((gantt.getActiveHeadersCount()-1)*2)+\'em\'}">\n' +
        '            <span>Name</span>\n' +
        '        </div>\n' +
        '    </script>\n' +
        '\n' +
        '\n' +
        '</div>\n' +
        '');
}]);

//# sourceMappingURL=angular-gantt.js.map