$(function(){
    if(!sessionStorage.getItem('20ft'))
    {
        var cast = $('.castWrapper').innerHeight();
        $('html, body').animate({
            scrollTop: cast
        }, 1000);
    }else {

    }
});