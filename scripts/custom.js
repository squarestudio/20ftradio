$(function(){
    if(sessionStorage.getItem('20ft'))
    {
        var cast = $('.castWrapper').height();
        console.log(cast);
    }else
    {
        sessionStorage.setItem('20ft', 'session');
    }
});