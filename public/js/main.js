require('../../node_modules/bulma/css/bulma.min.css');
require('../css/styles.css');

require('../../node_modules/jquery/dist/jquery.min.js');
const moment = require('../../node_modules/moment/min/moment.min.js');
require('../../node_modules/@fortawesome/fontawesome-free/js/all.min.js');

const { showNotification } = require('../../utils/utils');

$(document).ready(() => {
  // MODALS FUNCTIONALITY
  const modalBtns = document.querySelectorAll('.modalBtn'),
    closeBtns = document.querySelectorAll('.closeBtn'),
    cancelBtns = document.querySelectorAll('.cancel');

  modalBtns.forEach((modalBtn) => {
    modalBtn.addEventListener('click', () => {
      const modal = modalBtn.getAttribute('data-modal');
      const createStoryMainBtn = modalBtn.getAttribute('data-notloggedin');
      if (createStoryMainBtn === 'true') {
        return window.location.replace('/login');
      }
      document.getElementById(modal).style.display = 'block';
    });
  });

  closeBtns.forEach((closeBtn) => {
    closeBtn.addEventListener('click', () => {
      const modal = closeBtn.closest('.modal');
      modal.style.display = 'none';
    });
  });

  cancelBtns.forEach((cancelBtn) => {
    cancelBtn.addEventListener('click', () => {
      const modal = cancelBtn.closest('.modal');
      modal.style.display = 'none';
    });
  });

  window.onclick = (e) => {
    e.target.className === 'modal' ? (event.target.style.display = 'none') : '';
  };

  ////////////////////////////////////////////

  // HANDLE CREATE STORY FUNCTIONALITY
  $('#newStoryForm').submit(handleCreateStory);

  function handleCreateStory(e) {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const story = document.getElementById('story').value.trim();
    if (!title || !story) {
      const modalElement = document.getElementById('newStoryForm');

      modalElement.insertAdjacentHTML(
        'afterbegin',
        `
    <div class="box has-text-centered" style="margin-top: .75rem">
      <small class="has-text-danger"><i class="fas fa-exclamation-circle"></i> Please, fill all the required fields!</small>
    </div>`
      );
      return;
    }

    const formData = new FormData(this);

    $.ajax({
      url: '/stories',
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      type: 'POST', // For jQuery < 1.9
      success: function (data) {
        const output = generateStoryHtmlString(data[0]);
        $('.columns').prepend(output);
        showNotification('Story has been created successfully!', 'is-success');
        document.querySelector('.modal').style.display = 'none';
        $('#title, #story, #image').val('');
      },
      error: (xhr, status, error) => {
        document.querySelector('.modal').style.display = 'none';
        showNotification(error, 'is-danger');
      },
    });
  }

  // HANDLE UPDATE STORY FORM
  $('#editStoryForm').submit(handleUpdateStory);

  function handleUpdateStory(e) {
    e.preventDefault();

    const formData = new FormData(this);
    const actionUrl = $(this).attr('action');
    $.ajax({
      url: actionUrl,
      data: formData,
      type: 'PUT',
      cache: false,
      contentType: false,
      processData: false,
      success: (data) => {
        $('.title').html(data[0].title);
        $('.story').html(data[0].story);
        $('.story').html(data[0].story);
        $('img.img').attr('src', '/' + data[0].image);
        document.querySelector('.modal').style.display = 'none';
        showNotification('Story has been updated successfully!', 'is-success');
      },
      error: function (xhr, status, error) {
        document.querySelector('.modal').style.display = 'none';
        showNotification(error, 'is-danger');
      },
    });
  }

  // HANDLE DELETE STORY FUNCTIONALITY
  $('#deleteStoryForm').on('submit', handleDeleteStory);

  function handleDeleteStory(e) {
    e.preventDefault();
    const confirmResponse = confirm(
      'Are you sure you want to delete this item?'
    );
    if (confirmResponse) {
      const actionUrl = $(this).attr('action');
      const formData = $(this).serialize();

      $.ajax({
        url: actionUrl,
        type: 'DELETE',
        data: formData,
        success: function (data) {
          window.location.href = '/stories';
          setTimeout(
            showNotification(
              'Story has been deleted successfully!',
              'is-success'
            ),
            600
          );
        },
        error: function (xhr, status, error) {
          showNotification(error, 'is-danger');
        },
      });
    }
  }

  // SEARCH FUNCTIONALITY
  $('#search').on('input', searchStories);

  function searchStories(e) {
    const url = `/stories?search=${encodeURIComponent(e.target.value)}`;

    $.getJSON(url, function (data) {
      $('.columns').empty();

      data.forEach(function (story) {
        const output = generateStoryHtmlString(story);
        $('.columns').append(output);
      });
    });
  }

  // Check for click events on the navbar burger icon
  $('.navbar-burger').click(function () {
    // Toggle the "is-active" class on both the "navbar-burger" and the "navbar-menu"
    $('.navbar-burger').toggleClass('is-active');
    $('.navbar-menu').toggleClass('is-active');
  });

  const recognition = new webkitSpeechRecognition();
  const micro = document.querySelector('span.micro');
  const story = document.getElementById('story');

  if (micro) {
    micro.onclick = function () {
      recognition.start();
    };
  }

  recognition.onresult = function (e) {
    story.textContent += e.results[0][0].transcript ?? '';
  };

  // HANDLE NEW COMMENT FUNCTIONALITY
  $('#newCommentStoryForm').submit(handleCommentCreate);

  function handleCommentCreate(e) {
    e.preventDefault();

    const comment = $(this).serialize();
    const actionUrl = $(this).attr('action');
    $.post(`${actionUrl}`, comment, function (data) {
      const output = `
      <article class="media">
      <figure class="media-left">
        <p class="image is-64x64">
          <img src="https://bulma.io/images/placeholders/128x128.png">
        </p>
      </figure>
      <div class="media-content">
        <div class="content">
          <span>
            <strong><small>@${data[0].username}</small></strong>
          </span>
          <p>
            ${data[0].comment}
          </p>
        </div>

        <nav class="level is-mobile">
            <div class="level-left">
              <a class="level-item">
                <span class="icon is-small editCommentBtn"><i class="fas fa-edit"></i></span>
              </a>
            </div>
          </nav>

          <!-- this form is not displaying until user clicks the edit icon to update comment -->
          <form action="/stories/${data[0].storyId}/comments/${data[0].commentId}" method="POST" id="editCommentForm">
            <div class="field">
              <p class="control">
              <textarea class="textarea" rows="2" name="editedComment">${data[0].comment}</textarea>
              </p>
            </div>
            <button type="submit" class="button is-warning is-small">Update</button>
          </form>
          </div>

          <div class="media-right">
            <form action="/stories/${data[0].storyId}/comments/${data[0].commentId}" method="POST" id="deleteCommentForm">
              <button type="submit" class="delete"></button>
            </form>
          </div>
        </article>
    `;
      $('#comments').prepend(output);
      $('.textarea').val('');
    });
  }

  // HANDLE UPDATE COMMENT FUNCTIONALITY
  $('#comments').on('click', '.editCommentBtn', function () {
    $(this).parents().eq(2).next().fadeToggle();
  });

  $('#comments').on('submit', '#editCommentForm', handleUpdateComment);

  function handleUpdateComment(e) {
    e.preventDefault();

    const commentData = $(this).serialize();
    const actionUrl = $(this).attr('action');

    const $itemToUpdate = $(this).parent().find('.content p');
    const editCommentForm = $(this);
    $.ajax({
      url: actionUrl,
      data: commentData,
      type: 'PUT',
      success: function (data) {
        $itemToUpdate.html(data[0].comment);
        editCommentForm.fadeToggle(); // close form editing when comment update successfully
      },
      error: function (xhr, status, error) {
        showNotification(error, 'is-danger');
      },
    });
  }

  // HANDLE DELETE COMMENT FUNCTIONALITY
  $('#comments').on('submit', '#deleteCommentForm', handleDeleteComment);

  function handleDeleteComment(e) {
    e.preventDefault();
    const confirmResponse = confirm(
      'Are you sure you want to delete this comment?'
    );
    const $commentToDelete = $(this).parents('.media');
    if (confirmResponse) {
      const actionUrl = $(this).attr('action');
      $.ajax({
        url: actionUrl,
        type: 'DELETE',
        success: function (data) {
          $commentToDelete.remove();
        },
        error: function (xhr, status, error) {
          showNotification(error, 'is-danger');
        },
      });
    }
  }

  function generateStoryHtmlString(data) {
    const output = `<div class="column is-one-quarter-desktop is-one-third-tablet">
      <div class="card">
        <div class="card-image">
          <figure class="image is-4by3">
            <img src="${
              data.image
                ? data.image
                : 'https://bulma.io/images/placeholders/1280x960.png'
            }" alt="Story Image">
          </figure>
        </div>
        <div class="card-content">
          <div class="media">
            <div class="media-left">
              <figure class="image is-48x48">
                <img src="https://bulma.io/images/placeholders/96x96.png" alt="User Image">
              </figure>
            </div>
            <div class="media-content">
              <p class="title is-6">${data.title.substring(0, 25)}</p>
              <p class="subtitle is-7">@${data.username}</p>
            </div>
          </div>

          <div class="content">
            <p class="left">${data.story.substring(0, 100) + '...'}</p>
            <time datetime="2016-1-1">
              <small>${moment(data.created_at).format('LLL')}</small>
            </time>
          </div>
          <div class="has-text-centered">
            <a href="stories/${data.storyId}" class="button is-dark">
              <span class="icon"><i class="fas fa-eye"></i></span>
              <span>Read More</span>
            </a>
          </div>
        </div>
      </div>
    </div>`;
    return output;
  }

  $('body').on('click', '.deleteNotification', () => {
    $('.message').remove();
  });

  $('input[type="file"].file-input').change((e) => {
    $('.file-name').remove();
    const fileName = e.target.files[0].name;
    $('label.file-label').append(`<span class="file-name">${fileName}</span>`);
  });
});
