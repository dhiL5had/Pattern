// JavaScript Document
(function($) {
    // function to Checkk the device
    function isDevice() {
        return ((/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase())))
    }
    // Elevate zoom init function
    function initZoom(width, height) {
        $.removeData('#zoom_10', 'elevateZoom');
        $('.zoomContainer').remove();
        $('.zoomWindowContainer').remove();
        $("#zoom_10").elevateZoom({
            responsive: true,
            tint: true,
            tintColour: '#E84C3C',
            tintOpacity: 0.5,
            easing: true,
            borderSize: 0,
            lensSize: 100,
            constrainType: "height",
            loadingIcon: "images/loading.GIF",
            containLensZoom: false,
            zoomWindowPosition: 1,
            zoomWindowOffetx: 20,
            zoomWindowWidth: width,
            zoomWindowHeight: height,
            gallery: 'gallery_pdp',
            galleryActiveClass: "active",
            zoomWindowFadeIn: 500,
            zoomWindowFadeOut: 500,
            lensFadeIn: 500,
            lensFadeOut: 500,
            cursor: "images/zoom-out.png",
        });
    }

    $(document).ready(function() {

        /* Text below the medium image */
        $("body").delegate(".zoomContainer", "mouseenter", function() {
            $(".hint-pdp-img").text("Click to open expanded view");
        });
        $("body").delegate(".zoomContainer", "mouseleave", function() {
            $(".hint-pdp-img").text("Roll over the image to zoom in");
        });

        /* init vertical carousel if thumb image length greater that 4 */
        if ($("#gallery_pdp a").length > 4) {
            $("#gallery_pdp a").css("margin", "0");
            $("#gallery_pdp").rcarousel({
                orientation: "vertical",
                visible: 4,
                width: 105,
                height: 70,
                margin: 5,
                step: 1,
                speed: 500,
            });
            $("#ui-carousel-prev").show();
            $("#ui-carousel-next").show();
        }

        /* calling Init elevate Product zoom */
        initZoom(500, 475);

        /* re-init elevatezoom on vertical carousel up and down key press */

        $("#ui-carousel-prev").click(function() {
            initZoom(500, 475);
        });

        $("#ui-carousel-next").click(function() {
            initZoom(500, 475);
        });

        // setting the image with to the zoom container
        $(".zoomContainer").width($("#zoom_10").width());

        /* enlarge gallery init using fancy along with carousel */
        $("#zoom_10").bind("click", function(e) {
            if (!$.browser.mobile && ($(window).width() > 768) && !isDevice()) {
                var ez = $('#zoom_10').data('elevateZoom');
                console.log(ez);
                //ez.getGalleryList()
                $.fancybox(ez.getGalleryList(), {
                    wrapCSS: 'pdp_enl_opt',
                    autoSize: true,
                    autoCenter: true,
                    scrolling: 'no',
                    openEffect: 'fade',
                    nextEffect: 'fade',
                    prevEffect: 'fade',
                    openSpeed: 300,
                    closeSpeed: 400,
                    afterLoad: function() {
                        $(".enl_butt").clone().appendTo(".fancybox-inner");
                        $(".mega_enl").clone().appendTo(".fancybox-inner");
                    },
                    beforeLoad: function() {
                        $(".fancybox-inner .enl_butt").remove();
                        $(".fancybox-inner .mega_enl").remove();

                    },
                    helpers: {
                        overlay: {
                            css: {
                                'background': 'rgba(21, 20, 20, 0.8)'
                            }
                        }
                    },

                });
                return false;
            }
        });

        $("body").delegate(".enl_fclose", "click", function() {
            $.fancybox.close()
        });

        $("body").delegate(".enl_fleft", "click", function() {
            $.fancybox.prev()
        });

        $("body").delegate(".enl_fright", "click", function() {
            $.fancybox.next()
        });

        /* Init Mega enlarge option image panning */
        $("body").delegate(".fancybox-image", "click", function() {
            $(".fancybox-inner .mega_enl ").show();
            $(".fancybox-image").clone().appendTo(".mega_enl");
            $(".mega_enl .fancybox-image").attr("id", "panic");
            $(".mega_enl .fancybox-image").removeClass();
            $(".mega_enl img").imagePanning();
        });

        $("body").delegate(".fancybox-inner .mega_enl", "click", function() {
            $(this).html("");
            $(this).hide();
        });

    });

    //Re init elevatezoom on browser resize

    $(window).resize(function() {
        var docWidth = $(document).width();
        if (docWidth > 769) {
            initZoom(500, 475);
        } else {
            $.removeData('#zoom_10', 'elevateZoom');
            $('.zoomContainer').remove();
            $('.zoomWindowContainer').remove();
            $("#zoom_10").elevateZoom({
                responsive: true,
                tint: false,
                tintColour: '#3c3c3c',
                tintOpacity: 0.5,
                easing: true,
                borderSize: 0,
                loadingIcon: "../images/loading.GIF",
                zoomWindowPosition: "productInfoContainer",
                zoomWindowWidth: 330,
                gallery: 'gallery_pdp',
                galleryActiveClass: "active",
                zoomWindowFadeIn: 500,
                zoomWindowFadeOut: 500,
                lensFadeIn: 500,
                lensFadeOut: 500,
                cursor: "images/zoom-out.png",
            });

        }
    })
})(jQuery)
