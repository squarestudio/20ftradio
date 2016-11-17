window.Template.Util.initShareButtons =  function () {
    var openPopup = function (e) {
        e = (e ? e : window.event);
        var t = (e.currentTarget);
        var
            px = Math.floor(((screen.availWidth || 1366) - 680) / 2),
            py = Math.floor(((screen.availHeight || 700) - 460) / 2);
        var popup = window.open(t.getAttribute('href'), "social",
            "width=680,height=460,left=" + px + ",top=" + py +
            ",location=0,menubar=0,toolbar=0,status=0,scrollbars=1,resizable=1");
        if (popup) {
            popup.focus();
            if (e.stopImmediatePropagation) e.stopImmediatePropagation();
            if (e.preventDefault) e.preventDefault();
            e.returnValue = false;
        }
        return !!popup;
    };
    Y.all(".Share-custom:not(.initialized)").each(function(container) {
        container.addClass('initialized');
        var url = container.getAttribute('data-item-path');
        var external = url.indexOf('http') > -1;
        if(!external) url = location.origin + url;
        container.setAttribute('data-item-path', url);
        container.all('.Share-buttons-item').each(function (soc_link) {
            var href = soc_link.getAttribute('href')+ url;
            soc_link.setAttribute('href', href);
            soc_link.detach('click');
            soc_link.on('click', function (e) {
                openPopup(e)
            })
        })
    });
    Y.all(".bp-hope-social:not(.initialized)").each(function(container) {
        container.addClass('initialized');
        container.all('a').each(function (soc_link) {
            if (soc_link.hasClass('sshb-copy')){
                soc_link.on('click', function (e) {
                    e.halt();
                    var current_link = Y.Node.create('<textarea class="out-off-screen"><textarea/>');
                    current_link.set('value', e.currentTarget.getAttribute('href'));
                    container.prepend(current_link);
                    current_link._node.select();
                    try {
                        var successful = document.execCommand('copy');
                        var msg = successful ? 'successful' : 'unsuccessful';
                        console.log('Copying data was ' + msg);
                        current_link.remove();
                    } catch (err) {
                        console.log('Oops, unable to copy');
                        current_link.remove();
                    }
                })
            } else {
                soc_link.on('click', function (e) {
                    openPopup(e)
                })
            }
        })
    })
};