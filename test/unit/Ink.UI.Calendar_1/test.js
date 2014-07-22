Ink.requireModules(['Ink.UI.Calendar_1', 'Ink.Dom.Css_1', 'Ink.Dom.Event_1', 'Ink.Dom.Element_1', 'Ink.Util.Array_1'], function (Calendar, Css, InkEvent, InkElement, InkArray) {
    QUnit.config.reorder = false;

var body = document.body;
var dtElm;
var dt;

function mkCalendar(options) {
    testWrapper = InkElement.create('div', { insertBottom: body });
    dtElm = InkElement.create('table', { className: 'ink-calendar', insertBottom: testWrapper });
    dt = new Calendar(dtElm, Ink.extendObj({
        startDate: '2000-10-10'
    }, options));
}

module('main', {
    setup: function () {
        mkCalendar({});
    },
    teardown: function () {
        InkElement.remove(testWrapper);
    }
});

test('_dateCmp', function () {
    equal(dt._dateCmp({_year: 2012}, {_year: 2012}), 0);
    equal(dt._dateCmp({_year: 2012, _month: 10}, {_year: 2012}), 0);
    equal(dt._dateCmp({_year: 2012, _month: 10}, {_year: 2012, _month: 11}), -1);
    equal(dt._dateCmp({_year: 2012, _month: 10}, {_year: 2012, _month: 9}), 1);
    equal(dt._dateCmp({_year: 2012, _month: 10, _day: 10}, {_year: 2012, _month: 10}), 0);
    equal(dt._dateCmp({_year: 2012, _month: 10, _day: 10}, {_year: 2012, _month: 10, _day: 11}), -1);
    equal(dt._dateCmp({_year: 2012, _month: 10, _day: 10}, {_year: 2012, _month: 10, _day: 9}), 1);
    equal(dt._dateCmp({_year: 2012, _month: 10, _day: 10}, {_year: 2012, _month: 10, _day: 10}), 0);
});

test('setDate', function () {
    dt.setDate('2000-10-12');
    equal(dt._year, 2000);
    equal(dt._month + 1, 10);
    equal(dt._day, 12);

    dt.setDate('2000-01-01');
    equal(dt._year, 2000);
    equal(dt._month + 1, 1);
    equal(dt._day, 1);
});

test('click to change days', function () {
    sinon.spy(dt, '_setDate')

    stop();
    Syn.click(Ink.s('[data-cal-day="11"]', dtElm), function () {
        ok(dt._setDate.calledWith({ _year: 2000, _month: 9, _day: 11 }));
        start();
    });
});

test('click month to change months', function () {
    dt.yearView();
    sinon.spy(dt, '_setDate')

    stop();
    Syn.click(Ink.s('[data-cal-month="11"]', dtElm), function () {
        ok(dt._setDate.calledOnce);
        ok(dt._setDate.calledWith({ _year: 2000, _month: 11, _day: 10 }));
        start();
    });
});

test('click year to change years', function () {
    dt.decadeView();
    sinon.spy(dt, '_setDate');

    stop();
    Syn.click(Ink.s('[data-cal-year="2001"]', dtElm), function () {
        ok(dt._setDate.calledOnce);
        ok(dt._setDate.calledWith({ _year: 2001, _month: 9, _day: 10 }));
        start();
    });
});

test('next and prev buttons call _onNextPrevClicked', function () {
    sinon.spy(dt, '_onNextPrevClicked')

    stop();
    Syn.click(Ink.s('[href$="next"]', dtElm), function () {
        ok(dt._onNextPrevClicked.calledWith('Month', 'Next'))

        Syn.click(Ink.s('[href$="prev"]', dtElm), function () {
            ok(dt._onNextPrevClicked.calledWith('Month', 'Prev'))
            start();
        })
    });
});

test('_onNextPrevClicked calls get{Next or Prev}{fragment}, then _setDate with the resulting date, then {fragment}view() to render the new view', function () {
    var nextMonth = { _year: 2100, _month: 1, _day: 1 }
    var prevYear = { _year: 100, _month: 10, _day: 30 }
    var nextDecade = { _year: 2010, _month: 1, _day: 1 }

    sinon.stub(dt, '_getNextMonth').returns(nextMonth)
    sinon.stub(dt, '_getPrevYear').returns(prevYear)
    sinon.stub(dt, '_getNextDecade').returns(nextDecade)

    sinon.stub(dt, '_setDate')

    sinon.stub(dt, 'monthView')
    sinon.stub(dt, 'yearView')
    sinon.stub(dt, 'decadeView')

    dt._onNextPrevClicked('Month', 'Next');
    ok(dt._getNextMonth.calledOnce, '_getNextMonth called')
    ok(dt._setDate.calledWith(nextMonth), '_setDate called with the next month as given by _getNextMonth');
    ok(dt.monthView.calledOnce, 'monthView called');

    dt._onNextPrevClicked('Year', 'Prev');
    ok(dt._getPrevYear.calledOnce, '_getPrevYear called')
    ok(dt._setDate.calledWith(prevYear), '_setDate called with given year');
    ok(dt.yearView.calledOnce, 'yearView called');

    dt._onNextPrevClicked('Decade', 'Next');
    ok(dt._getNextDecade.calledOnce, '_getNextDecade called');
    ok(dt._setDate.calledWith(nextDecade), '_setDate called with given decade');
    ok(dt.decadeView.calledOnce, 'decadeView called');

    equal(dt._setDate.callCount, 3);
})

test('setDate with Date objects', function () {
    dt.setDate(new Date(2010, 11, 12));
    equal(dt._year, 2010);
    equal(dt._month + 1, 12);
    equal(dt._day, 12);
});

test('_fitDateToRange', function () {
    dt._setMinMax('2000-05-05:2001-05-05');
    deepEqual(
        dt._fitDateToRange({ _year: 2000, _month: 10, _day: 10}),
        { _year: 2000, _month: 10, _day: 10});
    deepEqual(
        dt._fitDateToRange({ _year: 1999, _month: 10, _day: 10}),
        { _year: 2000, _month: 4, _day: 5});
});

test('_getNextMonth', function () {
    dt.setDate('2000-10-10');
    deepEqual(dt._getNextMonth(), { _year: 2000, _month: 10, _day: 10 });
    dt.setDate('2000-01-01');
    deepEqual(dt._getNextMonth(), { _year: 2000, _month: 1, _day: 1 });
    dt.setDate('2000-11-01');
    deepEqual(dt._getNextMonth(), { _year: 2000, _month: 11, _day: 1 });
    dt.setDate('2000-12-01');
    deepEqual(dt._getNextMonth(), { _year: 2001, _month: 0, _day: 1 });
});

test('_getFirstDayIndex', function () {
    /* Cal 2014-03
     *
     * Su Mo Tu We Th Fr Sa  
     *                    1  <- The "1" is in the 7th day
     *  2  3  4  5  6  7  8  
     *  9 10 11 12 13 14 15  
     * 16 17 18 19 20 21 22  
     * 23 24 25 26 27 28 29  
     * 30 31       
     */
    mkCalendar({ startWeekDay: 0 /* sunday, like the cal above*/});
    strictEqual(dt._getFirstDayIndex(2014, 2 /* month - 1 */), 6);
    /* Cal 2014-03 (starting in monday)
     *
     * Mo Tu We Th Fr Sa Su  
     *                 1  2  <- Now "1" is the sixth day
     *  3  4  5  6  7  8  9  
     * 10 11 12 13 14 15 16  
     * 17 18 19 20 21 22 23  
     * 24 25 26 27 28 29 30  
     * 31                    
     */
    mkCalendar({ startWeekDay: 1 /* monday */});
    strictEqual(dt._getFirstDayIndex(2014, 2), 5);
});

test('_getPrevMonth', function () {
    dt.setDate('2000-10-10');
    deepEqual(dt._getPrevMonth(), { _year: 2000, _month: 8, _day: 10 });
    dt.setDate('2000-01-01');
    deepEqual(dt._getPrevMonth(), { _year: 1999, _month: 11, _day: 1 });
});

test('no start limit date', function () {
    dt._setMinMax('EVER:2000-01-01');
    deepEqual(dt._min, {
        _year: -Number.MAX_VALUE,
        _month: 0,
        _day: 1
    });

    ok(dt._dateWithinRange({_year: -1000, _month: 1, _day: 1}));
    ok(dt._dateWithinRange({_year: 2000, _month: 0, _day: 1}));
    ok(!dt._dateWithinRange({_year: 2001, _month: 1, _day: 1}));
});
test('no end limit date', function () {
    dt._setMinMax('2000-01-01:EVER');
    deepEqual(dt._max, {
        _year: Number.MAX_VALUE,
        _month: 11,
        _day: 31
    });

    ok(!dt._dateWithinRange({_year: -1000, _month: 1, _day: 1}));
    ok(dt._dateWithinRange({_year: 2001, _month: 1, _day: 1}));
});

test('_get(Next|Prev)Month when hitting a limit', function () {
    dt._setMinMax('2000-05-05:2001-05-05');

    dt.setDate('2000-06-01');
    deepEqual(dt._getPrevMonth(), { _year: 2000, _month: 4, _day: 5 });
    dt.setDate('2001-04-09');
    deepEqual(dt._getNextMonth(), { _year: 2001, _month: 4, _day: 5 });

    dt.setDate('2000-06-03');
    deepEqual(dt._getPrevMonth(), { _year: 2000, _month: 4, _day: 5 });

    dt.setDate('2000-06-06');
    deepEqual(dt._getPrevMonth(), { _year: 2000, _month: 4, _day: 6 });

    dt.setDate('2000-05-06');
    deepEqual(dt._getPrevMonth(), null);

    dt.setDate('2001-05-04');
    deepEqual(dt._getNextMonth(), null);
});

test('validDayFn', function () {
    dt._options.validDayFn = sinon.stub().returns(false);
    dt.setDate('2000-01-01');
    dt.monthView();

    var findEnabled = function (button) {
        return !(/disabled/.test(button.className));
    };
    var buttons = Ink.ss('.month tr:not(.header) td', dt.getElement());
    ok(InkArray.some(buttons, findEnabled),
        'All buttons are disabled');

    var spy = dt._options.validDayFn = sinon.spy(sinon.stub().returns(true));
    dt.monthView();
    ok(spy.called);
    ok(InkArray.some(buttons, findEnabled),
        'No buttons are disabled, I made all days valid with validDayFn');

    var lastCall = spy.getCall(30);
    ok(lastCall);
    ok(!spy.getCall(31));
    deepEqual(lastCall.args, [2000, 1, 31], 'called with last day of january');
    strictEqual(lastCall.thisValue, dt, 'called with this=datepicker');
});

// TODO validMonthFn, validYearFn, validDecadeFn

test('nextValidDateFn', function () {
    dt.setDate('2000-01-01');
    var next = sinon.spy(sinon.stub().returns(new Date(2012, 1 - 1, 1)));
    var prev = sinon.spy(sinon.stub().returns(new Date(1990, 1 - 1, 1)));

    dt._options.nextValidDateFn = next;
    dt._options.prevValidDateFn = prev;

    var expectedNextValidDate = {_year: 2012, _month: 0, _day: 1};
    var expectedPrevValidDate = {_year: 1990, _month: 0, _day: 1};

    deepEqual(dt._getNextMonth(), expectedNextValidDate, 'next month is the result of nextValidDateFn');
    ok(next.calledOnce, 'cb called once');
    ok(next.calledWithExactly(2000, 1, 1), 'cb called with year, month, day');
    ok(next.lastCall.thisValue === dt, 'cb called with this=datepicker');

    deepEqual(dt._getPrevMonth(), expectedPrevValidDate, 'prev month is the result of prevValidDateFn');
    ok(prev.calledOnce, 'cb called once');
    ok(prev.calledWithExactly(2000, 1, 1), 'cb called with year, month, day');
    ok(prev.lastCall.thisValue === dt, 'cb called with this=datepicker');

    ok(true, '--- Checking if returning nulls as it should ---');
    next = sinon.stub().returns(null);
    prev = sinon.stub().returns(null);
    dt._options.nextValidDateFn = next;
    dt._options.prevValidDateFn = prev;

    deepEqual(dt._getNextMonth(expectedNextValidDate), null);
    deepEqual(dt._getPrevMonth(expectedPrevValidDate), null);

    ok(next.calledOnce);
    ok(prev.calledOnce);
});

test('getNextDecade and nextValidDateFn', function () {
    dt.setDate('2000-01-01');
    var next = sinon.spy(sinon.stub().returns(new Date(2012, 1 - 1, 1)));
    var prev = sinon.spy(sinon.stub().returns(new Date(1990, 1 - 1, 1)));

    dt._options.nextValidDateFn = next;
    dt._options.prevValidDateFn = prev;

    var expectedNextValidDate = {_year: 2012, _month: 0, _day: 1};
    var expectedPrevValidDate = {_year: 1990, _month: 0, _day: 1};

    deepEqual(dt._getNextDecade(), expectedNextValidDate);
    deepEqual(dt._getPrevDecade(), expectedPrevValidDate);
});

test('getNextYear, getPrevYear', function () {
    dt.setDate('2000-05-05');
    deepEqual(dt._getNextYear(), {_year: 2001, _month: 4, _day: 5});
    deepEqual(dt._getPrevYear(), {_year: 1999, _month: 4, _day: 5});

    dt._setMinMax('1999-10-10:2001-01-02');
    deepEqual(dt._getNextYear(), {_year: 2001, _month: 0, _day: 2});
    deepEqual(dt._getPrevYear(), {_year: 1999, _month: 9, _day: 10});

    dt.setDate('2001-01-01');
    deepEqual(dt._getNextYear(), null);

    dt.setDate('1999-11-11');
    deepEqual(dt._getPrevYear(), null);
});

test('getNextDecade, getPrevDecade', function () {
    dt._getCurrentDecade = sinon.spy(dt._getCurrentDecade);
    dt.setDate('2001-05-05');
    deepEqual(dt._getNextDecade()._year, 2010);
    deepEqual(dt._getPrevDecade()._year, 1990);

    dt._setMinMax('2000-05-01:2020-05-05');
    dt.setDate('2001-05-05');
    deepEqual(dt._getPrevDecade(), null);
    dt.setDate('2020-01-01');
    deepEqual(dt._getNextDecade(), null);
});

test('dateCmp', function () {
    var y2k = { _year: 2000, _month: 0, _day: 1};
    var y2kandaday = { _year: 2000, _month: 0, _day: 2};
    deepEqual(dt._dateCmp(y2k, y2k), 0);
    deepEqual(dt._dateCmp(y2k, y2kandaday), -1);
    deepEqual(dt._dateCmp(y2kandaday, y2k), 1);
});

test('dateCmpUntil', function () {
    var y2k = { _year: 2000, _month: 0, _day: 1};
    var y2kandaday = { _year: 2000, _month: 0, _day: 2 };
    var y2kandamonth = { _year: 2000, _month: 2, _day: 3 };
    deepEqual(dt._dateCmpUntil(y2k, y2kandaday, '_month'), 0, 'too shallow');
    deepEqual(dt._dateCmpUntil(y2k, y2kandaday, '_year'), 0, 'too shallow');
    deepEqual(dt._dateCmpUntil(y2k, y2kandaday, '_day'), -1, 'deep enough, we see a difference');
    deepEqual(dt._dateCmpUntil(y2k, y2kandamonth, '_year'), 0);
    deepEqual(dt._dateCmpUntil(y2k, y2kandamonth, '_month'), -1);
    deepEqual(dt._dateCmpUntil(y2kandamonth, y2k, '_month'), 1);
});

test('daysInMonth', function () {
    equal(dt._daysInMonth(2000, 0), 31);
    equal(dt._daysInMonth(2000, 1), 29);
    equal(dt._daysInMonth(2001, 1), 28);
});

test('set', function () {
    // Because it had a bug
    var dt = Ink.Util.Date_1.set('Y-m-d', '2012-10-10');
    equal(dt.getFullYear(), 2012);
    equal(dt.getMonth(), 9);
    equal(dt.getDate(), 10);
});

test('destroy', function () {
    ok(testWrapper.children.length === 1, 'sanity check. if this fails, review the test because you\'ve changed the DOM structure of this component');
    dt.destroy();
    equal(testWrapper.children.length, 0, 'removed from the DOM');
});

test('regression: months have correct amount of days', function () {
    mkCalendar({
        startDate: '2014-02-01' });
    dt.monthView();
    equal(Ink.ss('[data-cal-day]', testWrapper).length, 28);

    mkCalendar({
        startDate: '2014-01-01' });
    dt.monthView();
    equal(Ink.ss('[data-cal-day]', testWrapper).length, 31);
});

test('regression: days start in the correct week day by filling with an appropriate amount of "empties"', function () {
    /* March 2014  start=Su     March 2014  start=Mo
     * Su Mo Tu We Th Fr Sa     Mo Tu We Th Fr Sa Su
     *                    1                     1  2
     *  2  3  4  5  6  7  8      3  4  5  6  7  8  9
     *  9 10 11 12 13 14 15     10 11 12 13 14 15 16
     * 16 17 18 19 20 21 22     17 18 19 20 21 22 23
     * 23 24 25 26 27 28 29     24 25 26 27 28 29 30
     * 30 31                    31                  
     *
     * 1 day in the first line  2 days in the first line
     */

    equal(Ink.ss('[data-cal-day]', getFirstLine(0)).length, 1);

    equal(Ink.ss('[data-cal-day]', getFirstLine(1)).length, 2);

    function getFirstLine(startWeekDay) {
        mkCalendar({
            startDate: '2014-03-01',
            startWeekDay: startWeekDay });
        dt.monthView();
        var firstLine = Ink.s('.header + tr', testWrapper);
        ok(firstLine, 'sanity check');
        return firstLine;
    }
});

});
