Y.use('node', function () {
    Y.on('domready', function () {
        var move;
        Y.all('.subnav a').each(function (a) {
            a.on('touchstart', function () {
                move = false;
            });
            a.on('touchmove', function () {
                move = true;
            });
            a.on('touchend', function () {
                if (move === false) {
                    window.location = a.getAttribute('href');
                }
            });
        });
    });
});