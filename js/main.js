

(function($) {
  'use strict';
  $(function() {
    /*----------- Globals -----------*/

    /* Lity setup */
    $(document).on('click', '[data-lightbox]', lity.options('template', '<div class="lity" role="dialog" aria-label="Dialog Window (Press escape to close)" tabindex="-1"><div class="lity-wrap" data-lity-close role="document"><div class="lity-loader" aria-hidden="true">Loading...</div><div class="lity-container"><div class="lity-content"></div><div class="lity-close" data-lity-close aria-label="Close (Press escape to close)"><span class="btn-line"></span></div></div></div></div>'));

    /*----------- Navbar -----------*/

    /* Lightboxes setup */
    $('.navbar .navbar-nav .nav-link[href^="#"]').each(function() {
      $(this).animatedModal({
        animatedIn: 'fadeIn',
        animatedOut: 'fadeOut',
        animationDuration: '0s',
        beforeOpen: function() {
          $('#overlay-effect').addClass('animate-up').removeClass('animate-down');
          $('#' + this.modalTarget).css({
            'animationDelay': '.5s',
            'animationFillMode': 'both'
          });
        },
        afterOpen: function() {
          $('#' + this.modalTarget).css({
            'animationFillMode': 'none'
          });
        },
        beforeClose: function() {
          $('#overlay-effect').addClass('animate-down').removeClass('animate-up');
          $('#' + this.modalTarget).css({
            'animationDelay': '.5s',
            'animationFillMode': 'both'
          });
        },
        afterClose: function() {
          $('#' + this.modalTarget).css({
            'animationFillMode': 'none'
          });
        }
      });
    });

    $('.lightbox-wrapper').each(function() {
      if (!$('.navbar .navbar-nav .nav-link[href^="#' + this.id + '"]').length) {
        $(this).hide();
      }
    });

    /* Hides the the mobile navbar dropdown when the user clicks outside of it */
    $(document).on('mouseup', function(event) {
      if ($('.navbar #navbarSupportedContent').hasClass('show')) {
        // The mobile Bootstrap navbar dropdown
        var navbarToggler = $('.navbar .navbar-menu');
        if (!navbarToggler.is(event.target) && navbarToggler.has(event.target).length === 0) {
          navbarToggler.trigger('click');
        }
      }
    });

    /*----------- Home -----------*/

    /* Animated heading text */
    (function() {
      // Set animation timing
      var animationDelay = 2500,
        // Clip effect
        revealDuration = 660,
        revealAnimationDelay = 1500;

      initHeadline();

      function initHeadline() {
        // Initialise headline animation
        animateHeadline($('.cd-headline'));
      }

      function animateHeadline($headlines) {
        var duration = animationDelay;
        $headlines.each(function() {
          var headline = $(this);
          if (headline.hasClass('clip')) {
            var spanWrapper = headline.find('.cd-words-wrapper'),
              newWidth = spanWrapper.width() + 10;
            spanWrapper.css('width', newWidth);
          }

          //trigger animation
          setTimeout(function() {
            hideWord(headline.find('.is-visible').eq(0));
          }, duration);
        });
      }

      function hideWord($word) {
        var nextWord = takeNext($word);

        if ($word.parents('.cd-headline').hasClass('clip')) {
          $word.parents('.cd-words-wrapper').animate({
            width: '2px'
          }, revealDuration, function() {
            switchWord($word, nextWord);
            showWord(nextWord);
          });

        }
      }

      function showWord($word, $duration) {
        if ($word.parents('.cd-headline').hasClass('clip')) {
          $word.parents('.cd-words-wrapper').animate({
            'width': $word.width() + 10
          }, revealDuration, function() {
            setTimeout(function() {
              hideWord($word);
            }, revealAnimationDelay);
          });
        }
      }


      function takeNext($word) {
        return (!$word.is(':last-child')) ? $word.next() : $word.parent().children().eq(0);
      }

      function takePrev($word) {
        return (!$word.is(':first-child')) ? $word.prev() : $word.parent().children().last();
      }

      function switchWord($oldWord, $newWord) {
        $oldWord.removeClass('is-visible').addClass('is-hidden');
        $newWord.removeClass('is-hidden').addClass('is-visible');
      }
    }())

    /* Home variants manager */

    // If Video variant
    if ($('.home-area').hasClass('video-variant')) {
      $('#homeVideo').YTPlayer();
    }

    /*----------  Resume: Skills  ----------*/

    (function() {
      var initPercentageElement = function() {
        $('#resume .skills-section .single-skill').each(function() {
          var percentage = Math.min(100, Math.max(0, $(this).data('percentage')));
          var barWidth = $(this).find('.skill-progress').outerWidth(true);
          var percentageElementOffset = barWidth - (barWidth * (percentage / 100));
          $(this).find('.skill-percentage').text(percentage + '%').css('margin-right', percentageElementOffset);
          $(this).find('.progress-bar').attr('aria-valuenow', percentage).css('width', percentage + '%');
        });
      }
      initPercentageElement();
      $(window).on('resize', function() {
        initPercentageElement();
      });
    }());

    /*----------  Portfolio: Portfolio  ----------*/

    (function() {
      /* Setup Isotope */
      var grid = $('#portfolio .portfolio-section .portfolio-grid');
      var filters = $('#portfolio .portfolio-section .filter-control li');
      grid.imagesLoaded(function() {
        grid.isotope({
          itemSelector: '#portfolio .portfolio-section .single-item',
        });
        filters.on('click', function() {
          filters.removeClass('tab-active');
          $(this).addClass('tab-active');
          var selector = $(this).data('filter');
          grid.isotope({
            filter: selector,
            transitionDuration: '.25s'
          });
        });
      });
    }())

    /*----------- Contact: Contact -----------*/

    $('#contact .contact-section .contact-form').on('submit', function(event) {
      var form = $(this);
      var submitBtn = form.find('#contact-submit');
      var submitBtnText = submitBtn.text();
      var feedbackEl = form.find('.contact-feedback');
      event.preventDefault();
      // Waiting for the response from the server
      submitBtn.html('Wait...').addClass('wait').prop('disabled', true);
      setTimeout(function() {
        // Posts the Form's data to the server using Ajax
        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            data: form.serialize(),
          })
          // Getting a response from the server
          .done(function(response) {
            // If the PHP file succeed sending the message
            if (response == 'success') {
              // Feedback to the user
              submitBtn.removeClass('wait').html('Success').addClass('success');
              feedbackEl.addClass('success').html('Thank you for your message. It has been sent.').fadeIn(200);
              setTimeout(function() {
                submitBtn.html(submitBtnText).removeClass('success').prop('disabled', false);
                feedbackEl.fadeOut(200).removeClass('success').html('');
              }, 6000);
              // Clears the Form
              form[0].reset();
              // If something is wrong
            } else {
              // Feedback to the user
              console.log(response);
              submitBtn.removeClass('wait').html('Error').addClass('error');
              feedbackEl.addClass('error').html('Server error! Please check your browser console log for more details.').fadeIn(200);
              setTimeout(function() {
                submitBtn.html(submitBtnText).removeClass('error').prop('disabled', false);
                feedbackEl.fadeOut(200).removeClass('error').html('');
              }, 6000);
            }
          });
      }, 1000);
    });

  });
  $(window).on('load', function() {
    /*----------- Preloader -----------*/

    $('.preloader-icon').fadeOut(400);
    $('.preloader').delay(500).fadeOut('slow');

  });
}(jQuery));