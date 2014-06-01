$(window).load(function() {
  $("body").removeClass("preload");
});

$(document).ready(function(){
  setInterval(function(){
    if($(".selected").offset().top + $(".selected").height()/2 > ($(window).height()/2) + 10){
      $("#offset").css("margin-top", function(index, curValue){
        return parseInt(curValue, 10) - ($(".selected").offset().top + $(".selected").height()/2 - $(window).height()/2)*3/4 + 'px';
      });
    } else if($(".selected").offset().top + $(".selected").height()/2 < ($(window).height()/2) - 10){
      $("#offset").css("margin-top", function(index, curValue){
        return parseInt(curValue, 10) + ($(window).height()/2 - $(".selected").height()/2 - $(".selected").offset().top)*3/4 + 'px';
      });
    }
  }, 100);

  $(".about-list-item").click(function(){
    var data = $(".selected").data("modal-bind");
    $(".selected").removeClass("selected");
    $("body").find("[data-modal='" + data + "']").removeClass("visible");
    $("body").find("[data-img='"  + data + "']").removeClass("visible");
    $(this).addClass("selected");
    data = $(this).data("modal-bind");
    $("body").find("[data-modal='" + data + "']").addClass("visible");
    $("body").find("[data-img='"  + data + "']").addClass("visible");
  });
});