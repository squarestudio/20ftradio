$(function(){
    $(window).on('load', function () {

        if(!sessionStorage.getItem('20ft'))
        {
            var cast = $('.castWrapper').height();
            console.log(cast);
        }else {

        }
    });
});