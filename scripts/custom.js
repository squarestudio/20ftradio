$(function(){
    var cast = $('.castWrapper').innerHeight();
    if(!sessionStorage.getItem('20ft'))
    {
        sessionStorage.setItem('20ft', 'session');
    }else {
        $('html, body').animate({
            scrollTop: cast
        }, 500);
    }
});