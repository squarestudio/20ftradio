$(function(){
    if(!sessionStorage.getItem('20ft'))
    {
        var cast = $('.castWrapper').innerHeight();
        sessionStorage.setItem('20ft', 'session');
    }else {
        $('html, body').animate({
            scrollTop: cast
        }, 500);
    }
});