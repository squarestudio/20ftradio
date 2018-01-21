if (body.one('.new-events-schedule')) {
    var new_schedule = body.one('.new-events-schedule');
    var existing_dates = [];
    if (new_schedule.one('.date-container')) {
        new_schedule.all('.date-container').each(function (date_container) {
            var date_attr = date_container.getAttribute('data-date-attr');
            if (existing_dates.indexOf(date_attr) > -1) {
                date_container.remove();
            } else {
                existing_dates.push(date_attr);
                if (new_schedule.one('.' + date_attr)) {
                    date_container.one('.items-container').append(new_schedule.all('.' + date_attr))
                }
            }
        });
        var min_width_time = 0;
        new_schedule.all('.event-time-wrapper').each(function (item) {
            if(item.width()>min_width_time){
                min_width_time = item.width();
            }
        });
        new_schedule.all('.event-time-wrapper').setStyles({minWidth: min_width_time+'px'})
    }
}