export const useCinemaSlider = () => {
    return {
        centeredSlides: true,
        centeredSlidesBounds: true,
        loop: true,
        slidesPerView: 1.44,
        spaceBetween: 0,
        speed: 1000,
        grabCursor: true,
        autoplay: {
            delay: 500,
            disableOnInteraction: false,
        },
        width: 1080,
    };
};
