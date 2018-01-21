if (document.querySelector('.new-events-schedule')) {
    var new_schedule = document.querySelector('.new-events-schedule');
    var existing_dates = [];
    if (new_schedule.querySelector('.date-container')) {
        new_schedule.querySelectorAll('.date-container').forEach(function (date_container) {
            var date_attr = date_container.dataset.dateAttr;
            if (existing_dates.indexOf(date_attr) > -1) {
                date_container.parentNode.removeChild(date_container);
            } else {
                existing_dates.push(date_attr);
                if (new_schedule.querySelector('.' + date_attr)) {
                    var items = new_schedule.querySelectorAll('.' + date_attr);
                    for (i = 0; i < items.length; i++) {
                        date_container.querySelector('.items-container').appendChild(items[i])
                    }
                }
            }
        });
        
    }
}