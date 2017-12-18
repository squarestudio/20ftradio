$(function(){
    $(window).on('load', function () {

        if(!sessionStorage.getItem('20ft'))
        {
            var cast = $('.castWrapper').innerHeight();
            console.log(cast);
        }else {

        }
    });
});