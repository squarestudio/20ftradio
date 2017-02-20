window.Template.Controllers.ProjectController = function (element) {
    'use strict';

    function initialize() {
        if(Site && Y.one('#grid')){
            Site.gridEl = Y.one('#grid');
            Site._setupGrid();
            Site._setupTweakHandler();
        }
    }

    initialize();

    return {
        sync: function () {
            initialize();
        },
        destroy: function () {
            console.log('destroy project');
        }
    };

};