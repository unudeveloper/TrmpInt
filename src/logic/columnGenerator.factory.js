'use strict';
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
                    var cDate = moment(date).startOf('day').hour(i);
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
