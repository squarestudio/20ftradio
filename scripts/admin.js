Y.use('node', 'event-base', 'selector-css3', 'io', function(Y) {
    if (window.self !== window.top) {
        window.Squarespace.onInitialize(Y, function() {
            var parentWin = Y.one(window.top);
            var head = parentWin.get('document').one('head');
            if (!head.one('#admin-styles')) {
                parentWin._node.Y.Get.css('/assets/styles/admin.css?t=' + new Date().getTime(), function(err, tx) {
                    if (err) {
                        Y.log('Error loading CSS: ' + err[0].error, 'error');
                        return;
                    }
                    tx && tx.nodes[0].setAttribute('id', 'admin-styles');
                });
            }
            window.top.innerWidth = window.top.innerWidth - 1;
            parentWin.simulate('resize');
        })
    }
});